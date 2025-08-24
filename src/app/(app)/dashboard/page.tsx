
import { Suspense } from 'react';
import DashboardClientPage from './client-page';
import { PageHeader } from '@/components/page-header';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <>
       <PageHeader
        title="نظرة عامة على المواشي"
      />
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardClientPage />
      </Suspense>
    </>
  );
}
