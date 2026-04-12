'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Cloud, LayoutDashboard, Map } from 'lucide-react';

const NAV_LINKS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/map', label: 'Map', Icon: Map },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-zinc-800"
      style={{
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(12px)',
        height: '56px',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline group">
          <Cloud
            className="size-5 shrink-0 text-sky-400 transition group-hover:text-sky-300"
            strokeWidth={2}
            aria-hidden
          />
          <span
            className="font-bold text-base tracking-tight text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Meteorology Hub
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                id={`nav-${label.toLowerCase()}`}
                href={href}
                className={`flex items-center gap-2 rounded-lg text-[13px] font-semibold no-underline transition-all duration-150 px-3.5 py-1.5 border ${
                  isActive
                    ? ''
                    : 'hover:bg-zinc-800/55 hover:text-zinc-200 hover:border-zinc-700/50'
                }`}
                style={{
                  background: isActive ? 'rgba(59,130,246,0.18)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  borderColor: isActive ? 'rgba(59,130,246,0.35)' : 'transparent',
                }}
              >
                <Icon
                  className="size-[17px] shrink-0 opacity-90"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
