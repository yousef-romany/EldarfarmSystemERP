import { PageHeader } from '@/components/page-header';
import { Suspense } from 'react';
import SearchClientPage from './client-page';

export default function SearchPage() {
  return (
    <>
      <PageHeader title="البحث المتقدم" />
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <SearchClientPage />
      </Suspense>
    </>
  );
}
