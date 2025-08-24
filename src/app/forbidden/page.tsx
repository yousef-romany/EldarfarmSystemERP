
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold mt-4">وصول مرفوض</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            عفوًا، أنت لا تملك الصلاحية اللازمة لعرض هذه الصفحة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مدير النظام لمنحك الصلاحيات المناسبة.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">العودة إلى لوحة التحكم</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
