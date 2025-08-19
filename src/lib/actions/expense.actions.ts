
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

const expenseSchema = z.object({
  description: z.string().min(1, "الوصف مطلوب"),
  date: z.string().min(1, "تاريخ المصروف مطلوب"),
  category: z.enum(['Feed', 'Vet', 'Maintenance', 'Other'], { required_error: "نوع المصروف مطلوب" }),
  amount: z.coerce.number().positive("المبلغ الإجمالي يجب أن يكون أكبر من صفر"),
  payments: z.array(paymentSchema).min(1, "يجب تحديد دفعة واحدة على الأقل"),
});

export type ExpenseState = {
  errors?: z.ZodError<typeof expenseSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createExpense(prevState: ExpenseState, formData: FormData): Promise<ExpenseState> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect('/');
  }

  if (!session.permissions?.expenses?.add) {
    return {
      message: 'ليس لديك الصلاحية لإضافة مصروفات.',
      success: false,
    };
  }

  const paymentsData = JSON.parse(formData.get('payments') as string || '[]');
  
  const validatedFields = expenseSchema.safeParse({
    description: formData.get('description'),
    date: formData.get('date'),
    category: formData.get('category'),
    amount: formData.get('amount'),
    payments: paymentsData,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة. يرجى مراجعة الحقول.',
      success: false,
    };
  }

  const { amount, payments, description, category } = validatedFields.data;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  if (Math.abs(totalPaid - amount) > 0.01) { // Use a tolerance for float comparison
      return { message: 'مجموع الدفعات يجب أن يساوي المبلغ الإجمالي للمصروف.', success: false };
  }

  try {
    // Check if wallets have enough balance
    for (const payment of payments) {
        const wallet = await prisma.wallet.findUnique({ where: { id: payment.walletId } });
        if (!wallet || wallet.balance.toNumber() < payment.amount) {
            return { message: `رصيد محفظة "${wallet?.name}" غير كافٍ.`, success: false };
        }
    }
      
    await prisma.$transaction(async (tx) => {
      // 1. Create Expense record
      const expense = await tx.expense.create({
        data: {
          description: validatedFields.data.description,
          date: new Date(validatedFields.data.date),
          category: validatedFields.data.category,
          amount: validatedFields.data.amount,
        }
      });

      // 2. Create Payment records and link to expense
      await tx.payment.createMany({
        data: payments.map(p => ({
          amount: p.amount,
          walletId: p.walletId,
          expenseId: expense.id,
          date: new Date(validatedFields.data.date),
          type: 'Expense',
          description: `مصروف: ${description}`
        }))
      });

      // 3. Update wallet balances
      for (const payment of payments) {
        await tx.wallet.update({
          where: { id: payment.walletId },
          data: { balance: { decrement: payment.amount } },
        });
      }

      // 4. Create Log entry
      await tx.log.create({
        data: {
          userId: session.userId!,
          action: 'CREATE',
          entityType: 'EXPENSE',
          entityId: expense.id,
          details: `تسجيل مصروف جديد (${category}) بقيمة ${amount}.`
        }
      });
    });

    revalidatePath('/expenses');
    revalidatePath('/daily-report');
    revalidatePath('/wallets');
    return { message: 'تم تسجيل المصروف بنجاح!', success: true };

  } catch (error) {
    console.error('Error creating expense:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { message: `فشل في تسجيل المصروف: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل المصروف. حدث خطأ غير متوقع.', success: false };
  }
}

