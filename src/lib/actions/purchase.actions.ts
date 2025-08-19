
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
  
  const { totalCost, payments } = validatedFields.data;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  if (totalPaid > totalCost) {
      return { message: 'المبلغ المدفوع لا يمكن أن يكون أكبر من التكلفة الإجمالية.', success: false };
  }

  try {
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
        data: { currentOccupancy: { increment: validatedFields.data.quantity || 1 } },
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
        return { message: `فشل في تسجيل الشراء: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل عملية الشراء. حدث خطأ غير متوقع.', success: false };
  }
}
