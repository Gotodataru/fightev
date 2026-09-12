import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useI18n, type Lang } from '../i18n'
import { useTheme } from '../theme'
import { cx } from '../lib/fight'

export function Logo({ className = 'text-[26px] md:text-[32px]' }: { className?: string }) {
  return (
    <span className={cx('font-black leading-none tracking-[-0.025em]', className)}>
      <span className="text-zinc-50">fight</span><span className="text-brand">ev</span>
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

function ThemeSwitch({ className }: { className?: string }) {
  const { t } = useI18n()
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? t.nav.toLight : t.nav.toDark} title={dark ? t.nav.toLight : t.nav.toDark}
      className={cx('theme-switch flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-50', className)}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
        {dark
          ? <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" fill="currentColor" />
          : (
            <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="8" cy="8" r="3.1" />
              <path d="M8 .9v1.6M8 13.5v1.6M15.1 8h-1.6M2.5 8H.9M13 3l-1.1 1.1M4.1 11.9 3 13M13 13l-1.1-1.1M4.1 4.1 3 3" />
            </g>
          )}
      </svg>
    </button>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname, key } = useLocation()
  useEffect(() => setMenu(false), [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
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
    <div className="relative flex min-h-screen flex-col bg-bg">
      <div className="ambient" aria-hidden />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2">
        {t.nav.skip}
      </a>
      <header className={cx('site-header border-b border-hair', scrolled && 'scrolled')}>
        <div className="mx-auto flex h-[52px] max-w-[1024px] items-center justify-between px-4 md:h-[58px] md:px-6">
          <NavLink to="/" aria-label="fightev" className="hover:opacity-90"><Logo /></NavLink>
          <nav className="hidden items-center gap-7 text-[13px] md:flex" aria-label="Main">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => cx('nav-link pb-[18px] pt-[19px] transition-colors',
                  isActive ? 'active font-medium text-zinc-50 hover:text-zinc-50' : 'text-zinc-500 hover:text-zinc-300')}>
                {l.label}
              </NavLink>
            ))}
            <LangSwitch />
            <ThemeSwitch />
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
          <div id="mobile-menu" className="menu-in absolute inset-x-0 top-full border-b border-hair bg-bg px-4 pb-4 md:hidden">
            <nav className="flex flex-col" aria-label="Main">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} end={l.end}
                  className={({ isActive }) => cx('flex h-12 items-center border-b border-zinc-900 text-[15px]',
                    isActive ? 'font-medium text-zinc-50' : 'text-zinc-400')}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex items-center gap-2.5">
              <LangSwitch className="w-fit" />
              <ThemeSwitch className="h-[34px] w-[34px]" />
            </div>
          </div>
        )}
      </header>
      <main id="main" key={pathname} className="page-in above">{children}</main>
      <footer className="above mt-auto border-t border-hair">
        <div className="mx-auto grid max-w-[1024px] gap-3 px-4 py-9 text-[12px] leading-[1.6] text-zinc-500 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-x-10 md:px-6">
          <p className="m-0">{t.footer.what}</p>
          <p className="m-0">{t.footer.liability}</p>
          <p className="m-0 md:col-span-2">
            {t.footer.data}{' '}
            <NavLink to="/accuracy" className="text-zinc-400 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-200">
              {t.footer.accuracy}
            </NavLink>
          </p>
        </div>
      </footer>
    </div>
  )
}
