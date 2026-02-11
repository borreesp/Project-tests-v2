import type { Metadata } from "next";

import "./globals.css";
import { RoleTabs } from "@/components/role-tabs";

export const metadata: Metadata = {
  title: "Web App",
  description: "Next.js App Router scaffold",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background">
          <RoleTabs />
          <main className="mx-auto max-w-4xl p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
