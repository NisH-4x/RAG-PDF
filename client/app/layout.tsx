import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { FileText } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Chat",
  description: "Upload a PDF and ask questions about its contents.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="h-full overflow-hidden bg-background text-foreground">
          <div className="flex h-full flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-semibold tracking-tight">
                    PDF Chat
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Ask questions about your documents
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Show when="signed-out">
                  <SignInButton>
                    <button className="h-8 cursor-pointer rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="h-8 cursor-pointer rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80">
                      Sign up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </header>

            <main className="min-h-0 flex-1">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
