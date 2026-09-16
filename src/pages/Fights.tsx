import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FightCard } from '../components/FightCard'
import { Message } from '../components/ui'
import { useData, useMedia, type Card, type Fight, type Track } from '../data'
import { useI18n } from '../i18n'
import { BRAND, capitalize, cx, daysUntil, formatDate } from '../lib/fight'
import { Reveal, SplitWords, reducedMotion } from '../lib/motion'

// ── hero ───────────────────────────────────────────────────────────────────────

function Hero({ card, track, onBreakdown, wide }: {
  card: Card; track: Track; onBreakdown: (i: number) => void; wide: boolean
}) {
  const { t } = useI18n()
  const ev = card.event!
  const days = daysUntil(ev.date)
  const finished = card.fights.some(f => f.result)
  const when = !finished && days > 0 ? t.inDays(days) : !finished && days === 0 ? t.today : null
  const eyebrow = when ? t.nextEvent : finished ? t.eventDone : t.eventPast
  const dateLine = capitalize(formatDate(ev.date, t.locale, { weekday: 'long', day: 'numeric', month: 'long' }))
    + ' — ' + t.fights(card.fights.length)
  // the headliner may have no forecast (then the log starts with the co-main) — fall back to the first fight
  const heroIndex = Math.max(0, card.fights.findIndex(f => f.main_event))
  const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties
  const words = ev.name.split(' ').length
  const rate = track.n_fights ? Math.round(track.model.rate * 100) : null
  const mkt = track.n_fights ? Math.round(track.favourite.rate * 100) : null

  // the accuracy figure carries its benchmark: on its own, in the brand colour, under a
  // legend that says green means the edge, 62% reads as an achievement
  const stats: [label: string, value: string, note?: string][] = [
    [t.statFights, String(card.fights.length)],
    [t.statChecked, String(track.n_fights)],
    [t.statAccuracy, rate !== null ? `${rate}%` : '—', mkt !== null ? t.statVsMarket(mkt) : undefined],
    [t.statEvents, String(track.n_events)],
  ]

  return (
    <section className="relative overflow-hidden border-b border-hair" aria-labelledby="event-title">
      <div className="mx-auto w-full max-w-[1024px] px-4 pb-10 pt-10 md:px-6 md:pb-14 md:pt-16 lg:pb-16 lg:pt-20">
        <div className="eyebrow hero-in flex items-center gap-2.5 text-brand" style={d(0)}>
          {eyebrow}
          {when && <><span className="h-3 w-px bg-brand/40" aria-hidden />{when}</>}
        </div>
        <h1 id="event-title"
          className="m-0 mt-3.5 max-w-[15ch] text-[34px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[48px] md:mt-4 lg:text-[64px]">
          <SplitWords text={ev.name} delay={100} />
        </h1>
        <div className="hero-in mt-3.5 text-[15px] text-zinc-400 md:mt-4 md:text-base" style={d(180 + words * 45)}>
          {dateLine}
        </div>
        {/* the one line that says what the site is: the headline only ever named the event */}
        <p className="hero-in mb-0 mt-3 max-w-[540px] text-[15px] leading-[1.6] text-zinc-400" style={d(260 + words * 45)}>
          {t.heroLead}
        </p>
        <div className="hero-in mt-7 flex flex-wrap gap-2.5 md:mt-8" style={d(340 + words * 45)}>
          <button type="button" onClick={() => onBreakdown(heroIndex)}
            className="btn btn-brand rounded-lg bg-brand px-5 py-3 text-sm font-bold text-onbrand hover:bg-brand-hover">
            {t.ctaBreakdown}
          </button>
          <Link to="/accuracy"
            className="btn rounded-lg border border-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-300 hover:border-zinc-600 hover:text-zinc-50">
            {t.ctaAccuracy}
          </Link>
        </div>
        <div className="hero-in mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-hair pt-6 md:mt-14 md:grid-cols-4 md:gap-8 md:pt-7"
          style={d(440 + words * 45)}>
          {stats.map(([label, value, note]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <span className="eyebrow text-zinc-500">{label}</span>
              <span className={cx('tnum font-mono font-bold leading-none text-brand',
                wide ? 'text-[32px]' : 'text-[26px]')}>{value}</span>
              {note && <span className="text-[11px] leading-none text-zinc-500">{note}</span>}
            </div>
          ))}
        </div>
        {/* the disclaimer used to live only in the footer, 3200 pixels down */}
        <p className="hero-in mb-0 mt-6 text-[11px] text-zinc-500" style={d(520 + words * 45)}>{t.independent}</p>
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
    <div className="mx-auto max-w-[1024px] px-4 pb-20 pt-9 md:px-6" aria-busy="true">
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

// ── page ───────────────────────────────────────────────────────────────────────

/** Which fight is expanded — mirrored to ?fight=N so a breakdown can be linked to. */
function useOpenFight(fights: Fight[], desktopPanel: boolean) {
  const [params, setParams] = useSearchParams()
  const n = fights.length
  const fromUrl = Number(params.get('fight'))
  const urlIndex = fromUrl >= 1 && fromUrl <= n ? fromUrl - 1 : null
  // a wide screen has room to show the headliner straight away; phones start with a scannable list
  const fallback = desktopPanel && fights.length && !fights.some(f => f.result)
    ? Math.max(0, fights.findIndex(f => f.main_event)) : -1
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
    <div className="mx-auto max-w-[1024px] px-4 pb-20 pt-2 md:px-6 md:pt-9">
      <Reveal className="mb-3 flex flex-col gap-1.5 px-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2 md:px-0">
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
  const nav = useOpenFight(card?.fights ?? [], desktopPanel)
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
      <Hero card={card} track={track} wide={desktopRow} onBreakdown={i => nav.select(i, 'nav')} />
      <CardList card={card} fights={card.fights} track={track} desktopRow={desktopRow} desktopPanel={desktopPanel} nav={nav} />
    </>
  )
}
