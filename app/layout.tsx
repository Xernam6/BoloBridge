import type { Metadata } from 'next';
import { Lora, Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import ChatSidebarWrapper from '@/components/chat/ChatSidebarWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { GrainOverlay } from '@/components/ui/GrainOverlay';
import { TextSizeApplier } from '@/components/ui/TextSizeApplier';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Toaster } from '@/components/ui/Toaster';
import './globals.css';

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BoloBridge - Bridging Every Voice to Confidence',
  description:
    'AI-powered speech wellness and education platform for children ages 3-12. Multilingual, gamified speech development exercises.',
  keywords: [
    'speech practice',
    'communication',
    'learning',
    'phonics',
    'vocabulary',
    "children's education",
    'speech wellness',
  ],
  openGraph: {
    title: 'BoloBridge - Bridging Every Voice to Confidence',
    description:
      'AI-powered speech wellness and education platform for children. Gamified exercises, educational content, and parent dashboards.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          <GrainOverlay />
          <ScrollToTop />
          <Navbar />
          <main className="flex-1 pt-16 relative z-[1]">{children}</main>
          <Footer />
          <ChatSidebarWrapper />
          <CommandPalette />
          <Toaster />
          <TextSizeApplier />
        </ThemeProvider>
      </body>
    </html>
  );
}
