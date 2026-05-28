import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'SleepCalm ERP | Gestão de Devoluções',
    template: '%s | SleepCalm ERP',
  },
  description: 'Sistema ERP premium para gestão completa de devoluções SleepCalm',
  keywords: ['ERP', 'Devoluções', 'Logística', 'SleepCalm'],
  authors: [{ name: 'SleepCalm' }],
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
