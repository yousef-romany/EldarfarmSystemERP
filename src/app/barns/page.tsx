import { PlusCircle, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { barns } from '@/lib/data';
import { PageHeader } from '@/components/page-header';

export default function BarnsPage() {
  return (
    <>
      <PageHeader
        title="إدارة العنابر"
        action={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة عنبر
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {barns.map((barn) => (
          <Card key={barn.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-6 w-6 text-muted-foreground" />
                {barn.name}
              </CardTitle>
              <CardDescription>
                السعة: {barn.capacity} رأس | الإشغال الحالي: {barn.currentOccupancy} رأس
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={(barn.currentOccupancy / barn.capacity) * 100} className="h-3" />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                مساحة فارغة لـ {barn.capacity - barn.currentOccupancy} رأس
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
