
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="الإعدادات" />
      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>الملف الشخصي</CardTitle>
            <CardDescription>
              تحديث معلومات ملفك الشخصي.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input id="name" defaultValue="أحمد محمود" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" defaultValue="ahmad@example.com" />
                </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>حفظ التغييرات</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>كلمة المرور</CardTitle>
            <CardDescription>
              تغيير كلمة المرور الخاصة بك. للحفاظ على أمان حسابك، نوصي باختيار كلمة مرور قوية.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">كلمة المرور الحالية</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input id="new-password" type="password" />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>تغيير كلمة المرور</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>المظهر</CardTitle>
            <CardDescription>
              اختر المظهر المناسب لك.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="light" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Sun className="mb-3 h-6 w-6" />
                  فاتح
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Moon className="mb-3 h-6 w-6" />
                  داكن
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
            <Button>حفظ المظهر</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
