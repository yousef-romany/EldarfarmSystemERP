import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Beef } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 mb-6">
        <Beef className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">مدير المواشي</h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل اسم المستخدم وكلمة المرور للوصول إلى حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input id="username" placeholder="e.g., ahmad.mahmoud" required />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" asChild>
              <Link href="/dashboard">دخول</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
