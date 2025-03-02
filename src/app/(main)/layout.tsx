import { MobileNav } from '@/components/mobile-nav';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>
      <PWAInstallPrompt />
      <MobileNav />
    </>
  );
}
