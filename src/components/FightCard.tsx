import { forwardRef, useEffect, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Fight, Fighter, Track } from '../data'
import { useI18n } from '../i18n'
import { Z600, cx, lowData, record, split, verdict } from '../lib/fight'
import { Collapse } from '../lib/motion'
import { Module, PredictionBlock, ResultBadge, SidePanel, TapeDesktop, TapeMobile, resultText } from './FightDetails'
import { Avatar, Chevron, Pct, Portrait, ProbBar, Tag } from './ui'

interface Props {
  fight: Fight
  index: number
  total: number
  open: boolean
  track: Track
  desktopRow: boolean      // >= 768px: one-line row
  desktopPanel: boolean    // >= 1024px: three-column panel instead of tabs
  instantClose: boolean    // another fight took over: collapse without animating (keeps scroll stable)
  onToggle: () => void
  onGo: (i: number) => void
  solo?: boolean           // the headliner in the hero: always open, nothing to toggle or page through
}

// ── shared bits ────────────────────────────────────────────────────────────────

function FightNav({ index, total, onGo, size }: { index: number; total: number; onGo: (i: number) => void; size: number }) {
  const { t } = useI18n()
  const [pre, n, post] = t.fightNofM(index + 1, total)
  const btn = (dir: -1 | 1) => (
    <button type="button" className="navbtn flex items-center justify-center rounded-full border border-zinc-800 text-zinc-300"
      style={{ width: size, height: size }} disabled={dir < 0 ? index === 0 : index === total - 1}
      aria-label={dir < 0 ? t.prevFight : t.nextFight}
      onClick={e => { e.stopPropagation(); onGo(index + dir) }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d={dir < 0 ? 'M8.5 3.5L5 7l3.5 3.5' : 'M5.5 3.5L9 7l-3.5 3.5'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
  return (
    <div className="flex items-center justify-center gap-3.5">
      {btn(-1)}
      <span className="whitespace-nowrap text-[11px] text-zinc-500" aria-live="polite">
        {pre}<b className="font-mono text-zinc-300">{n}</b>{post}
      </span>
      {btn(1)}
    </div>
  )
}

function ToggleButton({ fight, open, controls, onToggle }: { fight: Fight; open: boolean; controls: string; onToggle: () => void }) {
  const { t } = useI18n()
  return (
    <button type="button" aria-expanded={open} aria-controls={controls}
      aria-label={open ? t.collapse : t.expand(fight.fighter_1.name, fight.fighter_2.name)}
      onClick={e => { e.stopPropagation(); onToggle() }}
      className="-m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-2" style={{ color: Z600 }}>
      <Chevron open={open} />
    </button>
  )
}

function ProbCenter({ fight }: { fight: Fight }) {
  const { t } = useI18n()
  const [a, b] = split(fight.p_win_f1)
  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-baseline justify-between">
        <Pct v={a} fav={a > b} />
        <span className="eyebrow text-zinc-600">{t.win}</span>
        <Pct v={b} fav={b > a} />
      </div>
      <ProbBar p1={fight.p_win_f1} animate delay={0.15} />
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-[5px] whitespace-nowrap text-[11px] text-zinc-500">
        <span>{t.verdict(verdict(fight.p_win_f1))}</span>
        {lowData(fight) && <Tag>{t.lowData}</Tag>}
      </div>
    </div>
  )
}

function ResultCenter({ fight }: { fight: Fight }) {
  const { t } = useI18n()
  const [a, b] = split(fight.p_win_f1)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Pct v={a} fav={a > b} />
        <span className="eyebrow text-zinc-600">{t.predictionWas}</span>
        <Pct v={b} fav={b > a} />
      </div>
      <ProbBar p1={fight.p_win_f1} animate delay={0.15} />
      <div className="mt-0.5 flex flex-col items-center gap-1.5">
        <ResultBadge fight={fight} />
        {resultText(fight, t) && <span className="text-[11px] text-zinc-400">{resultText(fight, t)}</span>}
      </div>
    </div>
  )
}

// ── desktop ────────────────────────────────────────────────────────────────────

function DesktopSide({ f, open, right, big }: { f: Fighter; open: boolean; right?: boolean; big?: boolean }) {
  const { t } = useI18n()
  return (
    <div className={cx('flex min-w-0 items-center gap-3.5', right && 'flex-row-reverse text-right')}>
      {!open && <Avatar f={f} size={big ? 60 : undefined} />}
      <div className="min-w-0">
        <div className={cx('truncate font-semibold text-zinc-50', big ? 'text-[19px] tracking-[-0.01em]' : 'text-[15px]')}>{f.name}</div>
        <div className="mt-[3px] font-mono text-[11px] text-zinc-500">{record(f, t)}</div>
      </div>
    </div>
  )
}

function DesktopPanel({ fight, track, index, total, onGo }: {
  fight: Fight; track: Track; index: number; total: number; onGo: (i: number) => void
}) {
  const { t } = useI18n()
  const p1 = fight.p_win_f1
  return (
    <>
      <div className="grid grid-cols-[200px_minmax(0,1fr)_200px] gap-9 px-5 py-6">
        <div className="flex flex-col gap-[18px]">
          <Portrait f={fight.fighter_1} fav={p1 > 0.5} />
          <SidePanel f={fight.fighter_1} />
        </div>
        <div className="stack flex flex-col gap-2.5 pt-1">
          <Module i={0} title={t.tape}><TapeDesktop fight={fight} /></Module>
          <PredictionBlock fight={fight} track={track} first={1} />
        </div>
        <div className="flex flex-col items-end gap-[18px]">
          <Portrait f={fight.fighter_2} fav={p1 < 0.5} />
          <SidePanel f={fight.fighter_2} align="end" />
        </div>
      </div>
      {/* the pager sits at the end: you read the fight, then move to the next one */}
      <div className="flex items-center justify-between gap-6 border-t border-line px-5 py-3">
        <span className="max-w-[620px] text-[11px] leading-normal text-zinc-600">
          {t.disclaimer} <Link to="/accuracy" className="whitespace-nowrap font-medium">{t.howPerformed}</Link>
        </span>
        <FightNav index={index} total={total} onGo={onGo} size={32} />
      </div>
    </>
  )
}

// ── mobile ─────────────────────────────────────────────────────────────────────

function MobileSide({ f, open, right, big }: { f: Fighter; open: boolean; right?: boolean; big?: boolean }) {
  const { t } = useI18n()
  const i = f.name.indexOf(' ')
  const first = i < 0 ? '' : f.name.slice(0, i)
  const last = i < 0 ? f.name : f.name.slice(i + 1)
  return (
    <div className={cx('flex min-w-0 flex-1 items-center gap-2.5', right && 'flex-row-reverse')}>
      {!open && <Avatar f={f} size={big ? 52 : 44} />}
      <div className={cx('flex min-w-0 flex-1 flex-col gap-px', right && 'text-right')}>
        <div className="h-3.5 truncate text-[11px] leading-[14px] text-zinc-400">{first || ' '}</div>
        <div className={cx('truncate font-semibold text-zinc-50', big ? 'text-[17px] leading-[21px]' : 'text-sm leading-[18px]')}>{last}</div>
        <div className="whitespace-nowrap font-mono text-[11px] leading-[14px] text-zinc-500">{record(f, t)}</div>
      </div>
    </div>
  )
}

function Tabs({ fight, track, desktopRow }: { fight: Fight; track: Track; desktopRow: boolean }) {
  const { t } = useI18n()
  const [tab, setTab] = useState<'p' | 'c' | 's'>('c')
  const id = useId()
  useEffect(() => setTab('c'), [fight])
  const keys = ['c', 's', 'p'] as const
  const panel: Record<typeof tab, ReactNode> = {
    p: <PredictionBlock fight={fight} track={track} />,
    c: desktopRow ? <TapeDesktop fight={fight} /> : <TapeMobile fight={fight} />,
    s: (
      <div className="flex flex-col gap-[22px] sm:grid sm:grid-cols-2 sm:gap-8">
        {[fight.fighter_1, fight.fighter_2].map(f => (
          <div key={f.slug} className="flex flex-col gap-[18px] border-t border-zinc-900 pt-4">
            <div className="text-[15px] font-semibold text-zinc-50">{f.name}</div>
            <SidePanel f={f} />
          </div>
        ))}
      </div>
    ),
  }
  const onKey = (e: React.KeyboardEvent) => {
    const i = keys.indexOf(tab)
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = keys[(i + d + keys.length) % keys.length]
    setTab(next)
    document.getElementById(`${id}-tab-${next}`)?.focus()
  }
  return (
    <>
      <div role="tablist" className="relative flex gap-1 rounded-[10px] bg-zinc-900 p-1" onKeyDown={onKey}>
        <span aria-hidden className="tab-pill absolute bottom-1 left-1 top-1 rounded-lg bg-zinc-800"
          style={{ width: 'calc((100% - 16px) / 3)', transform: `translateX(calc(${keys.indexOf(tab)} * (100% + 4px)))` }} />
        {keys.map(k => (
          <button key={k} id={`${id}-tab-${k}`} type="button" role="tab" aria-selected={tab === k}
            aria-controls={`${id}-panel`} tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)}
            className={cx('relative h-10 flex-1 rounded-lg text-[13px] font-medium transition-colors duration-300',
              tab === k ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-200')}>
            {t.tabs[k]}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} key={tab} className="xp">
        {panel[tab]}
      </div>
    </>
  )
}

function CompactPanel({ fight, track, desktopRow, index, total, onGo }: {
  fight: Fight; track: Track; desktopRow: boolean; index: number; total: number; onGo: (i: number) => void
}) {
  const { t } = useI18n()
  const p1 = fight.p_win_f1
  return (
    <div className="flex flex-col gap-5 px-3.5 pb-[18px] pt-4 md:px-5">
      <div className="grid grid-cols-2 gap-2">
        <div><Portrait f={fight.fighter_1} fav={p1 > 0.5} w={180} /></div>
        <div className="flex justify-end"><Portrait f={fight.fighter_2} fav={p1 < 0.5} w={180} /></div>
      </div>
      <Tabs fight={fight} track={track} desktopRow={desktopRow} />
      <div className="flex justify-center border-t border-line pt-4"><FightNav index={index} total={total} onGo={onGo} size={40} /></div>
      <p className="text-xs leading-normal text-zinc-500">
        {t.disclaimerShort} <Link to="/accuracy">{t.howPerformed}</Link>
      </p>
    </div>
  )
}

// ── card ───────────────────────────────────────────────────────────────────────

export const FightCard = forwardRef<HTMLDivElement, Props>(function FightCard(
  { fight, index, total, open, track, desktopRow, desktopPanel, instantClose, onToggle, onGo, solo = false }, ref,
) {
  const { t } = useI18n()
  const panelId = useId()
  const f1 = fight.fighter_1, f2 = fight.fighter_2
  const label = fight.main_event
    ? `${fight.title_fight ? t.titleFight : t.mainEvent} · ${t.rounds(fight.num_rounds)}`
    : fight.num_rounds === 5 || fight.title_fight
      ? `${fight.title_fight ? t.titleFight : ''}${fight.title_fight ? ' · ' : ''}${t.rounds(fight.num_rounds)}`
      : null

  const center = open
    ? null
    : fight.result ? <ResultCenter fight={fight} /> : <ProbCenter fight={fight} />
  const toggle = solo ? undefined : onToggle

  return (
    <div ref={ref} id={solo ? 'main-fight' : `fight-${index + 1}`}
      className={cx('fight-card surface scroll-mt-3 overflow-hidden rounded-xl bg-card', !open && 'closed', fight.main_event && 'headliner')}
      style={{ border: `1px solid ${open || fight.main_event ? 'rgb(var(--brand) / 0.28)' : 'var(--c-line)'}`,
               boxShadow: open ? '0 0 0 1px rgb(var(--brand) / 0.06), 0 24px 60px -30px rgb(var(--brand) / 0.25)' : undefined }}>
      {label && (
        <div className="flex items-center gap-2 px-3.5 pt-3 md:px-5">
          {fight.main_event
            ? <span className="eyebrow inline-flex items-center gap-1.5 rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />{label}
              </span>
            : <span className="eyebrow text-zinc-500">{label}</span>}
        </div>
      )}

      {desktopRow ? (
        <div className={cx('grid grid-cols-[minmax(0,1fr)_240px_minmax(0,1fr)_20px] items-center gap-6 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_290px_minmax(0,1fr)_20px] lg:gap-7', !solo && 'fight-row')}
          onClick={toggle}>
          <DesktopSide f={f1} open={open} big={fight.main_event} />
          <div>{center}</div>
          <DesktopSide f={f2} open={open} right big={fight.main_event} />
          {!solo && <ToggleButton fight={fight} open={open} controls={panelId} onToggle={onToggle} />}
        </div>
      ) : (
        <div className={cx('flex min-h-11 flex-col gap-3 px-3.5 pb-3 pt-3.5', !solo && 'fight-row')} onClick={toggle}>
          <div className="flex items-center gap-2.5">
            <MobileSide f={f1} open={open} big={fight.main_event} />
            <MobileSide f={f2} open={open} right big={fight.main_event} />
          </div>
          {open ? (
            <div className="flex items-center justify-between">
              {!solo && <div className="w-5" />}
              {center}
              {!solo && <ToggleButton fight={fight} open={open} controls={panelId} onToggle={onToggle} />}
            </div>
          ) : fight.result ? (
            <div className="flex items-center gap-2.5">
              <div className="flex-1"><ResultCenter fight={fight} /></div>
              <ToggleButton fight={fight} open={open} controls={panelId} onToggle={onToggle} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Pct v={split(fight.p_win_f1)[0]} fav={split(fight.p_win_f1)[0] > 50} />
                <div className="flex-1"><ProbBar p1={fight.p_win_f1} animate delay={0.15} /></div>
                <Pct v={split(fight.p_win_f1)[1]} fav={split(fight.p_win_f1)[1] > 50} />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                <span className="flex flex-wrap items-center gap-2">
                  {t.verdict(verdict(fight.p_win_f1))}
                  {lowData(fight) && <Tag>{t.lowData}</Tag>}
                </span>
                <ToggleButton fight={fight} open={open} controls={panelId} onToggle={onToggle} />
              </div>
            </div>
          )}
        </div>
      )}

      <Collapse id={panelId} open={open} instantClose={instantClose}>
        <div className="xp border-t border-line">
          {desktopPanel
            ? <DesktopPanel fight={fight} track={track} index={index} total={total} onGo={onGo} />
            : <CompactPanel fight={fight} track={track} desktopRow={desktopRow} index={index} total={total} onGo={onGo} />}
        </div>
      </Collapse>
    </div>
  )
})
