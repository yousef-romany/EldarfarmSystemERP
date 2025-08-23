
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

const paymentSchema = z.object({
  id: z.string().optional(),
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

const updateExpenseSchema = expenseSchema.omit({ amount: true }).extend({
    totalAmount: z.coerce.number().positive("المبلغ الإجمالي يجب أن يكون أكبر من صفر")
});

export type ExpenseState = {
  errors?: z.ZodError<any>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createExpense(prevState: ExpenseState, formData: FormData): Promise<ExpenseState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.id) {
    redirect('/');
  }

  if (!session.user.permissions?.expenses?.add) {
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
          userId: session.user.id,
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

export async function getExpenseById(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn) {
        redirect('/');
    }

    try {
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                payments: {
                  include: {
                    wallet: true
                  }
                }
            }
        });
        return expense;
    } catch (error) {
        console.error("Failed to get expense by ID:", error);
        return null;
    }
}

export async function updateExpense(expenseId: string, prevState: ExpenseState, formData: FormData): Promise<ExpenseState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.expenses?.edit) {
        return { message: "ليس لديك الصلاحية لتعديل المصروفات.", success: false };
    }
    
    const paymentsData = JSON.parse(formData.get('payments') as string || '[]');
    const validatedFields = updateExpenseSchema.safeParse({
        description: formData.get('description'),
        date: formData.get('date'),
        category: formData.get('category'),
        totalAmount: formData.get('totalAmount'),
        payments: paymentsData,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: "بيانات غير صالحة.", success: false };
    }

    const { description, date, category, totalAmount, payments: newPayments } = validatedFields.data;
    const totalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);

    if (Math.abs(totalPaid - totalAmount) > 0.01) {
        return { message: "مجموع الدفعات يجب أن يساوي المبلغ الإجمالي المحدث.", success: false };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const originalExpense = await tx.expense.findUnique({
                where: { id: expenseId },
                include: { payments: true }
            });

            if (!originalExpense) throw new Error("Expense not found");

            // 1. Revert original payment amounts from wallets
            for (const oldPayment of originalExpense.payments) {
                await tx.wallet.update({
                    where: { id: oldPayment.walletId },
                    data: { balance: { increment: oldPayment.amount } }
                });
            }

            // 2. Delete old payments
            await tx.payment.deleteMany({ where: { expenseId: expenseId } });

            // 3. Create new payments
            await tx.payment.createMany({
                data: newPayments.map(p => ({
                    amount: p.amount,
                    walletId: p.walletId,
                    expenseId: expenseId,
                    date: new Date(date),
                    type: 'Expense',
                    description: `(تعديل) مصروف: ${description}`
                }))
            });

            // 4. Apply new payment amounts to wallets
            for (const newPayment of newPayments) {
                await tx.wallet.update({
                    where: { id: newPayment.walletId },
                    data: { balance: { decrement: newPayment.amount } }
                });
            }

            // 5. Update the expense record itself
            await tx.expense.update({
                where: { id: expenseId },
                data: {
                    description,
                    date: new Date(date),
                    category,
                    amount: totalAmount,
                }
            });

            // 6. Log the update
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE',
                    entityType: 'EXPENSE',
                    entityId: expenseId,
                    details: `تعديل بيانات المصروف: ${description}.`
                }
            });
        });

        revalidatePath('/expenses');
        revalidatePath(`/expenses/edit/${expenseId}`);
        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        return { message: "تم تحديث المصروف بنجاح!", success: true };
    } catch (error) {
        console.error("Error updating expense:", error);
        return { message: "فشل في تحديث المصروف.", success: false };
    }
}


export async function deleteExpense(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.expenses?.delete) {
        return { message: 'ليس لديك الصلاحية لحذف المصروفات.', success: false };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const expense = await tx.expense.findUnique({
                where: { id },
                include: { payments: true }
            });

            if (!expense) {
                throw new Error('المصروف غير موجود.');
            }

            // Reverse wallet transactions
            for (const payment of expense.payments) {
                await tx.wallet.update({
                    where: { id: payment.walletId },
                    data: { balance: { increment: payment.amount } }
                });
            }

            // Delete payments associated with the expense
            await tx.payment.deleteMany({
                where: { expenseId: id }
            });

            // Delete the expense itself
            await tx.expense.delete({
                where: { id }
            });

            // Log the deletion
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'DELETE',
                    entityType: 'EXPENSE',
                    entityId: id,
                    details: `قام بحذف المصروف: ${expense.description} بقيمة ${expense.amount}.`
                }
            });
        });

        revalidatePath('/expenses');
        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        return { message: 'تم حذف المصروف بنجاح.', success: true };

    } catch (error) {
        console.error('Error deleting expense:', error);
        return { message: 'فشل في حذف المصروف. قد يكون مرتبطًا بسجلات أخرى.', success: false };
    }
}
