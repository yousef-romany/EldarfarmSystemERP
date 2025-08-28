
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { updateUserPassword } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
    </Button>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(updateUserPassword, { message: null, success: false });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'نجاح',
        description: state.message,
      });
      formRef.current?.reset();
    }
  }, [state, toast]);


  return (
    <>
      <PageHeader title="الإعدادات" />
      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card>
          <form action={formAction} ref={formRef}>
            <CardHeader>
              <CardTitle>كلمة المرور</CardTitle>
              <CardDescription>
                تغيير كلمة المرور الخاصة بك. للحفاظ على أمان حسابك، نوصي باختيار كلمة مرور قوية.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
               {state.message && !state.success && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>خطأ في التحديث</AlertTitle>
                    <AlertDescription>
                        {state.message}
                    </AlertDescription>
                </Alert>
             )}
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <SubmitButton />
            </CardFooter>
          </form>
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
