
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
  if (!session.isLoggedIn || !session.user?.id) {
    redirect('/');
  }

  if (!session.user.permissions?.contributions?.add) {
    return {
      message: 'ليس لديك الصلاحية لإضافة نذور نقدية.',
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
      return { message: 'مجموع الدفعات يجب أن يساوي المبلغ الإجمالي للنذر.', success: false };
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
          description: `نذر نقدي من ${donorName}: ${validatedFields.data.description}`
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
          userId: session.user.id,
          action: 'CREATE',
          entityType: 'CONTRIBUTION',
          entityId: contribution.id,
          details: `تسجيل نذر نقدي جديد من ${donorName} بقيمة ${totalAmount}.`
        }
      });
    });

    revalidatePath('/contributions');
    revalidatePath('/daily-report');
    revalidatePath('/wallets');
    return { message: 'تم تسجيل النذر النقدي بنجاح!', success: true };

  } catch (error) {
    console.error('Error creating contribution:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { message: `فشل في تسجيل النذر النقدي: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل النذر النقدي. حدث خطأ غير متوقع.', success: false };
  }
}

export async function getContributionById(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn) {
        redirect('/');
    }

    try {
        const contribution = await prisma.contribution.findUnique({
            where: { id },
            include: {
                payments: {
                    include: {
                        wallet: true
                    }
                }
            }
        });

        if (!contribution) return null;

        // Serialize Decimal fields
        return {
          ...contribution,
          totalAmount: contribution.totalAmount.toNumber(),
          payments: contribution.payments.map(p => ({
            ...p,
            amount: p.amount.toNumber(),
            wallet: {
              ...p.wallet,
              balance: p.wallet.balance.toNumber()
            }
          }))
        };
    } catch (error) {
        console.error("Failed to get contribution by ID:", error);
        return null;
    }
}


export async function updateContribution(contributionId: string, prevState: ContributionState, formData: FormData): Promise<ContributionState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.contributions?.edit) {
        return { message: "ليس لديك الصلاحية لتعديل النذور النقدية.", success: false };
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
        return { errors: validatedFields.error.flatten().fieldErrors, message: "بيانات غير صالحة.", success: false };
    }

    const { donorName, description, date, totalAmount, payments: newPayments } = validatedFields.data;
    const totalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);

    if (Math.abs(totalPaid - totalAmount) > 0.01) {
        return { message: "مجموع الدفعات يجب أن يساوي المبلغ الإجمالي المحدث.", success: false };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const originalContribution = await tx.contribution.findUnique({
                where: { id: contributionId },
                include: { payments: true }
            });

            if (!originalContribution) throw new Error("Contribution not found");

            // 1. Revert original payment amounts from wallets
            for (const oldPayment of originalContribution.payments) {
                await tx.wallet.update({
                    where: { id: oldPayment.walletId },
                    data: { balance: { decrement: oldPayment.amount } }
                });
            }

            // 2. Delete old payments
            await tx.payment.deleteMany({ where: { contributionId: contributionId } });

            // 3. Create new payments
            await tx.payment.createMany({
                data: newPayments.map(p => ({
                    amount: p.amount,
                    walletId: p.walletId,
                    contributionId: contributionId,
                    date: new Date(date),
                    type: 'Income',
                    description: `(تعديل) نذر نقدي من ${donorName}: ${description}`
                }))
            });

            // 4. Apply new payment amounts to wallets
            for (const newPayment of newPayments) {
                await tx.wallet.update({
                    where: { id: newPayment.walletId },
                    data: { balance: { increment: newPayment.amount } }
                });
            }

            // 5. Update the contribution record itself
            await tx.contribution.update({
                where: { id: contributionId },
                data: {
                    donorName,
                    description,
                    date: new Date(date),
                    totalAmount,
                }
            });

            // 6. Log the update
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE',
                    entityType: 'CONTRIBUTION',
                    entityId: contributionId,
                    details: `تعديل بيانات النذر النقدي من ${donorName}.`
                }
            });
        });

        revalidatePath('/contributions');
        revalidatePath(`/contributions/edit/${contributionId}`);
        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        return { message: "تم تحديث النذر النقدي بنجاح!", success: true };
    } catch (error) {
        console.error("Error updating contribution:", error);
        return { message: "فشل في تحديث النذر النقدي.", success: false };
    }
}


export async function deleteContribution(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.contributions?.delete) {
        return { message: 'ليس لديك الصلاحية لحذف النذور النقدية.', success: false };
    }

    try {
        const contributionToDelete = await prisma.contribution.findUnique({
            where: { id },
            include: { payments: true }
        });

        if (!contributionToDelete) {
            throw new Error('النذر النقدي غير موجود.');
        }

        await prisma.$transaction(async (tx) => {
            // Reverse wallet transactions
            for (const payment of contributionToDelete.payments) {
                await tx.wallet.update({
                    where: { id: payment.walletId },
                    data: { balance: { decrement: payment.amount } }
                });
            }

            // Delete payments associated with the contribution
            await tx.payment.deleteMany({
                where: { contributionId: id }
            });

            // Delete the contribution itself
            await tx.contribution.delete({
                where: { id }
            });

            // Log the deletion
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'DELETE',
                    entityType: 'CONTRIBUTION',
                    entityId: id,
                    details: `قام بحذف النذر النقدي من ${contributionToDelete.donorName} بقيمة ${contributionToDelete.totalAmount}.`
                }
            });
        });

        revalidatePath('/contributions');
        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        return { message: 'تم حذف النذر النقدي بنجاح.', success: true };

    } catch (error) {
        console.error('Error deleting contribution:', error);
        return { message: 'فشل في حذف النذر النقدي. قد تكون مرتبطة بسجلات أخرى.', success: false };
    }
}
