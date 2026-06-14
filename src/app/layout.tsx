import './globals.css';
import { Toaster } from 'sonner';

import SessionProvider from '@/components/providers/SessionProvider';

export const metadata = {
  title: 'Neuritas-AI',
  description: 'Premium AI chat experience for enterprise use.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
