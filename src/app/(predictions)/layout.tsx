import { MobileNav } from '@/app/components/mobile-nav';
import { PWAInstallPrompt } from '../components/pwa-install-prompt';

export default function PredictionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      <PWAInstallPrompt />
      <MobileNav />
    </>
  );
}
