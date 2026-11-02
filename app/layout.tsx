import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Aawaz — Bolo. Hum likh denge.',
  description:
    'Voice-first tool for Indian-language speakers. Speak in Hindi, Marathi, Tamil, or any Indian language. Get structured notes or ready-to-send formal letters — instantly.',
  keywords: ['speech to text', 'Indian languages', 'Hindi', 'notes', 'letter', 'Sarvam AI', 'Aawaz'],
  openGraph: {
    title: 'Aawaz — Bolo. Hum likh denge.',
    description: 'Speak in any Indian language. Get structured notes or formal letters instantly.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans h-full bg-gray-950 text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
