
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

const contributionSchema = z.object({
  donorName: z.string().min(1, "اسم المانح مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  date: z.string().min(1, "تاريخ الاستلام مطلوب"),
  totalAmount: z.coerce.number().positive("المبلغ الإجمالي يجب أن يكون أكبر من صفر"),
  payments: z.array(paymentSchema).min(1, "يجب تحديد دفعة واحدة على الأقل"),
});

type ContributionState = {
  errors?: z.ZodError<typeof contributionSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createContribution(prevState: ContributionState, formData: FormData): Promise<ContributionState> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect('/');
  }

  // Assuming 'contributions' is a permission key
  if (!session.permissions?.contributions?.add) {
    return {
      message: 'ليس لديك الصلاحية لإضافة مساهمات.',
      success: false,
    };
  }

  const paymentsData = JSON.parse(formData.get('payments') as string || '[]');
  
  const validatedFields = contributionSchema.safeParse({
    donorName: formData.get('donorName'),
    description: formData.get('description'),
    date: formData.get('date'),
    totalAmount: formData.get('totalAmount'),
    payments: paymentsData,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة. يرجى مراجعة الحقول.',
      success: false,
    };
  }

  const { totalAmount, payments, donorName } = validatedFields.data;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  if (Math.abs(totalPaid - totalAmount) > 0.01) { // Use a tolerance for float comparison
      return { message: 'مجموع الدفعات يجب أن يساوي المبلغ الإجمالي للمساهمة.', success: false };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Contribution record
      const contribution = await tx.contribution.create({
        data: {
          donorName: validatedFields.data.donorName,
          description: validatedFields.data.description,
          date: new Date(validatedFields.data.date),
          totalAmount: validatedFields.data.totalAmount,
        }
      });

      // 2. Create Payment records and link to contribution
      await tx.payment.createMany({
        data: payments.map(p => ({
          amount: p.amount,
          walletId: p.walletId,
          contributionId: contribution.id,
          date: new Date(validatedFields.data.date),
          type: 'Income',
          description: `مساهمة من ${donorName}: ${validatedFields.data.description}`
        }))
      });

      // 3. Update wallet balances
      for (const payment of payments) {
        await tx.wallet.update({
          where: { id: payment.walletId },
          data: { balance: { increment: payment.amount } },
        });
      }

      // 4. Create Log entry
      await tx.log.create({
        data: {
          userId: session.userId!,
          action: 'CREATE',
          entityType: 'CONTRIBUTION',
          entityId: contribution.id,
          details: `تسجيل مساهمة جديدة من ${donorName} بقيمة ${totalAmount}.`
        }
      });
    });

    revalidatePath('/contributions');
    revalidatePath('/daily-report');
    revalidatePath('/wallets');
    return { message: 'تم تسجيل المساهمة بنجاح!', success: true };

  } catch (error) {
    console.error('Error creating contribution:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { message: `فشل في تسجيل المساهمة: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل المساهمة. حدث خطأ غير متوقع.', success: false };
  }
}
