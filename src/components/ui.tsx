import { useState, type ReactNode } from 'react'
import { PHOTOS_PUBLISHED, photoUrl, type Fighter } from '../data'
import { useI18n } from '../i18n'
import { BRAND, CARD, FILL, FILL_DIM, Z500, Z600, cx, initials, lastName, split, verdict } from '../lib/fight'
import { CountUp } from '../lib/motion'

/**
 * The label above a block of the panel. It is a heading: an open fight had none at all,
 * so a screen reader met a dozen blocks of content with nothing to navigate between.
 *
 * `whose` names the fighter a column belongs to. Three of these labels appear twice in
 * an open fight — once per fighter — and in a list of headings "How they win" twice over
 * says nothing; the name is carried for the screen reader only, since on screen the
 * column already stands under that fighter's nameplate.
 */
export function SectionLabel({ children, extra, className, end, whose }: {
  children: ReactNode; extra?: ReactNode; className?: string; end?: boolean; whose?: string
}) {
  return (
    <div className={cx('mb-3 flex flex-wrap items-center gap-x-3 gap-y-2', end ? 'justify-end' : 'justify-between', className)}>
      <h3 className="eyebrow m-0 text-zinc-500">
        {children}{whose && <span className="sr-only"> — {whose}</span>}
      </h3>
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

/** Percentage that counts up from 0 when it scrolls into view. */
export function Pct({ v, fav, size = 14, className, delay = 0 }: { v: number; fav: boolean; size?: number; className?: string; delay?: number }) {
  return (
    <CountUp value={v} delay={delay} format={x => `${Math.round(x)}%`}
      className={cx('tnum font-mono font-semibold transition-colors duration-500', className)}
      style={{ fontSize: size, color: fav ? BRAND : Z500 }} />
  )
}

/**
 * Two-sided probability bar. Green marks the higher probability, never a corner —
 * and an even fight gets no green at all, so the bar agrees with the verdict line.
 */
export function ProbBar({ p1, height = 6, animate = false, delay = 0.1, other = FILL_DIM }: {
  p1: number; height?: number; animate?: boolean; delay?: number; other?: string
}) {
  const [a, b] = split(p1)
  const even = verdict(p1) === 'even'
  const c1 = even ? FILL : a > b ? BRAND : other
  const c2 = even ? FILL : b > a ? BRAND : other
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
  const src = photoUrl(f.slug, true)
  if (f.photo && src && !broken) {
    return (
      <div className="avatar shrink-0 overflow-hidden rounded-[10px] bg-zinc-900" style={{ width: size, height: size }}>
        <img src={src} alt="" width={size} height={size} loading="lazy"
          className="block h-full w-full" onError={() => setBroken(true)} />
      </div>
    )
  }
  return (
    <div aria-hidden className="avatar flex shrink-0 items-center justify-center rounded-[10px] border border-dashed border-zinc-700 bg-zinc-900 font-semibold tracking-[0.02em] text-zinc-500"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.28) }}>
      {initials(f.name)}
    </div>
  )
}

/**
 * Face-aligned portrait (220x261 source). `w` is the max width; the box scales down
 * with its column so two portraits always fit side by side on a phone.
 */
export function Portrait({ f, fav, w = 200, fade = CARD, animate = true, eager = false, align }: {
  /** true / false for the favourite and the other side; null when the fight is even */
  f: Fighter; fav: boolean | null; w?: number; fade?: string; animate?: boolean; eager?: boolean; align?: 'start' | 'end'
}) {
  const { t } = useI18n()
  const [broken, setBroken] = useState(false)
  const src = photoUrl(f.slug)
  const hasPhoto = f.photo && src && !broken
  // a radial brand wash behind a cut-out figure reads as rim light; behind type it is
  // just a smudge, so the nameplate does without it
  const glow = fav && hasPhoto
    ? 'radial-gradient(circle at 50% 62%, rgb(var(--brand) / var(--glow-b)), transparent 62%)' : 'none'
  return (
    <div className={cx('relative w-full overflow-hidden', animate && 'pin', !hasPhoto && 'nameplate')}
      style={{ maxWidth: w, aspectRatio: hasPhoto ? '220 / 261' : undefined, background: glow }}>
      {hasPhoto ? (
        <>
          <img src={src} alt={f.name} loading={eager ? 'eager' : 'lazy'} width={220} height={261}
            className="block h-auto w-full" onError={() => setBroken(true)} />
          <div className="absolute inset-x-0 bottom-0" style={{ height: '35%', background: `linear-gradient(to top, ${fade}, transparent)` }} />
        </>
      ) : (
        <NamePlate f={f} fav={fav} noPhoto={PHOTOS_PUBLISHED ? t.noPhoto : null} align={align} />
      )}
    </div>
  )
}


/**
 * With the photographs unpublished, the block still has to hold the top of the column.
 * A grey silhouette read as an interface that failed to load; a name set the way a
 * fight poster sets one reads as a decision. The favourite is carried by the weight of
 * the surname, never by the brand colour — green already means "won this comparison".
 */
function NamePlate({ f, fav, noPhoto, align }: {
  f: Fighter; fav: boolean | null; noPhoto: string | null; align?: 'start' | 'end'
}) {
  const words = lastName(f.name).toUpperCase().split(' ').filter(Boolean)
  const longest = Math.max(...words.map(x => x.length), 1)
  const first = f.name.split(' ')[0].toUpperCase()
  // an even fight sets both surnames alike: the plate may not name a favourite the
  // verdict line refuses to name
  const ink = fav === false ? 'var(--c-z500)' : 'var(--c-z300)'
  const end = align === 'end'
  // Set the line to the column's measure, but never stretch the glyphs to get there: a
  // three-letter surname (IGE) drawn to full measure turns into a bloated logotype. From
  // six letters up the natural width is already within ~6% of the measure, so fitting it
  // is invisible; below that the line sits at the cap and simply runs short.
  const FS = Math.min(26, 100 / (longest * 0.66))
  const fit = longest >= 6
  const lineH = FS * 0.94
  return (
    <div className="flex h-full flex-col justify-end overflow-hidden pb-3.5">
      <span aria-hidden className={cx('mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600', end && 'text-right')}>{first}</span>
      <svg viewBox={`0 0 100 ${(lineH * words.length).toFixed(2)}`} className="block w-full" role="img" aria-label={f.name}>
        {words.map((x, i) => (
          <text key={x} x={end ? 100 : 0} y={lineH * (i + 1) - lineH * 0.16} textAnchor={end ? 'end' : 'start'}
            textLength={fit ? 100 : undefined} lengthAdjust="spacingAndGlyphs" fill={ink}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: FS, letterSpacing: '-0.03em' }}>{x}</text>
        ))}
      </svg>
      {/* the rule is the block's baseline and nothing more. While it also marked the
          favourite it carried meaning at 1.9:1 dark / 1.4:1 light, under the 3:1 WCAG
          1.4.11 asks of a meaningful mark; the surname does that job at 13.5:1 / 5.4:1 */}
      <span aria-hidden className={cx('mt-3 h-px w-9', end && 'self-end')} style={{ background: 'var(--c-z700)' }} />
      {/* only true in a build that ships photographs: there the source really has none */}
      {noPhoto && <span className={cx('mt-2 text-[11px] text-zinc-600', end && 'text-right')}>{noPhoto}</span>}
    </div>
  )
}

/** A whole-page message: an error, an empty state, a wrong address. */
export function Message({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1024px] px-4 pb-20 pt-9 md:px-6">
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
