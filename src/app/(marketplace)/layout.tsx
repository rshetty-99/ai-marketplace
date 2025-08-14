import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </div>
  );
}