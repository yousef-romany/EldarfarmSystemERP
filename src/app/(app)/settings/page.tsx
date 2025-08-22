
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';


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
             <ThemeToggle />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
