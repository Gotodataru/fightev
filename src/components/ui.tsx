import { useState, type ReactNode } from 'react'
import { photoUrl, type Fighter } from '../data'
import { useI18n } from '../i18n'
import { BRAND, CARD, Z400, Z500, Z700, cx, initials, split } from '../lib/fight'

export function SectionLabel({ children, extra, className, end }: { children: ReactNode; extra?: ReactNode; className?: string; end?: boolean }) {
  return (
    <div className={cx('mb-3 flex flex-wrap items-center gap-x-3 gap-y-2', end ? 'justify-end' : 'justify-between', className)}>
      <span className="eyebrow text-zinc-600">{children}</span>
      {extra}
    </div>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full border border-zinc-700 px-[7px] py-px text-[11px] font-medium text-zinc-400">
      {children}
    </span>
  )
}

export function Pct({ v, fav, size = 14, className }: { v: number; fav: boolean; size?: number; className?: string }) {
  return (
    <span className={cx('tnum font-mono font-semibold', className)} style={{ fontSize: size, color: fav ? BRAND : Z500 }}>
      {v}%
    </span>
  )
}

/** Two-sided probability bar: green = the side with the higher probability, not a corner colour. */
export function ProbBar({ p1, height = 6, animate = false, delay = 0.1, other = Z700 }: {
  p1: number; height?: number; animate?: boolean; delay?: number; other?: string
}) {
  const [a, b] = split(p1)
  let c1 = a > b ? BRAND : other, c2 = b > a ? BRAND : other
  if (a === b) c1 = c2 = Z400
  return (
    <div className={cx('flex gap-0.5 overflow-hidden rounded-full', animate && 'a-grow')}
      style={{ height, animationDelay: animate ? `${delay}s` : undefined }} aria-hidden>
      <div style={{ width: `${a}%`, background: c1 }} />
      <div style={{ width: `${b}%`, background: c2 }} />
    </div>
  )
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden
      style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Avatar({ f, size = 52 }: { f: Fighter; size?: number }) {
  const [broken, setBroken] = useState(false)
  if (f.photo && !broken) {
    return (
      <div className="shrink-0 overflow-hidden rounded-[10px] bg-zinc-900" style={{ width: size, height: size }}>
        <img src={photoUrl(f.slug, true)} alt="" width={size} height={size} loading="lazy"
          className="block h-full w-full" onError={() => setBroken(true)} />
      </div>
    )
  }
  return (
    <div aria-hidden className="flex shrink-0 items-center justify-center rounded-[10px] border border-dashed border-zinc-700 bg-zinc-900 font-semibold tracking-[0.02em] text-zinc-500"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.28) }}>
      {initials(f.name)}
    </div>
  )
}

function Silhouette() {
  return (
    <svg width="96" height="120" viewBox="0 0 96 120" fill="none" aria-hidden className="max-w-[55%]">
      <circle cx="48" cy="36" r="22" fill="#27272a" />
      <path d="M6 120c0-26 19-44 42-44s42 18 42 44z" fill="#27272a" />
    </svg>
  )
}

/**
 * Face-aligned portrait (220x261 source). `w` is the max width; the box scales down
 * with its column so two portraits always fit side by side on a phone.
 */
export function Portrait({ f, fav, w = 200, fade = CARD, animate = true, eager = false }: {
  f: Fighter; fav: boolean; w?: number; fade?: string; animate?: boolean; eager?: boolean
}) {
  const { t } = useI18n()
  const [broken, setBroken] = useState(false)
  const glow = fav ? 'radial-gradient(circle at 50% 62%, rgba(0,239,92,0.16), transparent 62%)' : 'none'
  return (
    <div className={cx('relative w-full overflow-hidden', animate && 'pin')}
      style={{ maxWidth: w, aspectRatio: '220 / 261', background: glow }}>
      {f.photo && !broken ? (
        <>
          <img src={photoUrl(f.slug)} alt={f.name} loading={eager ? 'eager' : 'lazy'} width={220} height={261}
            className="block h-auto w-full" onError={() => setBroken(true)} />
          <div className="absolute inset-x-0 bottom-0" style={{ height: '35%', background: `linear-gradient(to top, ${fade}, transparent)` }} />
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2.5">
          <Silhouette />
          <span className="text-[11px] text-zinc-600">{t.noPhoto}</span>
        </div>
      )}
    </div>
  )
}
