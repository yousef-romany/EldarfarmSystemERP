'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { SidebarMenuButton } from './ui/sidebar';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  if (!installPrompt) {
    return null;
  }
  
  // This component can be rendered in two places, so we check the context via a data attribute
  const isSidebar = typeof document !== 'undefined' && document.querySelector('[data-sidebar="footer"]');

  if (isSidebar) {
    return (
        <SidebarMenuButton onClick={handleInstallClick} tooltip="تثبيت التطبيق">
            <Download />
            <span>تثبيت التطبيق</span>
        </SidebarMenuButton>
    )
  }

  return (
    <Button onClick={handleInstallClick} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      تثبيت التطبيق على جهازك
    </Button>
  );
}
