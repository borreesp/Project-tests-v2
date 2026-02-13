import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "HybridForce Web",
  description: "HybridForce dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="min-h-screen bg-background">
          <main className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-8 lg:px-10 2xl:px-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
