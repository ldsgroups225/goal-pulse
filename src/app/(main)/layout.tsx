import { MobileNav } from '@/components/mobile-nav';
import { Header } from '@/components/header';
import { PWAInstallPrompt } from '../_components/pwa-install-prompt';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pt-4 pb-24 max-w-7xl mx-auto">
        <div className="w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
      <PWAInstallPrompt />
      <MobileNav />
    </>
  );
}
