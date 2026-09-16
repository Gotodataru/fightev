import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Message } from '../components/ui'
import { useI18n } from '../i18n'

/** A wrong address says so. It used to redirect to the home page without a word, which
 *  looks exactly like a link that works but lands somewhere unexpected. */
export default function NotFound() {
  const { t } = useI18n()
  useEffect(() => { document.title = `fightev — ${t.notFoundTitle}` }, [t])
  return (
    <Message title={t.notFoundTitle} text={t.notFoundText}>
      <Link to="/" className="btn btn-brand mt-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-onbrand no-underline hover:bg-brand-hover">{t.notFoundCta}</Link>
    </Message>
  )
}
