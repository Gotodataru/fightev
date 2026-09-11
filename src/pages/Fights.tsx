import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FightCard } from '../components/FightCard'
import { Portrait } from '../components/ui'
import { useData, useMedia, type Card, type Track } from '../data'
import { useI18n } from '../i18n'
import { BRAND, capitalize, daysUntil, formatDate, split, verdict, favourite } from '../lib/fight'
import { Reveal, SplitWords, reducedMotion, useParallax } from '../lib/motion'

// ── hero ───────────────────────────────────────────────────────────────────────

function Hero({ card, onBreakdown, wide }: { card: Card; onBreakdown: (i: number) => void; wide: boolean }) {
  const { t } = useI18n()
  const ev = card.event!
  // the headliner may have no forecast (then the log starts with the co-main) — fall back to the first fight
  const heroIndex = Math.max(0, card.fights.findIndex(f => f.main_event))
  const main = card.fights[heroIndex]
  const days = daysUntil(ev.date)
  const finished = card.fights.some(f => f.result)
  const upcoming = days >= 0 && !finished
  const eyebrow = days > 0 ? `${t.nextEvent} · ${t.inDays(days)}`
    : days === 0 ? `${t.nextEvent} · ${t.today}`
    : finished ? t.eventDone : t.eventPast
  const dateLine = `${capitalize(formatDate(ev.date, t.locale, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${t.fights(card.fights.length)}`
  const p1 = main.p_win_f1
  const v = verdict(p1)
  const mainLabel = main.main_event
    ? `${main.title_fight ? t.titleFight : t.mainEvent} · ${t.rounds(main.num_rounds)}`
    : t.rounds(main.num_rounds)
  const cta = main.main_event ? t.ctaBreakdown : t.ctaFight
  const parallax = useParallax(0.1, wide)
  const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties
  const words = ev.name.split(' ').length

  // face-off: the two fighters slide in from their own sides
  const portraits = (w: number, overlap: number) => (
    <div className="mask-x flex w-full items-end justify-center" style={{ transform: `translateY(${parallax}px)` }}>
      <div className="from-left min-w-0" style={{ width: w, marginRight: -overlap, ...d(150) }}>
        <Portrait f={main.fighter_1} fav={p1 > 0.5} w={w} fade="#080808" eager animate={false} />
      </div>
      <div className="from-right min-w-0" style={{ width: w, ...d(250) }}>
        <Portrait f={main.fighter_2} fav={p1 < 0.5} w={w} fade="#080808" eager animate={false} />
      </div>
    </div>
  )
  const eyebrowEl = (cls: string) => (
    <div className={`eyebrow hero-in flex items-center gap-2 text-brand ${cls}`} style={d(0)}>
      {upcoming && <span className="live-dot" aria-hidden />}{eyebrow}
    </div>
  )
  const glow = 'radial-gradient(closest-side, rgba(0,239,92,0.12), transparent)'

  if (!wide) {
    return (
      <section className="relative overflow-hidden px-4 pb-[22px] pt-6" aria-labelledby="event-title">
        <div className="breathe pointer-events-none absolute left-1/2 top-10 -ml-[210px] h-[300px] w-[420px]" style={{ background: glow }} />
        <div className="relative mx-auto max-w-[400px]">{portraits(170, 18)}</div>
        {eyebrowEl('relative mb-2.5 mt-[18px]')}
        <h1 id="event-title" className="relative m-0 text-[28px] font-bold leading-[1.12] tracking-[-0.02em]">
          <SplitWords text={ev.name} delay={120} />
        </h1>
        <div className="hero-in relative mt-2.5 text-[13px] text-zinc-400" style={d(200 + words * 55)}>{dateLine}</div>
        <button type="button" onClick={() => onBreakdown(heroIndex)} style={d(300 + words * 55)}
          className="btn btn-brand hero-in relative mt-[18px] flex h-12 w-full items-center justify-center rounded-[10px] bg-brand text-sm font-bold text-bg hover:bg-brand-hover">
          {cta}
        </button>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden border-b border-white/5" aria-labelledby="event-title">
      <div className="breathe pointer-events-none absolute -bottom-40 -right-20 h-[520px] w-[720px]" style={{ background: glow }} />
      <div className="relative mx-auto grid max-w-[1024px] grid-cols-[minmax(0,1fr)_380px] items-end gap-6 px-6 pt-11 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="pb-11">
          {eyebrowEl('mb-3.5')}
          <h1 id="event-title" className="m-0 text-[36px] font-bold leading-[1.08] tracking-[-0.025em] lg:text-[44px]">
            <SplitWords text={ev.name} delay={100} />
          </h1>
          <div className="hero-in mt-3.5 text-sm text-zinc-400" style={d(180 + words * 55)}>{dateLine}</div>
          <div className="relative mt-7 flex flex-col gap-1.5 pt-5">
            <span className="line-in absolute inset-x-0 top-0 h-px bg-zinc-800" style={d(300 + words * 55)} aria-hidden />
            <span className="eyebrow hero-in text-zinc-500" style={d(380 + words * 55)}>{mainLabel}</span>
            <span className="hero-in text-xl font-semibold text-zinc-50" style={d(440 + words * 55)}>
              {main.fighter_1.name} <span className="font-normal text-zinc-600">vs</span> {main.fighter_2.name}
            </span>
            <span className="hero-in text-[13px] text-zinc-400" style={d(500 + words * 55)}>
              {t.modelSays(v, favourite(main).name, Math.max(...split(p1)))}
            </span>
          </div>
          <div className="hero-in mt-[22px] flex flex-wrap gap-2.5" style={d(580 + words * 55)}>
            <button type="button" onClick={() => onBreakdown(heroIndex)}
              className="btn btn-brand rounded-lg bg-brand px-[18px] py-[11px] text-[13px] font-bold text-bg hover:bg-brand-hover">
              {cta}
            </button>
            <Link to="/accuracy" className="btn rounded-lg border border-zinc-800 px-[18px] py-[11px] text-[13px] font-semibold text-zinc-300 hover:border-zinc-600 hover:text-zinc-50">
              {t.ctaAccuracy}
            </Link>
          </div>
        </div>
        <div className="flex h-[330px] w-full items-end">{portraits(250, 26)}</div>
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
          <rect x="4" y="6" width="20" height="18" rx="3" stroke="#7c7c86" strokeWidth="1.6" />
          <path d="M4 11h20M10 3v5M18 3v5" stroke="#7c7c86" strokeWidth="1.6" strokeLinecap="round" />
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
function useOpenFight(card: Card | null, desktopPanel: boolean) {
  const [params, setParams] = useSearchParams()
  const n = card?.fights.length ?? 0
  const fromUrl = Number(params.get('fight'))
  const urlIndex = fromUrl >= 1 && fromUrl <= n ? fromUrl - 1 : null
  // desktop opens the main event by default (as in the mockup); phones start with a scannable list
  const fallback = desktopPanel && card && !card.fights.some(f => f.result) ? Math.max(0, card.fights.findIndex(f => f.main_event)) : -1
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

function CardList({ card, track, desktopRow, desktopPanel, nav }: {
  card: Card; track: Track; desktopRow: boolean; desktopPanel: boolean; nav: ReturnType<typeof useOpenFight>
}) {
  const { t } = useI18n()
  const { open, select, refs, animatedClose } = nav
  const n = card.fights.length
  return (
    <div className="mx-auto max-w-[1024px] px-3 pb-20 pt-2 md:px-6 md:pt-9">
      <Reveal className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 md:px-0">
        <h2 className="m-0 text-xs font-medium text-zinc-300">{t.card}</h2>
        <span className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: BRAND }} aria-hidden />{t.legend}
        </span>
      </Reveal>
      <div className="flex flex-col gap-2">
        {card.fights.map((f, i) => (
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

  const nav = useOpenFight(data.status === 'ok' ? data.data.card : null, desktopPanel)
  useEffect(() => { document.title = `fightev — ${t.nav.fights}` }, [t])

  if (data.status === 'loading') return <Skeleton desktop={desktopRow} />
  if (data.status === 'error') {
    return (
      <Message title={t.errorTitle} text={t.errorText}>
        <button type="button" onClick={data.retry}
          className="mt-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-bg hover:bg-brand-hover">{t.retry}</button>
      </Message>
    )
  }
  const { card, track } = data.data
  if (!card.event || !card.fights.length) {
    const last = track.events?.[track.events.length - 1]
    return (
      <Message title={t.emptyTitle} text={t.emptyText}>
        {last && (
          <Link to="/accuracy" className="mt-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-bg hover:bg-brand-hover hover:text-bg">
            {t.emptyCta(last.name)}
          </Link>
        )}
      </Message>
    )
  }
  return (
    <>
      <Hero card={card} wide={desktopRow} onBreakdown={i => nav.select(i, 'nav')} />
      <CardList card={card} track={track} desktopRow={desktopRow} desktopPanel={desktopPanel} nav={nav} />
    </>
  )
}
