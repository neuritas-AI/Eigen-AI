import './globals.css';
import { Toaster } from 'sonner';

import SessionProvider from '@/components/providers/SessionProvider';

export const metadata = {
  title: 'Brainz | AI Assistant',
  description: 'Brainz is an intelligent AI assistant powered by Neuritas-AI.',
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
