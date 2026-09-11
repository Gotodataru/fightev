import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useI18n, type Lang } from '../i18n'
import { cx } from '../lib/fight'

export function Logo({ className = 'text-[26px] md:text-[32px]' }: { className?: string }) {
  return (
    <span className={cx('font-black leading-none tracking-[-0.025em]', className)}>
      <span className="text-white">fight</span><span className="text-brand">ev</span>
    </span>
  )
}

function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useI18n()
  return (
    <div role="group" aria-label="Language / Язык" className={cx('flex rounded-lg border border-zinc-800 p-0.5', className)}>
      {(['ru', 'en'] as Lang[]).map(l => (
        <button key={l} type="button" aria-pressed={lang === l} lang={l} onClick={() => setLang(l)}
          className={cx('h-7 min-w-9 rounded-md px-2 font-mono text-[11px] font-semibold uppercase transition-colors',
            lang === l ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-500 hover:text-zinc-300')}>
          {l}
        </button>
      ))}
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [menu, setMenu] = useState(false)
  const { pathname, key } = useLocation()
  useEffect(() => setMenu(false), [pathname])
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  // With a basename the router writes the home URL as /fightev?fight=3; keep the canonical
  // /fightev/?fight=3 so a copied link doesn't depend on the host's slash redirect.
  useEffect(() => {
    const base = import.meta.env.BASE_URL
    if (window.location.pathname === base.replace(/\/$/, '')) {
      window.history.replaceState(window.history.state, '', base + window.location.search + window.location.hash)
    }
  }, [key])   // every navigation, including a repeat of the same URL

  const links = [
    { to: '/', label: t.nav.fights, end: true },
    { to: '/accuracy', label: t.nav.accuracy },
    { to: '/case', label: t.nav.case },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2">
        {t.nav.skip}
      </a>
      <header className="relative z-20 border-b border-white/5">
        <div className="mx-auto flex h-[52px] max-w-[1024px] items-center justify-between px-4 md:h-[58px] md:px-6">
          <NavLink to="/" aria-label="fightev" className="hover:opacity-90"><Logo /></NavLink>
          <nav className="hidden items-center gap-7 text-[13px] md:flex" aria-label="Main">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => cx('border-b-2 pb-[17px] pt-[19px] transition-colors',
                  isActive ? 'border-brand font-medium text-zinc-50 hover:text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-300')}>
                {l.label}
              </NavLink>
            ))}
            <LangSwitch />
          </nav>
          <button type="button" className="-mr-2 flex h-11 w-11 items-center justify-center text-zinc-400 md:hidden"
            aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu ? t.nav.close : t.nav.menu}
            onClick={() => setMenu(m => !m)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              {menu
                ? <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                : <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
        {menu && (
          <div id="mobile-menu" className="fadein absolute inset-x-0 top-full border-b border-white/5 bg-bg px-4 pb-4 md:hidden">
            <nav className="flex flex-col" aria-label="Main">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} end={l.end}
                  className={({ isActive }) => cx('flex h-12 items-center border-b border-zinc-900 text-[15px]',
                    isActive ? 'font-medium text-zinc-50' : 'text-zinc-400')}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <LangSwitch className="mt-4 w-fit" />
          </div>
        )}
      </header>
      <main id="main">{children}</main>
    </div>
  )
}
