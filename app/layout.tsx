import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { NavFallback } from "@/components/nav-fallback";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track job applications through your pipeline.",
};

// Runs before first paint, so the page never flashes the wrong theme.
// It uses the saved choice if there is one, otherwise the system setting.
const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var dark = saved === "dark" ||
      ((!saved || saved === "system") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the script above may add the "dark" class
    // before React hydrates, which is expected.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* usePathname needs a Suspense boundary to prerender. The fallback
            is the same header without the active highlight. */}
        <Suspense fallback={<NavFallback />}>
          <Nav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}