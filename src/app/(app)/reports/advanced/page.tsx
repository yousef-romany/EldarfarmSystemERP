import { PageHeader } from '@/components/page-header';
import { Suspense } from 'react';
import AdvancedReportsClientPage from './client-page';

export default function AdvancedReportsPage() {
  return (
    <>
      <PageHeader title="التقارير المتقدمة" />
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <AdvancedReportsClientPage />
      </Suspense>
    </>
  );
}
