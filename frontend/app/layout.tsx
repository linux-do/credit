import type { Metadata } from "next";
import { Inter, Noto_Sans_SC, Geist_Mono } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { CustomThemeProvider } from "@/lib/theme";
import { BellRingProvider } from "@/contexts/bell-ring-context";
import { NotificationSettingsProvider } from "@/contexts/notification-settings-context";
import "./globals.css";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "LINUX DO Credit",
  description: "Linux Do 社区积分服务平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${ inter.variable } ${ notoSansSC.variable } ${ geistMono.variable } hide-scrollbar font-sans`}
      suppressHydrationWarning
    >
      <body
        className={`${ inter.variable } ${ notoSansSC.variable } ${ geistMono.variable } hide-scrollbar font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomThemeProvider>
            <NotificationSettingsProvider>
              <BellRingProvider>
                {children}
                <Toaster position="top-center" />
              </BellRingProvider>
            </NotificationSettingsProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
