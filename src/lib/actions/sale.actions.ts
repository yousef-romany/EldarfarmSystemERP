
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
  errors?: z.ZodError<any>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createSale(prevState: SaleState, formData: FormData): Promise<SaleState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.id) {
    redirect('/');
  }

  if (!session.user.permissions?.sales?.add) {
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

  if (!isDeferred && Math.abs(totalPaid - totalPrice) > 0.01) {
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

      // 4. Update Livestock status and barn occupancy
      if (!livestock.isBatch) {
        await tx.livestock.update({
          where: { id: livestockId },
          data: {
            status: isDeferred ? 'PendingSale' : 'Sold',
          }
        });
        if (!isDeferred) {
           await tx.barn.update({
              where: { id: livestock.barnId },
              data: { currentOccupancy: { decrement: 1 } },
          });
        }
      } else {
        // TODO: Handle batch sale logic (e.g., decrementing quantity)
      }


      // 5. Create Log entry
      await tx.log.create({
        data: {
          userId: session.user.id,
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

const settleSaleSchema = z.object({
  finalWeight: z.coerce.number().positive("الوزن النهائي يجب أن يكون أكبر من صفر"),
  payments: z.array(paymentSchema),
});

type SettleSaleState = {
  errors?: z.ZodError<typeof settleSaleSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function settleSale(saleId: string, prevState: SettleSaleState, formData: FormData): Promise<SettleSaleState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.sales?.edit) {
    return { message: "ليس لديك الصلاحية لتسوية المبيعات.", success: false };
  }

  const paymentsData = JSON.parse(formData.get('payments') as string || '[]');

  const validatedFields = settleSaleSchema.safeParse({
    finalWeight: formData.get('finalWeight'),
    payments: paymentsData,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors, message: 'بيانات غير صالحة', success: false };
  }

  const { finalWeight, payments } = validatedFields.data;

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { livestock: true }
    });
    if (!sale || sale.status !== 'Pending') {
      return { message: "لا يمكن تسوية هذه العملية.", success: false };
    }

    const finalTotalPrice = finalWeight * sale.pricePerKg.toNumber();
    const newPaymentsTotal = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalPaid = sale.amountPaid.toNumber() + newPaymentsTotal;
    const remainingBalance = finalTotalPrice - sale.amountPaid.toNumber();
    
    if (Math.abs(newPaymentsTotal - remainingBalance) > 0.01) {
        return { message: `المبلغ المدفوع للتسوية (${newPaymentsTotal}) لا يطابق المبلغ المتبقي (${remainingBalance.toFixed(2)}).`, success: false };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Sale record
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'Completed',
          finalWeight,
          settlementDate: new Date(),
          totalPrice: finalTotalPrice,
          amountPaid: totalPaid,
          remainingAmount: 0,
        },
      });
      
      // 2. Create new Payment records
      if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map(p => ({
            amount: p.amount,
            walletId: p.walletId,
            saleId: sale.id,
            date: new Date(),
            type: 'Income',
            description: `تسوية بيع الحيوان ${sale.livestock.tagId || sale.livestock.id}`
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
      
      // 4. Update livestock record with final weight and barn occupancy
      if (!sale.livestock.isBatch) {
        await tx.livestock.update({
            where: { id: sale.livestockId },
            data: { status: 'Sold', weight: finalWeight }
        });
         await tx.barn.update({
            where: { id: sale.livestock.barnId },
            data: { currentOccupancy: { decrement: 1 } },
        });
      }


      // 5. Log the settlement
      await tx.log.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          entityType: 'SALE',
          entityId: sale.id,
          details: `تسوية بيع آجل للحيوان ${sale.livestock.tagId}. الوزن النهائي: ${finalWeight} كجم.`
        }
      });
    });

    revalidatePath('/sales');
    revalidatePath('/dashboard');
    revalidatePath('/reports/bookings');
    revalidatePath('/daily-report');

    return { message: "تمت تسوية عملية البيع بنجاح!", success: true };
  } catch (error) {
    console.error("Error settling sale:", error);
    return { message: "فشل في تسوية العملية.", success: false };
  }
}

export async function getSaleById(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn) {
        redirect('/');
    }

    try {
        const sale = await prisma.sale.findUnique({
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

        if (!sale) return null;

        // Serialize Decimal fields before returning
        return {
            ...sale,
            pricePerKg: sale.pricePerKg.toNumber(),
            totalPrice: sale.totalPrice.toNumber(),
            amountPaid: sale.amountPaid.toNumber(),
            remainingAmount: sale.remainingAmount.toNumber(),
            initialWeight: sale.initialWeight?.toNumber() ?? null,
            finalWeight: sale.finalWeight?.toNumber() ?? null,
            livestock: {
                ...sale.livestock,
                weight: sale.livestock.weight.toNumber(),
                cost: sale.livestock.cost.toNumber(),
            },
            payments: sale.payments.map(p => ({
                ...p,
                amount: p.amount.toNumber(),
                wallet: {
                    ...p.wallet,
                    balance: p.wallet.balance.toNumber()
                }
            }))
        };

    } catch (error) {
        console.error("Failed to get sale by ID:", error);
        return null;
    }
}

const updateSaleSchema = z.object({
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  saleDate: z.string().min(1, "تاريخ البيع مطلوب"),
  totalPrice: z.coerce.number().min(0, "السعر الإجمالي لا يمكن أن يكون سالبًا"),
  pricePerKg: z.coerce.number().min(0, "سعر الكيلو لا يمكن أن يكون سالبًا"),
  finalWeight: z.coerce.number().min(0, "الوزن النهائي لا يمكن أن يكون سالبًا"),
  payments: z.array(paymentSchema),
});

export async function updateSale(saleId: string, prevState: SaleState, formData: FormData): Promise<SaleState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.sales?.edit) {
        return { message: "ليس لديك الصلاحية لتعديل المبيعات.", success: false };
    }
    
    const paymentsData = JSON.parse(formData.get('payments') as string || '[]');
    const validatedFields = updateSaleSchema.safeParse({
        customerName: formData.get('customerName'),
        saleDate: formData.get('saleDate'),
        totalPrice: formData.get('totalPrice'),
        pricePerKg: formData.get('pricePerKg'),
        finalWeight: formData.get('finalWeight'),
        payments: paymentsData,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: "بيانات غير صالحة.", success: false };
    }

    const { customerName, saleDate, totalPrice, pricePerKg, finalWeight, payments: newPayments } = validatedFields.data;
    const totalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);

    if (Math.abs(totalPaid - totalPrice) > 0.01) {
        return { message: "مجموع الدفعات يجب أن يساوي السعر الإجمالي المحدث.", success: false };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const originalSale = await tx.sale.findUnique({
                where: { id: saleId },
                include: { payments: true }
            });

            if (!originalSale) throw new Error("Sale not found");

            // 1. Revert original payment amounts from wallets
            for (const oldPayment of originalSale.payments) {
                await tx.wallet.update({
                    where: { id: oldPayment.walletId },
                    data: { balance: { decrement: oldPayment.amount } }
                });
            }

            // 2. Delete old payments
            await tx.payment.deleteMany({ where: { saleId: saleId } });

            // 3. Create new payments
            await tx.payment.createMany({
                data: newPayments.map(p => ({
                    amount: p.amount,
                    walletId: p.walletId,
                    saleId: saleId,
                    date: new Date(saleDate),
                    type: 'Income',
                    description: `(تعديل) دفعة من بيع للعميل ${customerName}`
                }))
            });

            // 4. Apply new payment amounts to wallets
            for (const newPayment of newPayments) {
                await tx.wallet.update({
                    where: { id: newPayment.walletId },
                    data: { balance: { increment: newPayment.amount } }
                });
            }

            // 5. Update the sale record itself
            const updatedSale = await tx.sale.update({
                where: { id: saleId },
                data: {
                    customerName,
                    saleDate: new Date(saleDate),
                    totalPrice,
                    amountPaid: totalPaid,
                    remainingAmount: totalPrice - totalPaid,
                    pricePerKg,
                    finalWeight: originalSale.type === 'Deferred' ? finalWeight : originalSale.finalWeight,
                }
            });

            // 6. Log the update
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE',
                    entityType: 'SALE',
                    entityId: saleId,
                    details: `تعديل بيانات عملية البيع للعميل ${customerName}.`
                }
            });
        });

        revalidatePath('/sales');
        revalidatePath(`/sales/edit/${saleId}`);
        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        return { message: "تم تحديث عملية البيع بنجاح!", success: true };
    } catch (error) {
        console.error("Error updating sale:", error);
        return { message: "فشل في تحديث عملية البيع.", success: false };
    }
}


export async function deleteSale(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.sales?.delete) {
        return { message: 'ليس لديك الصلاحية لحذف المبيعات.', success: false };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({
                where: { id },
                include: { payments: true, livestock: true }
            });

            if (!sale) {
                throw new Error('عملية البيع غير موجودة.');
            }

            // Reverse wallet transactions
            for (const payment of sale.payments) {
                await tx.wallet.update({
                    where: { id: payment.walletId },
                    data: { balance: { decrement: payment.amount } }
                });
            }
            
            // Revert livestock status and update barn occupancy if not batch
            if (!sale.livestock.isBatch) {
               await tx.livestock.update({
                 where: { id: sale.livestockId },
                 data: { status: 'Available' }
               });
               // Only increment occupancy if the sale was completed
               if (sale.status === 'Completed') {
                  await tx.barn.update({
                    where: { id: sale.livestock.barnId },
                    data: { currentOccupancy: { increment: 1 } }
                  });
               }
            }


            // Delete payments associated with the sale
            await tx.payment.deleteMany({
                where: { saleId: id }
            });

            // Delete the sale itself
            await tx.sale.delete({
                where: { id }
            });

            // Log the deletion
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'DELETE',
                    entityType: 'SALE',
                    entityId: id,
                    details: `قام بحذف عملية البيع للعميل ${sale.customerName}.`
                }
            });
        });

        revalidatePath('/sales');
        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        revalidatePath('/dashboard');
        return { message: 'تم حذف عملية البيع بنجاح.', success: true };

    } catch (error) {
        console.error('Error deleting sale:', error);
        return { message: 'فشل في حذف عملية البيع.', success: false };
    }
}
