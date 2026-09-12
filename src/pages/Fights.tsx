import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FightCard } from '../components/FightCard'
import { useData, useMedia, type Card, type Fight, type Track } from '../data'
import { useI18n } from '../i18n'
import { BRAND, Z600, capitalize, cx, daysUntil, formatDate } from '../lib/fight'
import { Reveal, SplitWords, reducedMotion, useParallax } from '../lib/motion'

// ── hero ───────────────────────────────────────────────────────────────────────

function Hero({ card, onBreakdown, wide }: { card: Card; onBreakdown: (i: number) => void; wide: boolean }) {
  const { t } = useI18n()
  const ev = card.event!
  const days = daysUntil(ev.date)
  const finished = card.fights.some(f => f.result)
  const upcoming = days >= 0 && !finished
  const eyebrow = days > 0 ? `${t.nextEvent} · ${t.inDays(days)}`
    : days === 0 ? `${t.nextEvent} · ${t.today}`
    : finished ? t.eventDone : t.eventPast
  const dateLine = `${capitalize(formatDate(ev.date, t.locale, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${t.fights(card.fights.length)}`
  // the headliner may have no forecast (then the log starts with the co-main) — fall back to the first fight
  const heroIndex = Math.max(0, card.fights.findIndex(f => f.main_event))
  const parallax = useParallax(0.1, wide)
  const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties
  const words = ev.name.split(' ').length

  // one atmospheric shot instead of the face-off; it fades into the page on every edge
  const artwork = (className: string) => (
    <div className={cx('hero-art pointer-events-none relative overflow-hidden', className)}
      style={{ transform: `translateY(${parallax}px)` }} aria-hidden>
      <img src={`${import.meta.env.BASE_URL}hero.webp`} alt="" width={1280} height={853} decoding="async"
        className="h-full w-full object-cover object-[52%_22%]" />
    </div>
  )
  const eyebrowEl = (cls: string) => (
    <div className={`eyebrow hero-in flex items-center gap-2 text-brand ${cls}`} style={d(0)}>
      {upcoming && <span className="live-dot" aria-hidden />}{eyebrow}
    </div>
  )
  const glow = 'radial-gradient(closest-side, rgb(var(--brand) / var(--glow-a)), transparent)'

  if (!wide) {
    return (
      <section className="relative overflow-hidden px-4 pb-[22px] pt-6" aria-labelledby="event-title">
        <div className="breathe pointer-events-none absolute left-1/2 top-10 -ml-[210px] h-[300px] w-[420px]" style={{ background: glow }} />
        {artwork('fadein mx-auto h-[190px] w-full max-w-[440px] rounded-2xl')}
        {eyebrowEl('relative mb-2.5 mt-[18px]')}
        <h1 id="event-title" className="relative m-0 text-[28px] font-bold leading-[1.12] tracking-[-0.02em]">
          <SplitWords text={ev.name} delay={120} />
        </h1>
        <div className="hero-in relative mt-2.5 text-[13px] text-zinc-400" style={d(200 + words * 55)}>{dateLine}</div>
        <div className="hero-in relative mt-[18px] flex flex-wrap gap-2.5" style={d(300 + words * 55)}>
          <button type="button" onClick={() => onBreakdown(heroIndex)}
            className="btn btn-brand flex h-11 flex-1 items-center justify-center rounded-[10px] bg-brand px-4 text-sm font-bold text-onbrand hover:bg-brand-hover">
            {t.ctaBreakdown}
          </button>
          <Link to="/accuracy" className="btn flex h-11 items-center justify-center rounded-[10px] border border-zinc-800 px-4 text-sm font-semibold text-zinc-300 hover:border-zinc-600 hover:text-zinc-50">
            {t.ctaAccuracy}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden border-b border-hair" aria-labelledby="event-title">
      <div className="breathe pointer-events-none absolute -bottom-40 -right-20 h-[520px] w-[720px]" style={{ background: glow }} />
      <div className="relative mx-auto grid max-w-[1024px] grid-cols-[minmax(0,1fr)_380px] items-end gap-6 px-6 pt-11 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="pb-11">
          {eyebrowEl('mb-3.5')}
          <h1 id="event-title" className="m-0 text-[36px] font-bold leading-[1.08] tracking-[-0.025em] lg:text-[44px]">
            <SplitWords text={ev.name} delay={100} />
          </h1>
          <div className="hero-in mt-3.5 text-sm text-zinc-400" style={d(180 + words * 55)}>{dateLine}</div>
          <div className="hero-in mt-7 flex flex-wrap gap-2.5" style={d(300 + words * 55)}>
            <button type="button" onClick={() => onBreakdown(heroIndex)}
              className="btn btn-brand rounded-lg bg-brand px-[18px] py-[11px] text-[13px] font-bold text-onbrand hover:bg-brand-hover">
              {t.ctaBreakdown}
            </button>
            <Link to="/accuracy" className="btn rounded-lg border border-zinc-800 px-[18px] py-[11px] text-[13px] font-semibold text-zinc-300 hover:border-zinc-600 hover:text-zinc-50">
              {t.ctaAccuracy}
            </Link>
          </div>
        </div>
        {artwork('fadein h-[300px] w-full self-stretch rounded-2xl lg:h-[340px]')}
      </div>
    </section>
  )
}

// ── states ─────────────────────────────────────────────────────────────────────

function Skeleton({ desktop }: { desktop: boolean }) {
  const { t } = useI18n()
  const blk = (w: string, h: number, extra = '') => <div className={`sk rounded-md ${extra}`} style={{ width: w, height: h }} />
  const side = (right = false) => (
    <div className={`flex items-center gap-3.5 ${right ? 'flex-row-reverse' : ''}`}>
      <div className="sk shrink-0 rounded-[10px]" style={{ width: desktop ? 52 : 44, height: desktop ? 52 : 44 }} />
      <div className={`flex flex-col gap-[7px] ${right ? 'items-end' : ''}`}>{blk(desktop ? '140px' : '72px', 12)}{blk(desktop ? '90px' : '48px', 9)}</div>
    </div>
  )
  return (
    <div className="mx-auto max-w-[1024px] px-3 pb-20 pt-9 md:px-6" aria-busy="true">
      <span className="sr-only" role="status">{t.loading}</span>
      <div className="mb-6 flex flex-col gap-3">{blk('180px', 11)}{blk('min(420px, 80%)', 34)}{blk('220px', 13)}</div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-xl border border-line bg-card">
            {desktop ? (
              <div className="grid grid-cols-[minmax(0,1fr)_240px_minmax(0,1fr)_20px] items-center gap-6 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_290px_minmax(0,1fr)_20px] lg:gap-7">
                {side()}
                <div className="flex flex-col gap-2">{blk('100%', 6)}{blk('40%', 9, 'mx-auto')}</div>
                {side(true)}
                <div />
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-3.5">
                <div className="flex justify-between">{side()}{side(true)}</div>
                {blk('100%', 6)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Message({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1024px] px-3 pb-20 pt-9 md:px-6">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-card px-6 py-11 text-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
          <rect x="4" y="6" width="20" height="18" rx="3" stroke={Z600} strokeWidth="1.6" />
          <path d="M4 11h20M10 3v5M18 3v5" stroke={Z600} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <h1 className="m-0 text-[15px] font-semibold text-zinc-50">{title}</h1>
        <p className="m-0 max-w-[420px] text-xs leading-normal text-zinc-500">{text}</p>
        {children}
      </div>
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────────

/** Which fight is expanded — mirrored to ?fight=N so a breakdown can be linked to. */
function useOpenFight(fights: Fight[]) {
  const [params, setParams] = useSearchParams()
  const n = fights.length
  const fromUrl = Number(params.get('fight'))
  const urlIndex = fromUrl >= 1 && fromUrl <= n ? fromUrl - 1 : null
  // the headliner is open in the hero, so the list itself starts closed and scannable
  const fallback = -1
  const [open, setOpen] = useState<number | null>(null)
  const current = open ?? urlIndex ?? fallback
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const pendingScroll = useRef<'nav' | 'open' | null>(null)
  const [tick, setTick] = useState(0)   // re-run the scroll even when the same fight is selected again
  // only an explicit "collapse this fight" animates the close; when another fight takes over,
  // the old panel disappears at once so the scroll target doesn't move under the animation
  const [animatedClose, setAnimatedClose] = useState(false)

  const select = useCallback((i: number, why: 'nav' | 'open') => {
    setAnimatedClose(i < 0)
    setOpen(i)
    setTick(x => x + 1)
    pendingScroll.current = i >= 0 ? why : null
    setParams(p => {
      if (i >= 0) p.set('fight', String(i + 1)); else p.delete('fight')
      return p
    }, { replace: true })
  }, [setParams])

  // keep the opened card's header in view: switching fights collapses the previous panel above it
  useEffect(() => {
    const why = pendingScroll.current
    pendingScroll.current = null
    const el = current >= 0 ? refs.current[current] : null
    if (!el || !why) return
    // a card that hasn't scrolled into view yet still sits 18px low (reveal transform) — measure its final spot
    const shift = el.parentElement ? new DOMMatrixReadOnly(getComputedStyle(el.parentElement).transform).m42 : 0
    const top = el.getBoundingClientRect().top - shift
    if (why === 'nav' || top < 0 || top > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.scrollY + top - 12, behavior: reducedMotion() ? 'auto' : 'smooth' })
    }
  }, [current, tick])

  return { open: current, select, refs, animatedClose }
}

function CardList({ card, fights, track, desktopRow, desktopPanel, nav }: {
  card: Card; fights: Fight[]; track: Track; desktopRow: boolean; desktopPanel: boolean
  nav: ReturnType<typeof useOpenFight>
}) {
  const { t } = useI18n()
  const { open, select, refs, animatedClose } = nav
  const n = fights.length
  return (
    <div className="mx-auto max-w-[1024px] px-3 pb-20 pt-2 md:px-6 md:pt-9">
      <Reveal className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 md:px-0">
        <h2 className="m-0 text-xs font-medium text-zinc-300">{t.card}</h2>
        <span className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: BRAND }} aria-hidden />{t.legend}
        </span>
      </Reveal>
      <div className="flex flex-col gap-2">
        {fights.map((f, i) => (
          // cards rise in one after another; bars and percentages inside wait for their card
          <Reveal key={`${f.fighter_1.slug}-${f.fighter_2.slug}`} delay={Math.min(i, 6) * 60}>
            <FightCard ref={el => { refs.current[i] = el }}
              fight={f} index={i} total={n} open={open === i} track={track}
              desktopRow={desktopRow} desktopPanel={desktopPanel} instantClose={!animatedClose}
              onToggle={() => select(open === i ? -1 : i, 'open')} onGo={i2 => select(i2, 'nav')} />
          </Reveal>
        ))}
      </div>
      <p className="mt-6 px-1 text-[11px] text-zinc-600 md:px-0">
        {t.updated(new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(card.generated_at)))}
      </p>
    </div>
  )
}

export default function Fights() {
  const { t } = useI18n()
  const data = useData()
  const desktopRow = useMedia('(min-width: 768px)')
  const desktopPanel = useMedia('(min-width: 1024px)')

  const card = data.status === 'ok' ? data.data.card : null
  const nav = useOpenFight(card?.fights ?? [])
  useEffect(() => { document.title = `fightev — ${t.nav.fights}` }, [t])

  if (data.status === 'loading') return <Skeleton desktop={desktopRow} />
  if (data.status === 'error') {
    return (
      <Message title={t.errorTitle} text={t.errorText}>
        <button type="button" onClick={data.retry}
          className="btn btn-brand mt-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-onbrand hover:bg-brand-hover">{t.retry}</button>
      </Message>
    )
  }
  const { track } = data.data
  if (!card || !card.event || !card.fights.length) {
    const last = track.events?.[track.events.length - 1]
    return (
      <Message title={t.emptyTitle} text={t.emptyText}>
        {last && (
          <Link to="/accuracy" className="btn btn-brand mt-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-onbrand hover:bg-brand-hover hover:text-bg">
            {t.emptyCta(last.name)}
          </Link>
        )}
      </Message>
    )
  }
  return (
    <>
      <Hero card={card} wide={desktopRow} onBreakdown={i => nav.select(i, 'nav')} />
      <CardList card={card} fights={card.fights} track={track} desktopRow={desktopRow} desktopPanel={desktopPanel} nav={nav} />
    </>
  )
}
