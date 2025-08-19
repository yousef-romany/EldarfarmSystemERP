'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

const paymentSchema = z.object({
  walletId: z.string().min(1, "يجب تحديد المحفظة"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
});

const purchaseSchema = z.object({
  isBatch: z.boolean(),
  tagId: z.string().optional(),
  quantity: z.coerce.number().optional(),
  livestockTypeId: z.string().min(1, "يجب تحديد نوع الحيوان"),
  breed: z.string().min(1, "السلالة مطلوبة"),
  weight: z.coerce.number().positive("الوزن يجب أن يكون رقمًا موجبًا"),
  age: z.coerce.number().positive("العمر يجب أن يكون رقمًا موجبًا"),
  purchaseDate: z.string().min(1, "تاريخ الشراء مطلوب"),
  barnId: z.string().min(1, "يجب تحديد العنبر"),
  supplier: z.string().optional(),
  totalCost: z.coerce.number().positive("التكلفة الإجمالية يجب أن تكون أكبر من صفر"),
  payments: z.array(paymentSchema),
});

type PurchaseState = {
  errors?: z.ZodError<typeof purchaseSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createPurchase(prevState: PurchaseState, formData: FormData): Promise<PurchaseState> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect('/');
  }

  if (!session.permissions?.purchases?.add) {
    return {
      message: 'ليس لديك الصلاحية لإضافة عمليات شراء.',
      success: false,
    };
  }

  const isBatch = formData.get('isBatch') === 'true';
  const paymentsData = JSON.parse(formData.get('payments') as string || '[]');

  const validatedFields = purchaseSchema.safeParse({
    isBatch,
    tagId: formData.get('tagId'),
    quantity: formData.get('quantity'),
    livestockTypeId: formData.get('livestockTypeId'),
    breed: formData.get('breed'),
    weight: formData.get('weight'),
    age: formData.get('age'),
    purchaseDate: formData.get('purchaseDate'),
    barnId: formData.get('barnId'),
    supplier: formData.get('supplier'),
    totalCost: formData.get('totalCost'),
    payments: paymentsData,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة. يرجى مراجعة الحقول.',
      success: false,
    };
  }
  
  const { totalCost, payments, barnId, quantity } = validatedFields.data;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  if (Math.abs(totalPaid - totalCost) > 0.01) {
      return { message: 'مجموع الدفعات يجب أن يساوي التكلفة الإجمالية.', success: false };
  }

  try {
    const barn = await prisma.barn.findUnique({ where: { id: barnId } });
    const occupancyNeeded = quantity || 1;
    if (!barn || barn.capacity - barn.currentOccupancy < occupancyNeeded) {
        return { message: 'سعة العنبر المحددة غير كافية.', success: false };
    }
    
    for (const payment of payments) {
        const wallet = await prisma.wallet.findUnique({ where: { id: payment.walletId } });
        if (!wallet || wallet.balance.toNumber() < payment.amount) {
            return { message: `رصيد محفظة "${wallet?.name}" غير كافٍ لإتمام عملية الدفع.`, success: false };
        }
    }


    await prisma.$transaction(async (tx) => {
      // 1. Create Livestock
      const livestock = await tx.livestock.create({
        data: {
          isBatch: validatedFields.data.isBatch,
          tagId: validatedFields.data.tagId,
          quantity: validatedFields.data.quantity,
          livestockTypeId: validatedFields.data.livestockTypeId,
          breed: validatedFields.data.breed,
          weight: validatedFields.data.weight,
          age: validatedFields.data.age,
          barnId: validatedFields.data.barnId,
          status: 'Available',
          cost: validatedFields.data.totalCost,
        }
      });

      // 2. Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          livestockId: livestock.id,
          supplier: validatedFields.data.supplier,
          purchaseDate: new Date(validatedFields.data.purchaseDate),
          totalCost: validatedFields.data.totalCost,
          amountPaid: totalPaid,
          remainingAmount: totalCost - totalPaid,
        }
      });
      
      // 3. Create Payment records and link to purchase
      if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map(p => ({
            amount: p.amount,
            walletId: p.walletId,
            purchaseId: purchase.id,
            date: new Date(),
            type: 'Expense',
            description: `دفعة لشراء الحيوان/الدفعة رقم ${livestock.tagId || livestock.id}`
          }))
        });
      }

      // 4. Update wallet balances
      for (const payment of payments) {
        await tx.wallet.update({
          where: { id: payment.walletId },
          data: { balance: { decrement: payment.amount } },
        });
      }

      // 5. Update barn occupancy
      await tx.barn.update({
        where: { id: validatedFields.data.barnId },
        data: { currentOccupancy: { increment: occupancyNeeded } },
      });

      // 6. Create Log entry
      await tx.log.create({
        data: {
          userId: session.userId!,
          action: 'CREATE',
          entityType: 'PURCHASE',
          entityId: purchase.id,
          details: `تسجيل عملية شراء جديدة للحيوان ${livestock.tagId || livestock.id} بتكلفة إجمالية ${totalCost}.`
        }
      });

    });

    revalidatePath('/purchases');
    revalidatePath('/dashboard');
    return { message: 'تم تسجيل عملية الشراء بنجاح!', success: true };

  } catch (error) {
    console.error('Error creating purchase:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known errors, like unique constraint violations
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('tagId')) {
            return { message: `فشل في تسجيل الشراء: الرقم التعريفي '${validatedFields.data.tagId}' مستخدم بالفعل.`, success: false };
       }
        return { message: `فشل في تسجيل الشراء: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل عملية الشراء. حدث خطأ غير متوقع.', success: false };
  }
}

export async function deletePurchase(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.permissions?.purchases?.delete) {
        return { message: 'ليس لديك الصلاحية لحذف المشتريات.', success: false };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.findUnique({
                where: { id },
                include: { payments: true, livestock: true }
            });

            if (!purchase) {
                throw new Error('عملية الشراء غير موجودة.');
            }

            // 1. Reverse wallet transactions
            for (const payment of purchase.payments) {
                await tx.wallet.update({
                    where: { id: payment.walletId },
                    data: { balance: { increment: payment.amount } }
                });
            }

            // 2. Decrement barn occupancy
            const occupancyToDecrement = purchase.livestock.quantity || 1;
            await tx.barn.update({
                where: { id: purchase.livestock.barnId },
                data: { currentOccupancy: { decrement: occupancyToDecrement } }
            });

            // 3. Delete associated payments
            await tx.payment.deleteMany({
                where: { purchaseId: id }
            });

            // 4. Delete the purchase record
            await tx.purchase.delete({
                where: { id }
            });

            // 5. Delete the livestock record
            await tx.livestock.delete({
                where: { id: purchase.livestockId }
            });

            // 6. Log the deletion
            await tx.log.create({
                data: {
                    userId: session.userId!,
                    action: 'DELETE',
                    entityType: 'PURCHASE',
                    entityId: id,
                    details: `قام بحذف عملية الشراء للحيوان ${purchase.livestock.tagId || purchase.livestock.id}.`
                }
            });
        });

        revalidatePath('/purchases');
        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        revalidatePath('/dashboard');
        revalidatePath('/barns');
        return { message: 'تم حذف عملية الشراء بنجاح.', success: true };

    } catch (error) {
        console.error('Error deleting purchase:', error);
        return { message: 'فشل في حذف عملية الشراء.', success: false };
    }
}
