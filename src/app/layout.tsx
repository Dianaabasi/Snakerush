import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers"; 
import { ThemeProvider } from "@/components/ThemeProvider";
import '@coinbase/onchainkit/styles.css'; 

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snakerush.vercel.app';

export const metadata: Metadata = {
  title: "SnakeRush",
  description: "Weekly Snake Challenge on Farcaster",
  openGraph: {
    title: "SnakeRush",
    description: "Weekly Snake Challenge. Play, Score, Win.",
    images: [`${appUrl}/logo.png`], 
  },
  other: {
    // This tag tells Farcaster "I am a Miniapp (Frame v2)"
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/logo.png`, //
      button: {
        title: "Play SnakeRush",
        action: {
          type: "launch_frame",
          name: "SnakeRush",
          url: appUrl,
          splashImageUrl: `${appUrl}/logo.png`,
          splashBackgroundColor: "#121212",
        },
      },
    }),
  },
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