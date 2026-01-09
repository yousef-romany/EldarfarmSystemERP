import { PageHeader } from '@/components/page-header';
import { Suspense } from 'react';
import BackupClientPage from './client-page';

export default function BackupPage() {
  return (
    <>
      <PageHeader title="النسخ الاحتياطي" />
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <BackupClientPage />
      </Suspense>
    </>
  );
}
