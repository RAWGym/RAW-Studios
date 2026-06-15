'use client'

import { usePathname, useRouter } from 'next/navigation'

const tabs = [
  {
    href: '/dashboard',
    label: 'Главная',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#2C2418'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    )
  },
  {
    href: '/bookings',
    label: 'Брони',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#2C2418'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    )
  },
  {
    href: '/studio',
    label: 'Студия',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#2C2418'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    )
  },
  {
    href: '/stats',
    label: 'Статистика',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#2C2418'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 17 9 11 13 15 21 7"/>
        <line x1="3" y1="21" x2="21" y2="21"/>
      </svg>
    )
  },
  {
    href: '/account',
    label: 'Профиль',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#2C2418'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    )
  },
]

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5' }}>
      <main style={{ paddingBottom: '100px' }}>
        {children}
      </main>
      <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <nav style={{ background: '#F0EBE3', borderRadius: '99px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 20px rgba(44,36,24,0.15)', border: '1px solid rgba(139,115,85,0.2)' }}>
          {tabs.map(tab => {
            const isActive = pathname === tab.href
            return (
              <button key={tab.href} onClick={() => router.push(tab.href)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 14px', borderRadius: '99px', border: 'none', cursor: 'pointer', background: isActive ? '#2C2418' : 'transparent', minWidth: '56px' }}>
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{tab.icon(isActive)}</span>
                <span style={{ fontSize: '9px', fontWeight: isActive ? '600' : '400', color: isActive ? 'white' : '#7A6B55', whiteSpace: 'nowrap' }}>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}