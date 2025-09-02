
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
  saleType: z.enum(['Immediate', 'Deferred']),
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

  const saleType = formData.get('saleType') as 'Immediate' | 'Deferred';
  const hasPermission = saleType === 'Immediate' ? session.user.permissions?.pos?.add : session.user.permissions?.deferredSales?.add;

  if (!hasPermission) {
    return { message: 'ليس لديك الصلاحية لتسجيل هذا النوع من المبيعات.', success: false };
  }

  const paymentsData = JSON.parse(formData.get('payments') as string || '[]');

  const validatedFields = saleSchema.safeParse({
    livestockId: formData.get('livestockId'),
    customerName: formData.get('customerName'),
    saleDate: formData.get('saleDate'),
    pricePerKg: formData.get('pricePerKg'),
    initialWeight: formData.get('initialWeight'),
    totalPrice: formData.get('totalPrice'),
    saleType: saleType,
    payments: paymentsData,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة. يرجى مراجعة الحقول.',
      success: false,
    };
  }

  const { livestockId, totalPrice, payments, saleDate } = validatedFields.data;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  if (totalPaid === 0) {
    return { message: 'يجب تسجيل دفعة واحدة على الأقل.', success: false };
  }

  if (totalPaid > totalPrice) {
    return { message: 'المبلغ المدفوع لا يمكن أن يكون أكبر من السعر الإجمالي.', success: false };
  }

  try {
    const livestock = await prisma.livestock.findUnique({ where: { id: livestockId } });
    if (!livestock || livestock.status === 'Sold' || livestock.status === 'PendingSale') {
        return { message: 'الحيوان المحدد غير متاح للبيع.', success: false };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Sale record as Draft
      const sale = await tx.sale.create({
        data: {
          livestockId: validatedFields.data.livestockId,
          customerName: validatedFields.data.customerName,
          saleDate: new Date(validatedFields.data.saleDate),
          type: saleType,
          status: 'Draft', // <<< ALWAYS CREATE AS DRAFT
          pricePerKg: validatedFields.data.pricePerKg,
          initialWeight: validatedFields.data.initialWeight,
          finalWeight: null,
          totalPrice: validatedFields.data.totalPrice,
          amountPaid: totalPaid,
          remainingAmount: totalPrice - totalPaid,
          settlementDate: null,
        }
      });

      // 2. Create Payment records and link to sale draft
       if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map(p => ({
            amount: p.amount,
            walletId: p.walletId,
            saleId: sale.id,
            date: new Date(saleDate), // Use the sale date for payment records
            type: 'Income',
            description: `[مسودة] دفعة من بيع الحيوان ${livestock.tagId || livestock.id}`
          }))
        });
      }
      
      // DO NOT update wallets, livestock status, or barn occupancy here.

      // 3. Create Log entry for draft creation
      await tx.log.create({
        data: {
          userId: session.user.id,
          action: 'CREATE',
          entityType: 'SALE_DRAFT',
          entityId: sale.id,
          details: `تسجيل مسودة بيع ${saleType === 'Deferred' ? 'آجل' : 'فوري'} للعميل ${validatedFields.data.customerName}.`
        }
      });
    });

    revalidatePath('/sales', 'layout');
    revalidatePath('/dashboard');
    return { message: `تم تسجيل مسودة البيع ${saleType === 'Deferred' ? 'الآجل' : 'الفوري'} بنجاح!`, success: true };

  } catch (error) {
    console.error('Error creating sale draft:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { message: `فشل في تسجيل المسودة: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل مسودة البيع. حدث خطأ غير متوقع.', success: false };
  }
}

type ConfirmSaleState = {
  message?: string | null;
  success?: boolean;
}

export async function confirmSale(prevState: ConfirmSaleState, formData: FormData): Promise<ConfirmSaleState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.sales?.confirm) {
    return { message: "ليس لديك الصلاحية لتأكيد المبيعات.", success: false };
  }

  const saleId = formData.get('saleId') as string;
  if (!saleId) {
    return { message: 'معرف البيع مطلوب.', success: false };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { livestock: true, payments: true }
      });

      if (!sale || sale.status !== 'Draft') {
        throw new Error("لا يمكن تأكيد هذه العملية.");
      }

      // Check wallet balances for all payments related to this sale
      for (const payment of sale.payments) {
        // This is an income, so no balance check is needed. We just increment.
        await tx.wallet.update({
          where: { id: payment.walletId },
          data: { balance: { increment: payment.amount } }
        });
      }

      const isDeferred = sale.type === 'Deferred';
      const finalStatus = isDeferred ? 'Pending' : 'Completed';
      
      // Update livestock status
      if (!sale.livestock.isBatch) {
         await tx.livestock.update({
          where: { id: sale.livestockId },
          data: { status: isDeferred ? 'PendingSale' : 'Sold' }
        });

        // Decrement barn occupancy only for immediate, completed sales
        if (!isDeferred) {
           await tx.barn.update({
              where: { id: sale.livestock.barnId },
              data: { currentOccupancy: { decrement: 1 } },
          });
        }
      }

      // Update sale status to final state
      await tx.sale.update({
        where: { id: saleId },
        data: { 
          status: finalStatus,
          // If it's an immediate sale, set settlement date and final weight now
          settlementDate: isDeferred ? null : new Date(),
          finalWeight: isDeferred ? null : sale.initialWeight,
        }
      });
      
      // Log the confirmation
      await tx.log.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          entityType: 'SALE',
          entityId: sale.id,
          details: `تأكيد عملية البيع للعميل ${sale.customerName}.`
        }
      });
    });

    revalidatePath('/sales', 'layout');
    revalidatePath('/dashboard');
    revalidatePath('/wallets');
    revalidatePath('/daily-report');
    return { message: "تم تأكيد عملية البيع بنجاح!", success: true };

  } catch(error: any) {
    console.error("Error confirming sale:", error);
    return { message: `فشل تأكيد العملية: ${error.message}`, success: false };
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
  if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.deferredSales?.edit) {
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

    const finalTotalPrice = finalWeight * sale.pricePerKg;
    const newPaymentsTotal = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalPaid = sale.amountPaid.toNumber() + newPaymentsTotal;
    const remainingBalance = finalTotalPrice - sale.amountPaid.toNumber();
    
    if (Math.abs(newPaymentsTotal - remainingBalance) > 0.01) {
        return { message: `المبلغ المدفوع للتسوية (${newPaymentsTotal}) لا يطابق المبلغ المتبقي (${remainingBalance.toFixed(2)}).`, success: false };
    }
    
    const settlementDate = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Update Sale record
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'Completed',
          finalWeight,
          settlementDate,
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
            date: sale.saleDate, // <<<< CRITICAL FIX: Use the original sale date for the payment record
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

    revalidatePath('/sales', 'layout');
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
            initialWeight: sale.initialWeight ? sale.initialWeight.toNumber() : null,
            finalWeight: sale.finalWeight ? sale.finalWeight.toNumber() : null,
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
  initialWeight: z.coerce.number().min(0, "الوزن لا يمكن أن يكون سالبًا"),
  payments: z.array(paymentSchema),
});

export async function updateSale(saleId: string, prevState: SaleState, formData: FormData): Promise<SaleState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id) {
      redirect('/');
    }
    
    const paymentsData = JSON.parse(formData.get('payments') as string || '[]');
    const validatedFields = updateSaleSchema.safeParse({
        customerName: formData.get('customerName'),
        saleDate: formData.get('saleDate'),
        totalPrice: formData.get('totalPrice'),
        pricePerKg: formData.get('pricePerKg'),
        initialWeight: formData.get('initialWeight'),
        payments: paymentsData,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: "بيانات غير صالحة.", success: false };
    }
    
    const originalSaleData = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!originalSaleData) return { message: 'Sale not found', success: false };
    if (originalSaleData.status !== 'Draft') {
        return { message: "لا يمكن تعديل عملية بيع تم تأكيدها.", success: false };
    }

    const hasPermission = originalSaleData.type === 'Immediate' ? session.user.permissions?.pos?.edit : session.user.permissions?.deferredSales?.edit;
     if (!hasPermission) {
        return { message: "ليس لديك الصلاحية لتعديل هذا النوع من المبيعات.", success: false };
    }


    const { customerName, saleDate, totalPrice, pricePerKg, initialWeight, payments: newPayments } = validatedFields.data;
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

            // No need to revert wallet balances as drafts don't affect them
            
            // Delete old payments
            await tx.payment.deleteMany({ where: { saleId: saleId } });

            // Create new payments
            await tx.payment.createMany({
                data: newPayments.map(p => ({
                    amount: p.amount,
                    walletId: p.walletId,
                    saleId: saleId,
                    date: new Date(saleDate),
                    type: 'Income',
                    description: `[مسودة](تعديل) دفعة من بيع للعميل ${customerName}`
                }))
            });

            // Update the sale record itself
            await tx.sale.update({
                where: { id: saleId },
                data: {
                    customerName,
                    saleDate: new Date(saleDate),
                    totalPrice,
                    amountPaid: totalPaid,
                    remainingAmount: totalPrice - totalPaid,
                    pricePerKg,
                    initialWeight,
                }
            });
            
            // Log the update
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE',
                    entityType: 'SALE_DRAFT',
                    entityId: saleId,
                    details: `تعديل بيانات مسودة البيع للعميل ${customerName}.`
                }
            });
        });

        revalidatePath('/sales', 'layout');
        revalidatePath(`/sales/edit/${saleId}`);
        return { message: "تم تحديث مسودة البيع بنجاح!", success: true };
    } catch (error) {
        console.error("Error updating sale:", error);
        return { message: "فشل في تحديث مسودة البيع.", success: false };
    }
}


export async function deleteSale(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id) {
        return { message: 'ليس لديك الصلاحية لحذف المبيعات.', success: false };
    }

    try {
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: { payments: true, livestock: true }
        });

        if (!sale) {
            throw new Error('عملية البيع غير موجودة.');
        }
        
        const hasPermission = session.user.permissions?.sales?.delete;
        if (!hasPermission) {
          return { message: 'ليس لديك الصلاحية لحذف هذا النوع من المبيعات.', success: false };
        }

        await prisma.$transaction(async (tx) => {
            
            // If the sale was completed or pending, we need to revert changes
            if (sale.status === 'Completed' || sale.status === 'Pending') {
              // Revert wallet transactions by decrementing the balance
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
                
                // Only increment occupancy if the sale was fully completed (not just pending)
                if (sale.status === 'Completed') {
                    await tx.barn.update({
                      where: { id: sale.livestock.barnId },
                      data: { currentOccupancy: { increment: 1 } }
                    });
                }
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
            
            // If the sale was a draft, we also need to revert the animal status
            // because createSale doesn't change it until confirmation
            // But after confirmation, status becomes PendingSale or Sold
            // So if we delete a *draft*, we don't need to do anything with the livestock
            // Correction: No, the status *is* changed to PendingSale upon confirmation of deferred sale.
            // So when deleting a *draft*, nothing happens to the animal. Correct.
            // The logic above for 'Completed' or 'Pending' handles reverting status.

            // Log the deletion
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'DELETE',
                    entityType: 'SALE',
                    entityId: id,
                    details: `قام بحذف/إلغاء عملية البيع للعميل ${sale.customerName}.`
                }
            });
        });

        revalidatePath('/sales', 'layout');
        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        revalidatePath('/dashboard');
        return { message: 'تم حذف عملية البيع بنجاح.', success: true };

    } catch (error) {
        console.error('Error deleting sale:', error);
        return { message: 'فشل في حذف عملية البيع.', success: false };
    }
}
