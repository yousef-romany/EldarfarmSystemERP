

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
  if (!session.isLoggedIn || !session.user?.id) {
    redirect('/login');
  }

  if (!session.user.permissions?.purchases?.add) {
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
  
  const { totalCost, payments, barnId, quantity, ...livestockData } = validatedFields.data;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  if (Math.abs(totalPaid - totalCost) > 0.01) {
      return { message: 'مجموع الدفعات يجب أن يساوي التكلفة الإجمالية.', success: false };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Livestock but keep it quarantined as it's a draft
      const livestock = await tx.livestock.create({
        data: {
          ...livestockData,
          barnId: barnId,
          status: 'Quarantined', // Keep it in a non-available state
          cost: totalCost,
        }
      });

      // 2. Create Purchase record with Draft status
      const purchase = await tx.purchase.create({
        data: {
          livestockId: livestock.id,
          supplier: livestockData.supplier,
          purchaseDate: new Date(livestockData.purchaseDate),
          totalCost: totalCost,
          amountPaid: totalPaid,
          remainingAmount: totalCost - totalPaid,
          status: 'Draft', // Set status to Draft
        }
      });
      
      // 3. Create Payment records but link them to the purchase draft
      if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map(p => ({
            amount: p.amount,
            walletId: p.walletId,
            purchaseId: purchase.id,
            date: new Date(),
            type: 'Expense',
            description: `[مسودة] دفعة لشراء ${livestock.tagId || livestock.id}`
          }))
        });
      }

      // DO NOT update wallet or barn occupancy yet. This happens on confirmation.

      // 4. Create Log entry for draft creation
      await tx.log.create({
        data: {
          userId: session.user!.id,
          action: 'CREATE',
          entityType: 'PURCHASE_DRAFT',
          entityId: purchase.id,
          details: `إنشاء مسودة شراء للحيوان ${livestock.tagId || livestock.id} بتكلفة ${totalCost}.`
        }
      });
    });

    revalidatePath('/purchases');
    return { message: 'تم حفظ مسودة الشراء بنجاح! يجب تأكيدها من قبل المدير.', success: true };

  } catch (error) {
    console.error('Error creating purchase draft:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('tagId')) {
            return { message: `فشل في حفظ المسودة: الرقم التعريفي '${validatedFields.data.tagId}' مستخدم بالفعل.`, success: false };
       }
        return { message: `فشل في حفظ المسودة: ${error.message}`, success: false };
    }
     if (error instanceof Prisma.PrismaClientValidationError) {
        return { message: `فشل في التحقق من صحة البيانات: ${error.message}`, success: false };
    }
    return { message: 'فشل في حفظ مسودة الشراء. حدث خطأ غير متوقع.', success: false };
  }
}

type ConfirmState = {
  message?: string | null;
  success?: boolean;
};

export async function confirmPurchase(prevState: ConfirmState, formData: FormData): Promise<ConfirmState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id) {
        redirect('/login');
    }
    
    if (!session.user.permissions?.purchases?.confirm) {
        return { message: 'ليس لديك الصلاحية لتأكيد عمليات الشراء.', success: false };
    }

    const purchaseId = formData.get('purchaseId') as string;
    if (!purchaseId) {
        return { message: 'معرف الشراء مطلوب.', success: false };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.findUnique({
                where: { id: purchaseId },
                include: { livestock: true, payments: true }
            });

            if (!purchase || purchase.status !== 'Draft') {
                throw new Error("لا يمكن تأكيد هذه العملية. قد تكون مكتملة بالفعل أو ملغاة.");
            }

            const { livestock, payments } = purchase;
            const occupancyNeeded = livestock.quantity || 1;

            // 1. Check wallet balances
            for (const payment of payments) {
                const wallet = await tx.wallet.findUnique({ where: { id: payment.walletId } });
                if (!wallet || wallet.balance.toNumber() < payment.amount.toNumber()) {
                    throw new Error(`رصيد محفظة "${wallet?.name}" غير كافٍ لإتمام عملية الدفع.`);
                }
            }
            
            // 2. Check barn capacity
            const barn = await tx.barn.findUnique({ where: { id: livestock.barnId } });
            if (!barn || barn.capacity - barn.currentOccupancy < occupancyNeeded) {
                throw new Error('سعة العنبر المحددة غير كافية.');
            }
            
            // 3. Update wallet balances by decrementing
            for (const payment of payments) {
                await tx.wallet.update({
                    where: { id: payment.walletId },
                    data: { balance: { decrement: payment.amount } }
                });
            }
            
            // 4. Update barn occupancy
            await tx.barn.update({
                where: { id: livestock.barnId },
                data: { currentOccupancy: { increment: occupancyNeeded } }
            });
            
            // 5. Update livestock status to 'Available'
            await tx.livestock.update({
                where: { id: livestock.id },
                data: { status: 'Available' }
            });
            
            // 6. Update purchase status to 'Completed'
            await tx.purchase.update({
                where: { id: purchaseId },
                data: { status: 'Completed' }
            });

            // 7. Log the confirmation
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE',
                    entityType: 'PURCHASE',
                    entityId: purchase.id,
                    details: `تأكيد عملية الشراء للحيوان ${livestock.tagId || livestock.id}.`
                }
            });
        });

        revalidatePath('/purchases');
        revalidatePath('/dashboard');
        revalidatePath('/wallets');
        return { message: 'تم تأكيد عملية الشراء بنجاح!', success: true };

    } catch (error: any) {
        console.error('Error confirming purchase:', error);
        return { message: `فشل تأكيد العملية: ${error.message}`, success: false };
    }
}


export async function deletePurchase(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.purchases?.delete) {
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

            // If the purchase was already completed, revert the transactions
            if (purchase.status === 'Completed') {
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
            }


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
                    userId: session.user!.id,
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
