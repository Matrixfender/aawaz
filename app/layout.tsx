import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Aawaz — Bolo. Hum likh denge.',
  description:
    'Voice and text AI tool for Indian languages. Turn speech or problem descriptions into structured notes and formal letters in seconds.',
  keywords: [
    'speech to text',
    'Indian languages',
    'Hindi',
    'Marathi',
    'notes',
    'formal letter',
    'Sarvam AI',
    'Aawaz',
  ],
  openGraph: {
    title: 'Aawaz — Bolo. Hum likh denge.',
    description:
      'Voice-first AI for Indian language speakers. Structured notes and formal letters powered by Sarvam AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
