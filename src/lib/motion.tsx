import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from './fight'

// Motion helpers. Everything here degrades to "already in place" under prefers-reduced-motion.

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// One shared observer for every reveal on the page.
const callbacks = new Map<Element, () => void>()
let observer: IntersectionObserver | null = null

function observe(el: Element, onEnter: () => void) {
  if (typeof IntersectionObserver === 'undefined') { onEnter(); return () => {} }
  observer ??= new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      callbacks.get(e.target)?.()
      observer!.unobserve(e.target)
      callbacks.delete(e.target)
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 })
  callbacks.set(el, onEnter)
  observer.observe(el)
  return () => { observer?.unobserve(el); callbacks.delete(el) }
}

/** true once the element has scrolled into view (and stays true). */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(reducedMotion)
  useEffect(() => {
    if (inView || !ref.current) return
    return observe(ref.current, () => setInView(true))
  }, [inView])
  return [ref, inView] as const
}

/**
 * Slides its content up into place when it enters the viewport. Also the trigger for
 * CSS animations inside it (.a-grow, .pop, .draw…): they stay paused until `.in` is set.
 */
export function Reveal({ children, delay = 0, className, style, as: Tag = 'div', still = false }: {
  children: ReactNode; delay?: number; className?: string; style?: CSSProperties
  as?: 'div' | 'section' | 'li' | 'article'; still?: boolean   // still: only trigger children, don't move
}) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <Tag ref={ref as never} className={cx('io', !still && 'reveal', inView && 'in', className)}
      style={{ ...style, '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}

/** Counts from 0 to `value` once `active` turns true (ease-out, ~0.9 s). */
export function useCountUp(value: number, active: boolean, duration = 900) {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : 0))
  const from = useRef(0)
  useEffect(() => {
    if (!active) return
    if (reducedMotion()) { setShown(value); return }
    const start = performance.now(), a = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = 1 - Math.pow(1 - t, 3)
      setShown(a + (value - a) * e)
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, active, duration])
  return shown
}

/** A number that counts up when it scrolls into view. */
export function CountUp({ value, format = v => String(Math.round(v)), className, style, delay = 0 }: {
  value: number; format?: (v: number) => string; className?: string; style?: CSSProperties; delay?: number
}) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [go, setGo] = useState(false)
  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setGo(true), delay)
    return () => clearTimeout(t)
  }, [inView, delay])
  const v = useCountUp(value, go)
  return <span ref={ref} className={className} style={style}>{format(v)}</span>
}

/** Words slide up out of a mask one after another (headlines). */
export function SplitWords({ text, delay = 0, step = 55 }: { text: string; delay?: number; step?: number }) {
  return (
    <>
      {text.split(' ').map((w, i, all) => (
        // the space must sit outside the inline-block mask, or it collapses at the block's edge
        <Fragment key={i}>
          <span className="word-mask">
            <span className="word" style={{ '--d': `${delay + i * step}ms` } as CSSProperties}>{w}</span>
          </span>
          {i < all.length - 1 && ' '}
        </Fragment>
      ))}
    </>
  )
}

/**
 * Height-animated disclosure. Content mounts on open and unmounts after the close
 * transition (or immediately when `instantClose`, e.g. when another fight takes over).
 */
export function Collapse({ open, instantClose = false, children, id }: {
  open: boolean; instantClose?: boolean; children: ReactNode; id?: string
}) {
  // phase is derived during render (not in an effect) so an instant close lands in the same
  // commit as the next fight opening — the scroll position is measured on the final layout
  const [phase, setPhase] = useState<'open' | 'closing' | 'closed'>(open ? 'open' : 'closed')
  const [expanded, setExpanded] = useState(open)
  if (open && phase !== 'open') setPhase('open')
  if (!open && phase === 'open') setPhase(instantClose || reducedMotion() ? 'closed' : 'closing')

  useEffect(() => {
    if (phase === 'open') {
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)))
      return () => cancelAnimationFrame(r)
    }
    setExpanded(false)
    if (phase === 'closing') {
      const t = setTimeout(() => setPhase('closed'), 420)
      return () => clearTimeout(t)
    }
  }, [phase])

  return (
    <div id={id} className={cx('disclosure', expanded && phase === 'open' && 'open')}>
      <div className="disclosure-inner">{phase !== 'closed' && children}</div>
    </div>
  )
}

/** A thin bar across the top showing how far down the page the reader is. */
export function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (reducedMotion()) return
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      ref.current?.style.setProperty('--p', String(p))
    }
    const onScroll = () => { frame ||= requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return <div ref={ref} className="read-bar" aria-hidden />
}
