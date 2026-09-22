import type { Metadata, Viewport } from "next";
import { display, body, mono } from "./fonts";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Afterward",
  description: "The calls after a death, made for you. A voice agent that notifies every institution from one conversation — and proves it.",
};
export const viewport: Viewport = { themeColor: "#F1EFEA" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <nav className="border-b border-line bg-surface-1">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <img src="/icon.svg" alt="" width={22} height={22} />
              Afterward
            </Link>
            <div className="ml-auto flex items-center gap-5 text-sm">
              <Link href="/board" className="hover:underline underline-offset-4">The board</Link>
              <Link href="/ledger/est_holt" className="hover:underline underline-offset-4">Estate Ledger</Link>
              <a href="https://github.com/pinectar/afterward" className="text-ink-muted hover:underline underline-offset-4">GitHub</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
