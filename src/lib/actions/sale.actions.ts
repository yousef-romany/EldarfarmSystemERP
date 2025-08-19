
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

const saleSchema = z.object({
  livestockId: z.string().min(1, "يجب تحديد الحيوان"),
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  saleDate: z.string().min(1, "تاريخ البيع مطلوب"),
  pricePerKg: z.coerce.number().positive("سعر الكيلو يجب أن يكون أكبر من صفر"),
  initialWeight: z.coerce.number().positive("الوزن يجب أن يكون أكبر من صفر"),
  totalPrice: z.coerce.number().positive("السعر الإجمالي يجب أن يكون أكبر من صفر"),
  isDeferred: z.boolean(),
  payments: z.array(paymentSchema),
});

type SaleState = {
  errors?: z.ZodError<typeof saleSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createSale(prevState: SaleState, formData: FormData): Promise<SaleState> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect('/');
  }

  if (!session.permissions?.sales?.add) {
    return { message: 'ليس لديك الصلاحية لتسجيل المبيعات.', success: false };
  }

  const isDeferred = formData.get('isDeferred') === 'true';
  const paymentsData = JSON.parse(formData.get('payments') as string || '[]');

  const validatedFields = saleSchema.safeParse({
    livestockId: formData.get('livestockId'),
    customerName: formData.get('customerName'),
    saleDate: formData.get('saleDate'),
    pricePerKg: formData.get('pricePerKg'),
    initialWeight: formData.get('initialWeight'),
    totalPrice: formData.get('totalPrice'),
    isDeferred,
    payments: paymentsData,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة. يرجى مراجعة الحقول.',
      success: false,
    };
  }

  const { livestockId, totalPrice, payments, initialWeight } = validatedFields.data;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  if (!isDeferred && totalPaid < totalPrice) {
     return { message: 'في البيع الفوري، يجب أن يكون المبلغ المدفوع مساوياً للسعر الإجمالي.', success: false };
  }
   if (isDeferred && totalPaid === 0) {
     return { message: 'في البيع الآجل، يجب دفع عربون.', success: false };
  }
  if (totalPaid > totalPrice) {
    return { message: 'المبلغ المدفوع لا يمكن أن يكون أكبر من السعر الإجمالي.', success: false };
  }

  try {
    const livestock = await prisma.livestock.findUnique({ where: { id: livestockId } });
    if (!livestock || livestock.status !== 'Available') {
        return { message: 'الحيوان المحدد غير متاح للبيع.', success: false };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Sale record
      const sale = await tx.sale.create({
        data: {
          livestockId: validatedFields.data.livestockId,
          customerName: validatedFields.data.customerName,
          saleDate: new Date(validatedFields.data.saleDate),
          type: isDeferred ? 'Deferred' : 'Immediate',
          status: isDeferred ? 'Pending' : 'Completed',
          pricePerKg: validatedFields.data.pricePerKg,
          initialWeight: validatedFields.data.initialWeight,
          finalWeight: isDeferred ? null : validatedFields.data.initialWeight,
          totalPrice: validatedFields.data.totalPrice,
          amountPaid: totalPaid,
          remainingAmount: totalPrice - totalPaid,
        }
      });

      // 2. Create Payment records and link to sale
       if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map(p => ({
            amount: p.amount,
            walletId: p.walletId,
            saleId: sale.id,
            date: new Date(),
            type: 'Income',
            description: `دفعة من بيع الحيوان/الدفعة رقم ${livestock.tagId || livestock.id}`
          }))
        });
      }
      
      // 3. Update wallet balances
      for (const payment of payments) {
        await tx.wallet.update({
          where: { id: payment.walletId },
          data: { balance: { increment: payment.amount } },
        });
      }

      // 4. Update Livestock status
      await tx.livestock.update({
        where: { id: livestockId },
        data: {
          status: isDeferred ? 'PendingSale' : 'Sold',
        }
      });
      
      // 5. Update barn occupancy
      await tx.barn.update({
        where: { id: livestock.barnId },
        data: { currentOccupancy: { decrement: livestock.quantity || 1 } },
      });

      // 6. Create Log entry
      await tx.log.create({
        data: {
          userId: session.userId!,
          action: 'CREATE',
          entityType: 'SALE',
          entityId: sale.id,
          details: `تسجيل عملية بيع ${isDeferred ? 'آجل' : 'فوري'} للحيوان ${livestock.tagId || livestock.id} للعميل ${validatedFields.data.customerName}.`
        }
      });
    });

    revalidatePath('/sales');
    revalidatePath('/dashboard');
    return { message: `تم تسجيل عملية البيع ${isDeferred ? 'الآجل' : 'الفوري'} بنجاح!`, success: true };

  } catch (error) {
    console.error('Error creating sale:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { message: `فشل في تسجيل البيع: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل عملية البيع. حدث خطأ غير متوقع.', success: false };
  }
}
