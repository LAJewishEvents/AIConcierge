import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "LAJE Concierge",
  description: "AI Concierge system for LA Jewish Events (Series A UI).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">{children}</div>
      </body>
    </html>
  );
}
