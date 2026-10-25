"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LINKS } from "@/lib/nav-links";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav
        aria-label="Main"
        className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm sm:px-8"
      >
        <Link href="/board" className="font-semibold tracking-tight">
          Job Tracker
        </Link>

        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded px-2 py-1 transition-colors ${active
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
}