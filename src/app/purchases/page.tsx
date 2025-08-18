
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { barns, wallets } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';
import type { Payment } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function PurchasesPage() {
  const [purchaseType, setPurchaseType] = useState('individual');
  const [payments, setPayments] = useState<Partial<Payment[]>>([{}]);
  const [totalCost, setTotalCost] = useState<number>(0);

  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalCost - totalPaid;

  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const handlePaymentChange = (index: number, field: keyof Omit<Payment, 'date'>, value: string | number) => {
    const newPayments = [...payments.map(p => ({...p}))];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };

  return (
    <>
      <PageHeader title="إضافة عملية شراء جديدة" />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>تفاصيل الشراء</CardTitle>
          <CardDescription>املأ النموذج أدناه لتسجيل حيوان جديد أو دفعة جديدة في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">

            <div className="grid gap-2">
                <Label>نوع التسجيل</Label>
                <RadioGroup defaultValue="individual" onValueChange={setPurchaseType} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="r-individual" />
                        <Label htmlFor="r-individual">حيوان فردي</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="batch" id="r-batch" />
                        <Label htmlFor="r-batch">دفعة</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchaseType === 'individual' && (
                <div className="grid gap-2">
                  <Label htmlFor="tagId">الرقم التعريفي</Label>
                  <Input id="tagId" placeholder="e.g., COW-004" />
                </div>
              )}
               <div className="grid gap-2">
                <Label htmlFor="type">النوع</Label>
                <Select>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseType === 'individual' ? (
                      <>
                        <SelectItem value="cow">بقرة</SelectItem>
                        <SelectItem value="sheep">خروف</SelectItem>
                        <SelectItem value="goat">ماعز</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="chicken">دجاج</SelectItem>
                        <SelectItem value="sheep">غنم</SelectItem>
                        <SelectItem value="goat">ماعز</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breed">السلالة</Label>
                <Input id="breed" placeholder="e.g., هولشتاين, ساسو" />
              </div>
              {purchaseType === 'batch' && (
                 <div className="grid gap-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input id="quantity" type="number" placeholder="e.g., 500" />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن عند الشراء (كجم)</Label>
                <Input id="weight" type="number" placeholder={purchaseType === 'individual' ? "e.g., 450" : "متوسط وزن الواحدة"} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر عند الشراء (أشهر)</Label>
                <Input id="age" type="number" placeholder="e.g., 18" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchase-price">سعر الشراء (ج.م)</Label>
                <Input 
                  id="purchase-price" 
                  type="number" 
                  placeholder={purchaseType === 'individual' ? "السعر للرأس الواحد" : "التكلفة الإجمالية للدفعة"}
                  onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                 />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <Select>
                  <SelectTrigger id="barn">
                    <SelectValue placeholder="اختر العنبر" />
                  </SelectTrigger>
                  <SelectContent>
                    {barns.map((barn) => (
                      <SelectItem key={barn.id} value={barn.id}>
                        {barn.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchase-date">تاريخ الشراء</Label>
                <Input id="purchase-date" type="date" />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>تفاصيل الدفع</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                      <div className="grid gap-2 flex-1">
                        <Label htmlFor={`wallet-${index}`}>المحفظة / الحساب</Label>
                        <Select onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
                          <SelectTrigger id={`wallet-${index}`}>
                            <SelectValue placeholder="اختر محفظة..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`amount-${index}`}>المبلغ</Label>
                        <Input id={`amount-${index}`} type="number" placeholder="المبلغ" onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePayment(index)}
                        disabled={payments.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddPayment}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  إضافة دفعة أخرى
                </Button>
              </CardContent>
              <CardContent>
                <div className='flex justify-between items-center p-3 bg-muted rounded-md mb-2'>
                  <span className='font-semibold'>الإجمالي المدفوع:</span>
                  <span className='font-bold text-lg'>
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalPaid)}
                  </span>
                </div>
                <div className='flex justify-between items-center p-3 bg-muted rounded-md'>
                  <span className='font-semibold'>المبلغ المتبقي:</span>
                  <span className='font-bold text-lg text-destructive'>
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(remainingBalance)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/">إلغاء</Link>
              </Button>
              <Button disabled={!totalCost || remainingBalance !== 0}>حفظ و إضافة</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
