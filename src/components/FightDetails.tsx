import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Fight, Fighter, Track } from '../data'
import { useI18n } from '../i18n'
import {
  BRAND, FG, FILL, FILL_DIM, ON_BRAND, Z300, Z400, Z500, Z600, Z700, Z800, cx, favourite, formatDate,
  lastName, lowData, split, tapeRows, verdict,
} from '../lib/fight'
import { Pct, ProbBar, SectionLabel, Tag } from './ui'

// ── result badge (finished fights) ─────────────────────────────────────────────

export function ResultBadge({ fight }: { fight: Fight }) {
  const { t } = useI18n()
  const r = fight.result
  if (!r) return null
  if (r.winner === 0) {
    return <span className="whitespace-nowrap rounded-full border border-zinc-700 px-2.5 py-[3px] text-[11px] font-semibold text-zinc-300">{t.draw}</span>
  }
  const hit = (fight.p_win_f1 >= 0.5) === (r.winner === 1)
  return (
    <span className="pop inline-flex items-center gap-[5px] whitespace-nowrap rounded-full py-[3px] pl-[7px] pr-[9px] text-[11px] font-semibold"
      style={{ background: hit ? BRAND : Z800, color: hit ? ON_BRAND : FG, '--d': '250ms' } as React.CSSProperties}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        {hit
          ? <path d="M3 7.5l2.5 2.5L11 4.5" stroke={ON_BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M4 4l6 6M10 4l-6 6" stroke={FG} strokeWidth="2" strokeLinecap="round" />}
      </svg>
      {hit ? t.hit : t.miss}
    </span>
  )
}

export function resultText(fight: Fight, t: ReturnType<typeof useI18n>['t']): string | null {
  const r = fight.result
  if (!r || r.winner === 0) return null
  const w = lastName((r.winner === 1 ? fight.fighter_1 : fight.fighter_2).name)
  const m = t.method[r.method] ?? r.method
  if (r.method === 'DEC' || !r.round) return `${w} — ${m}`
  return `${w} — ${m}, ${t.roundN(r.round)}${r.time ? `, ${r.time}` : ''}`
}

// ── prediction ─────────────────────────────────────────────────────────────────

function WinRow({ p1, f1, f2 }: { p1: number; f1: Fighter; f2: Fighter }) {
  const [a, b] = split(p1)
  const { t } = useI18n()
  return (
    <div>
      <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3">
        <Pct v={a} fav={a > b} size={16} />
        <ProbBar p1={p1} height={8} animate />
        <Pct v={b} fav={b > a} size={16} className="text-right" />
      </div>
      {/* spell the forecast out, so the bar is never the only place it is stated */}
      <p className="m-0 mt-2 text-xs leading-normal text-zinc-500">
        <b className="font-semibold text-zinc-300">{t.forecastLabel}:</b>{' '}
        <span className={a >= b ? 'font-semibold text-zinc-50' : undefined}>{lastName(f1.name)} {a}%</span>
        {', '}
        <span className={b > a ? 'font-semibold text-zinc-50' : undefined}>{lastName(f2.name)} {b}%</span>
      </p>
    </div>
  )
}

/** A self-contained block of the panel. The stack animation makes each one slide
 *  out from under the block above it, so a long panel reads as a deck, not a wall. */
export function Module({ title, extra, children, i = 0, lead = false }: { title: string; extra?: ReactNode; children: ReactNode; i?: number; lead?: boolean }) {
  return (
    <section className={cx('stack-item relative rounded-xl border border-line bg-mod px-4 py-3.5', lead && 'lead')}
      style={{ zIndex: 30 - i } as React.CSSProperties}>
      <div className="stack-in" style={{ '--d': `${i * 90}ms` } as React.CSSProperties}>
        <SectionLabel extra={extra}>{title}</SectionLabel>
        {children}
      </div>
    </section>
  )
}

function FinishBlock({ fight, track, first = 1 }: { fight: Fight; track: Track; first?: number }) {
  const { t } = useI18n()
  const base = track.ufc_finish_rate_24m.rate !== null ? Math.round(track.ufc_finish_rate_24m.rate * 100) : null
  const fin = fight.p_finish !== null ? Math.round(fight.p_finish * 100) : null
  return (
    <>
      {fin !== null && (
        <Module title={t.finishTitle} i={first}>
          <div className="flex flex-col gap-1.5">
            {([[t.finishEarly, fin, fin >= 50], [t.finishDecision, 100 - fin, fin < 50]] as const).map(([label, v, lead], j) => (
              <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className={cx('text-[13px]', lead ? 'font-semibold text-zinc-50' : 'text-zinc-400')}>{label}</span>
                <span className="flex items-center gap-2.5">
                  <span className="relative h-1.5 w-[90px] rounded-full bg-zinc-900 sm:w-[130px]">
                    <span className="a-grow absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${v}%`, background: lead ? BRAND : FILL, animationDelay: `${0.25 + j * 0.1}s` }} />
                  </span>
                  <span className={cx('w-9 text-right font-mono text-[13px]', lead ? 'font-semibold text-zinc-50' : 'text-zinc-400')}>{v}%</span>
                </span>
              </div>
            ))}
          </div>
          <p className="m-0 mt-2 text-xs leading-normal text-zinc-500">{t.finishModelNote}</p>
        </Module>
      )}
      <Module title={fin !== null ? t.fightHistory : t.finishTitle} i={first + 1}>
      {[fight.fighter_1, fight.fighter_2].map((f, j) => {
        const n = f.decided_fights, k = f.finish_fights
        const pct = n ? Math.round((k / n) * 100) : 0
        const other = j === 0 ? fight.fighter_2 : fight.fighter_1
        const otherPct = other.decided_fights ? (other.finish_fights / other.decided_fights) * 100 : 0
        const ahead = n > 0 && pct > otherPct
        return (
          <div key={f.slug} className="grid h-[26px] grid-cols-[minmax(72px,112px)_minmax(0,1fr)_56px] items-center gap-3">
            <span className={cx('truncate text-xs', ahead ? 'font-semibold text-zinc-50' : 'text-zinc-300')}>{lastName(f.name)}</span>
            <div className="relative h-1.5 rounded-full bg-zinc-900">
              {n > 0 && <div className="a-grow h-1.5 rounded-full" style={{ width: `${pct}%`, background: ahead ? BRAND : FILL, animationDelay: `${0.3 + j * 0.1}s` }} />}
              {base !== null && (
                <div className="absolute -top-1 h-3.5 w-0.5 rounded-[1px]" style={{ left: `${base}%`, background: Z500 }} aria-hidden />
              )}
            </div>
            <span className={cx('text-right font-mono text-xs', ahead ? 'font-semibold text-zinc-50' : 'text-zinc-400')}>{n ? t.of(k, n) : t.noFights}</span>
          </div>
        )
      })}
      {base !== null && <p className="mt-2 text-xs leading-normal text-zinc-500">{t.finishNote(base)}</p>}
      </Module>
    </>
  )
}

export function PredictionBlock({ fight, track, first = 0 }: { fight: Fight; track: Track; first?: number }) {
  const { t } = useI18n()
  const v = verdict(fight.p_win_f1)
  const fav = favourite(fight)
  const done = fight.result
  return (
    <div className="stack flex flex-col gap-2.5">
      <Module i={first} lead title={done ? t.predictionWas : t.winForecast}
        extra={lowData(fight) ? <Tag>{t.lowDataLong}</Tag> : undefined}>
      <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-zinc-50">
          {t.verdict(v)}{v !== 'even' && <> — {fav.name}</>}
        </span>
        {done && <ResultBadge fight={fight} />}
      </div>
      <WinRow p1={fight.p_win_f1} f1={fight.fighter_1} f2={fight.fighter_2} />
      <div className="mt-3 flex flex-col gap-1 text-xs leading-normal text-zinc-500">
        {done && resultText(fight, t) && <div className="text-zinc-400">{resultText(fight, t)}</div>}
        {track.n_fights > 0 && (
          <div>
            {t.trackLine(track.model.hits, track.n_fights, track.n_events)} <Link to="/accuracy">{t.howCounted}</Link>
          </div>
        )}
      </div>
      </Module>
      <FinishBlock fight={fight} track={track} first={first + 1} />
    </div>
  )
}

// ── tale of the tape ───────────────────────────────────────────────────────────

function NoStats({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <div className={cx('rounded-[10px] border border-dashed border-zinc-800 p-4 text-xs leading-relaxed text-zinc-500', className)}>
      {t.noStats}
    </div>
  )
}

const bothMissing = (f: Fight) => !f.fighter_1.stats && !f.fighter_2.stats

export function TapeDesktop({ fight }: { fight: Fight }) {
  const { t, lang } = useI18n()
  if (bothMissing(fight)) return <NoStats />
  return (
    <div role="table" aria-label={t.tape}>
      {tapeRows(fight.fighter_1, fight.fighter_2, t, lang).map((r, k) => {
        const c1 = r.adv === 1 ? FG : r.adv === 0 ? Z300 : Z500
        const c2 = r.adv === 2 ? FG : r.adv === 0 ? Z300 : Z500
        const delay = `${(0.25 + k * 0.035).toFixed(3)}s`
        return (
          <div key={r.key} role="row" className="rowin grid h-[30px] grid-cols-[64px_minmax(0,1fr)_150px_minmax(0,1fr)_64px] items-center gap-3"
            style={{ animationDelay: `${(0.2 + k * 0.035).toFixed(3)}s` }}>
            <span role="cell" className="tnum font-mono text-[13px]" style={{ color: c1 }}>{r.t1}</span>
            {r.bars ? (
              <div className="flex h-1 justify-end rounded-full bg-zinc-900" aria-hidden>
                <div className="a-grow-r rounded-full" style={{ width: `${r.w1}%`, background: r.adv === 1 ? BRAND : Z600, animationDelay: delay }} />
              </div>
            ) : <div />}
            <span role="rowheader" className="text-center text-[11px] text-zinc-500">{r.label}</span>
            {r.bars ? (
              <div className="flex h-1 rounded-full bg-zinc-900" aria-hidden>
                <div className="a-grow rounded-full" style={{ width: `${r.w2}%`, background: r.adv === 2 ? BRAND : Z600, animationDelay: delay }} />
              </div>
            ) : <div />}
            <span role="cell" className="tnum text-right font-mono text-[13px]" style={{ color: c2 }}>{r.t2}</span>
          </div>
        )
      })}
    </div>
  )
}

export function TapeMobile({ fight }: { fight: Fight }) {
  const { t, lang } = useI18n()
  if (bothMissing(fight)) return <NoStats />
  const dot = (on: boolean) => <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? BRAND : 'transparent' }} aria-hidden />
  return (
    <div role="table" aria-label={t.tape}>
      {tapeRows(fight.fighter_1, fight.fighter_2, t, lang).map(r => (
        <div key={r.key} role="row" className="grid min-h-9 grid-cols-[6px_72px_minmax(0,1fr)_72px_6px] items-center gap-2 border-b border-zinc-900">
          {dot(r.adv === 1)}
          <span role="cell" className="tnum font-mono text-[13px]" style={{ color: r.adv === 1 ? FG : r.adv === 0 ? Z300 : Z500 }}>{r.t1}</span>
          <span role="rowheader" className="text-center text-xs text-zinc-500">{r.label}</span>
          <span role="cell" className="tnum text-right font-mono text-[13px]" style={{ color: r.adv === 2 ? FG : r.adv === 0 ? Z300 : Z500 }}>{r.t2}</span>
          {dot(r.adv === 2)}
        </div>
      ))}
    </div>
  )
}

// ── style panel ────────────────────────────────────────────────────────────────

function FormChips({ f, align }: { f: Fighter; align: 'start' | 'end' }) {
  const { t } = useI18n()
  if (!f.form.length) return <span className="text-[11px] text-zinc-600">{t.noUfc}</span>
  return (
    <ul className={cx('flex gap-1.5', align === 'end' && 'justify-end')}>
      {f.form.map((x, k) => {
        const st = x.res === 'W' ? { background: BRAND, color: ON_BRAND }
          : x.res === 'L' ? { background: Z800, color: Z400 }
          : { border: `1px solid ${Z700}`, color: Z400 }
        const date = formatDate(x.date, t.locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
        const label = `${x.res} ${t.vs} ${x.opp}, ${x.method !== 'OTHER' ? t.method[x.method] + ', ' : ''}${date}`
        return (
          <li key={x.date + x.opp} title={label} aria-label={label} className="flex flex-col items-center gap-1">
            <span className="pop flex h-7 w-7 items-center justify-center rounded-[7px] font-mono text-xs font-bold"
              style={{ ...st, '--d': `${350 + k * 70}ms` } as unknown as React.CSSProperties}>{x.res}</span>
            <span className="font-mono text-[10px] text-zinc-600">{x.method !== 'OTHER' ? x.method : '—'}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function SidePanel({ f, align = 'start' }: { f: Fighter; align?: 'start' | 'end' }) {
  const { t } = useI18n()
  const right = align === 'end'
  const lm = f.layoff_months
  const long = lm !== null && lm >= 9
  const w = f.ufc_wins
  const tot = w.KO + w.SUB + w.DEC
  const segs = ([['KO', w.KO, Z300], ['SUB', w.SUB, FILL], ['DEC', w.DEC, FILL_DIM]] as const).filter(s => s[1] > 0)
  return (
    <div className={cx('flex flex-col gap-[18px]', right && 'text-right')}>
      {(f.nickname || lm !== null) && (
        <div className={cx('flex min-h-[38px] flex-col gap-1 text-xs text-zinc-500', right ? 'items-end' : 'items-start')}>
          {f.nickname && <span>«{f.nickname}»</span>}
          {lm !== null && (
            <span className={cx(long && 'font-medium text-zinc-300')}>{t.lastFight(lm)}</span>
          )}
        </div>
      )}
      <div>
        <SectionLabel end={right}>{t.howWins}</SectionLabel>
        {tot ? (
          <>
            <div className="a-grow flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
              {segs.map(([k, v, c]) => <div key={k} style={{ width: `${(v / tot) * 100}%`, background: c }} />)}
            </div>
            <div className="mt-[7px] font-mono text-[11px] text-zinc-400">{segs.map(([k, v]) => `${k} ${v}`).join('   ')}</div>
          </>
        ) : <span className="text-[11px] text-zinc-600">{t.noWins}</span>}
      </div>
      <div>
        <SectionLabel end={right}>{t.zones}</SectionLabel>
        {f.zones ? (['head', 'body', 'leg'] as const).map((z, j) => (
          <div key={z} className="grid h-5 grid-cols-[56px_minmax(0,1fr)_34px] items-center gap-2 text-left">
            <span className="text-[11px] text-zinc-500">{t.zoneNames[z]}</span>
            <div className="h-1 rounded-full bg-zinc-900" aria-hidden>
              <div className="a-grow h-1 rounded-full bg-zinc-400" style={{ width: `${f.zones![z]}%`, animationDelay: `${0.15 + j * 0.08}s` }} />
            </div>
            <span className="text-right font-mono text-[11px] text-zinc-300">{f.zones![z]}%</span>
          </div>
        )) : <span className="text-[11px] text-zinc-600">{t.notEnough}</span>}
      </div>
      <div>
        <SectionLabel end={right}>{t.last5}</SectionLabel>
        <FormChips f={f} align={align} />
      </div>
    </div>
  )
}
