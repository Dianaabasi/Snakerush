import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers"; 
import { ThemeProvider } from "@/components/ThemeProvider"; // Import the provider
import '@coinbase/onchainkit/styles.css'; 

export const metadata: Metadata = {
  title: "SnakeRush",
  description: "Weekly Snake Challenge on Farcaster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning is required by next-themes to prevent console errors */}
      <body className="bg-arcade-black text-text-white min-h-screen flex flex-col font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Providers>
            <main className="flex-grow flex flex-col items-center p-4 max-w-md mx-auto w-full relative">
              {children}
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}