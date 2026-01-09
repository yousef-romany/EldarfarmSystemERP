'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle2, Clock, HardDrive } from 'lucide-react';
import { formatDateArabic, formatNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Backup = {
  filename: string;
  size: number;
  created: Date;
};

export default function BackupClientPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backup');
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل قائمة النسخ الاحتياطية',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      const data = await response.json();

      if (data.success) {
        // Download the backup file
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'تم إنشاء النسخة الاحتياطية',
          description: `تم إنشاء النسخة الاحتياطية بنجاح: ${data.filename}`,
        });

        // Reload backups list
        loadBackups();
      } else {
        throw new Error(data.error || 'Failed to create backup');
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء النسخة الاحتياطية',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async (file: File) => {
    setIsRestoring(true);
    try {
      const content = await file.text();
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', content }),
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'تم استعادة النسخة الاحتياطية',
          description: 'تم استعادة قاعدة البيانات بنجاح. سيتم إعادة تحميل الصفحة...',
        });

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to restore backup');
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في استعادة النسخة الاحتياطية',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Load backups on mount
  useState(() => {
    loadBackups();
  });

  return (
    <div className="space-y-6">
      {/* Backup Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              إنشاء نسخة احتياطية
            </CardTitle>
            <CardDescription>
              قم بإنشاء نسخة احتياطية من قاعدة البيانات الحالية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={createBackup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  إنشاء نسخة احتياطية
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              استعادة نسخة احتياطية
            </CardTitle>
            <CardDescription>
              استعادة قاعدة البيانات من نسخة احتياطية سابقة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                accept=".sql"
                onChange={handleFileSelect}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100
                "
              />
            </div>
            <Button
              onClick={() => selectedFile && restoreBackup(selectedFile)}
              disabled={!selectedFile || isRestoring}
              className="w-full"
              variant="outline"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  جاري الاستعادة...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  استعادة النسخة الاحتياطية
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Warning Card */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <AlertCircle className="h-5 w-5" />
            تحذير هام
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-900 dark:text-orange-100 space-y-2">
          <p>
            <strong>تنبيه:</strong> عملية استعادة النسخة الاحتياطية ستحل محل جميع البيانات الحالية في قاعدة البيانات.
          </p>
          <p>
            يُنصح دائماً بإنشاء نسخة احتياطية جديدة قبل إجراء أي عملية استعادة.
          </p>
          <p>
            تأكد من أن النسخة الاحتياطية التي تستعيدها موثوقة وخالية من الأخطاء.
          </p>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            النسخ الاحتياطية المتاحة
          </CardTitle>
          <CardDescription>
            قائمة بجميع النسخ الاحتياطية المتاحة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد نسخ احتياطية متاحة حالياً
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <div
                  key={backup.filename}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{backup.filename}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateArabic(backup.created, true)}
                      </span>
                      <span>الحجم: {formatFileSize(backup.size)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
