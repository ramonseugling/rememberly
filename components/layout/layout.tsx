import { Footer } from '@/components/footer/footer';
import { Header } from '@/components/header/header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative flex min-h-screen gradient-soft flex-col">
      <Header />
      <main className="flex-1 flex flex-col mb-12">{children}</main>
      <Footer />
    </div>
  );
};
