

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

const purchaseSchema = z.object({
  isBatch: z.boolean(),
  tagId: z.string().optional(),
  quantity: z.coerce.number().nullish(),
  livestockTypeId: z.string().min(1, "يجب تحديد نوع الحيوان"),
  breed: z.string().min(1, "السلالة مطلوبة"),
  weight: z.coerce.number().positive("الوزن يجب أن يكون رقمًا موجبًا"),
  age: z.coerce.number().positive("العمر يجب أن يكون رقمًا موجبًا"),
  purchaseDate: z.string().min(1, "تاريخ الشراء مطلوب"),
  barnId: z.string().min(1, "يجب تحديد العنبر"),
  supplier: z.string().optional(),
  totalCost: z.coerce.number().positive("التكلفة الإجمالية يجب أن تكون أكبر من صفر"),
  payments: z.array(paymentSchema),
}).superRefine((data, ctx) => {
  if (data.isBatch) {
    if (!data.quantity || data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "الكمية مطلوبة ويجب أن تكون رقمًا موجبًا عند شراء دفعة.",
        path: ["quantity"],
      });
    }
  } else {
    if (!data.tagId || data.tagId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "الرقم التعريفي مطلوب عند شراء حيوان فردي.",
        path: ["tagId"],
      });
    }
  }
});

export type PurchaseState = {
  errors?: Record<string, string[] | undefined>;
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
  
  const { totalCost, payments, purchaseDate, supplier, ...livestockData } = validatedFields.data;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  if (Math.abs(totalPaid - totalCost) > 0.01) {
      return { message: 'مجموع الدفعات يجب أن يساوي التكلفة الإجمالية.', success: false };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Purchase record with Draft status and store livestock data within it
      const purchase = await tx.purchase.create({
        data: {
          supplier: supplier,
          purchaseDate: new Date(purchaseDate),
          totalCost: totalCost,
          amountPaid: totalPaid,
          remainingAmount: totalCost - totalPaid,
          status: 'Draft',
          livestockData: livestockData as any, // Store livestock data as JSON
        }
      });
      
      // 2. Create Payment records and link them to the purchase draft
      if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map(p => ({
            amount: p.amount,
            walletId: p.walletId,
            purchaseId: purchase.id,
            date: new Date(),
            type: 'Expense',
            description: `[مسودة] دفعة لشراء`
          }))
        });
      }

      // DO NOT create livestock record, update wallet, or update barn occupancy yet.

      // 3. Create Log entry for draft creation
      await tx.log.create({
        data: {
          userId: session.user!.id,
          action: 'CREATE',
          entityType: 'PURCHASE_DRAFT',
          entityId: purchase.id,
          details: `إنشاء مسودة شراء بتكلفة ${totalCost}.`
        }
      });
    });

    revalidatePath('/purchases');
    return { message: 'تم حفظ مسودة الشراء بنجاح! يجب تأكيدها من قبل المدير.', success: true };

  } catch (error) {
    console.error('Error creating purchase draft:', error);
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
                include: { payments: true }
            });

            if (!purchase || purchase.status !== 'Draft') {
                throw new Error("لا يمكن تأكيد هذه العملية. قد تكون مكتملة بالفعل أو ملغاة.");
            }
            
            const livestockData = purchase.livestockData as any;
            const occupancyNeeded = livestockData.quantity || 1;

            // 1. Check wallet balances
            for (const payment of purchase.payments) {
                const wallet = await tx.wallet.findUnique({ where: { id: payment.walletId } });
                if (!wallet || wallet.balance < payment.amount) {
                    throw new Error(`رصيد محفظة "${wallet?.name}" غير كافٍ لإتمام عملية الدفع.`);
                }
            }
            
            // 2. Check barn capacity with row-level lock to prevent race conditions
            const barnRows = await tx.$queryRaw<{ id: string; capacity: number; currentOccupancy: number }[]>`
              SELECT id, capacity, currentOccupancy FROM Barn WHERE id = ${livestockData.barnId} FOR UPDATE
            `;
            const barn = barnRows[0];
            if (!barn || barn.capacity - barn.currentOccupancy < occupancyNeeded) {
                throw new Error('سعة العنبر المحددة غير كافية.');
            }
            
             // 3. Create the actual livestock record
            const livestock = await tx.livestock.create({
              data: {
                isBatch: livestockData.isBatch,
                tagId: livestockData.tagId,
                quantity: livestockData.quantity,
                livestockTypeId: livestockData.livestockTypeId,
                breed: livestockData.breed,
                weight: livestockData.weight,
                age: livestockData.age,
                barnId: livestockData.barnId,
                status: 'Available',
                cost: purchase.totalCost,
                purchaseId: purchase.id
              }
            });


            // 4. Update wallet balances by decrementing
            for (const payment of purchase.payments) {
                await tx.wallet.update({
                    where: { id: payment.walletId },
                    data: { balance: { decrement: payment.amount } }
                });
            }
            
            // 5. Update barn occupancy
            await tx.barn.update({
                where: { id: livestockData.barnId },
                data: { currentOccupancy: { increment: occupancyNeeded } }
            });
            
            
            // 6. Update purchase status to 'Completed'
            await tx.purchase.update({
                where: { id: purchaseId },
                data: { status: 'Completed', livestockId: livestock.id }
            });

            // 7. Log the confirmation
            await tx.log.create({
                data: {
                    userId: session.user!.id,
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
            if (purchase.status === 'Completed' && purchase.livestock) {
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
                
                // 3. Delete the livestock record
                await tx.livestock.delete({
                    where: { id: purchase.livestockId! }
                });
            }


            // 4. Delete associated payments (for both draft and completed)
            await tx.payment.deleteMany({
                where: { purchaseId: id }
            });

            // 5. Delete the purchase record
            await tx.purchase.delete({
                where: { id }
            });

            // 6. Log the deletion
            await tx.log.create({
                data: {
                    userId: session.user!.id,
                    action: 'DELETE',
                    entityType: 'PURCHASE',
                    entityId: id,
                    details: `قام بحذف عملية الشراء.`
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

export async function getPurchaseById(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn) {
        redirect('/');
    }

    try {
        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: {
                livestock: {
                    include: {
                        livestockType: true,
                    }
                },
                payments: {
                    include: {
                        wallet: true
                    }
                }
            }
        });

        if (!purchase) return null;

        return {
            ...purchase,
            totalCost: purchase.totalCost,
            amountPaid: purchase.amountPaid,
            remainingAmount: purchase.remainingAmount,
            livestock: purchase.livestock ? {
                ...purchase.livestock,
                weight: purchase.livestock.weight,
                cost: purchase.livestock.cost,
            } : null,
            livestockData: purchase.livestockData as any,
            payments: purchase.payments.map(p => ({
                ...p,
                amount: p.amount,
                wallet: {
                    ...p.wallet,
                    balance: p.wallet.balance
                }
            }))
        };

    } catch (error) {
        console.error("Failed to get purchase by ID:", error);
        return null;
    }
}

export async function updatePurchase(purchaseId: string, prevState: PurchaseState, formData: FormData): Promise<PurchaseState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id) {
        redirect('/');
    }
    
    if (!session.user.permissions?.purchases?.edit) {
        return { message: 'ليس لديك الصلاحية لتعديل المشتريات.', success: false };
    }

    const originalPurchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!originalPurchase || originalPurchase.status !== 'Draft') {
        return { message: 'لا يمكن تعديل إلا مسودات المشتريات.', success: false };
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
        return { errors: validatedFields.error.flatten().fieldErrors, message: 'بيانات غير صالحة.', success: false };
    }
    
    const { totalCost, payments, purchaseDate, supplier, ...livestockData } = validatedFields.data;
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    if (Math.abs(totalPaid - totalCost) > 0.01) {
        return { message: 'مجموع الدفعات يجب أن يساوي التكلفة الإجمالية.', success: false };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Delete old payments associated with the purchase
            await tx.payment.deleteMany({ where: { purchaseId: purchaseId } });

            // 2. Create new payments
            if (payments.length > 0) {
                await tx.payment.createMany({
                    data: payments.map(p => ({
                        amount: p.amount,
                        walletId: p.walletId,
                        purchaseId: purchaseId,
                        date: new Date(),
                        type: 'Expense',
                        description: `[مسودة](تعديل) دفعة لشراء`
                    }))
                });
            }

            // 3. Update Purchase record
            await tx.purchase.update({
                where: { id: purchaseId },
                data: {
                    supplier: supplier,
                    purchaseDate: new Date(purchaseDate),
                    totalCost: totalCost,
                    amountPaid: totalPaid,
                    remainingAmount: totalCost - totalPaid,
                    livestockData: livestockData as any
                }
            });

            // 4. Log the update
            await tx.log.create({
                data: {
                    userId: session.user!.id,
                    action: 'UPDATE',
                    entityType: 'PURCHASE_DRAFT',
                    entityId: purchaseId,
                    details: `تعديل مسودة الشراء.`
                }
            });
        });

        revalidatePath('/purchases');
        revalidatePath(`/purchases/edit/${purchaseId}`);
        return { message: 'تم تحديث مسودة الشراء بنجاح!', success: true };
    } catch (error) {
        console.error('Error updating purchase draft:', error);
        return { message: 'فشل في تحديث مسودة الشراء.', success: false };
    }
}
