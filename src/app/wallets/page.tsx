import { PlusCircle, Wallet as WalletIcon, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { wallets } from '@/lib/data';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function WalletsPage() {
  return (
    <>
      <PageHeader
        title="إدارة المحافظ والخزائن"
        action={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة محفظة
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        { wallet.id === 'w5' ? <WalletIcon className="h-10 w-10 text-muted-foreground" /> : <Image src={wallet.icon} alt={wallet.name} width={40} height={40} className='rounded-md' data-ai-hint="logo" /> }
                        <CardTitle>{wallet.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">فتح القائمة</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem>تعديل</DropdownMenuItem>
                        <DropdownMenuItem>عرض الحركات</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            حذف
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <p className='text-2xl font-bold tracking-tight'>
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(wallet.balance)}
                </p>
                <p className='text-sm text-muted-foreground'>الرصيد الحالي</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

    