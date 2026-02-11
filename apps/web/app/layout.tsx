import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "HybridForce Web",
  description: "HybridForce dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background">
          <main className="mx-auto max-w-6xl p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
