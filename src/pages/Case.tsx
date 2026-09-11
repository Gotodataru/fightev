import { useEffect, type ReactNode } from 'react'
import { useData } from '../data'
import { useI18n } from '../i18n'

/** Placeholder the author fills in later — rendered visibly so it can't ship by accident unnoticed. */
function Ph({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap rounded-md border border-dashed border-brand/50 px-[7px] py-px text-brand">[{children}]</span>
}

function Stat({ value, label, sub }: { value: ReactNode; label: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-4xl font-bold leading-none tracking-[-0.02em] text-zinc-50">{value}</span>
      <span className="text-[13px] text-zinc-300">{label}</span>
      <span className="text-xs leading-normal text-zinc-500">{sub}</span>
    </div>
  )
}

function Para({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-zinc-800 py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 md:py-7">
      <h2 className="m-0 text-[13px] font-semibold text-zinc-300">{title}</h2>
      <div className="text-[15px] leading-[1.7] text-zinc-400">{children}</div>
    </div>
  )
}

function Decision({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-[22px]">
      <span className="font-mono text-xs text-brand">{String(n).padStart(2, '0')}</span>
      <h3 className="m-0 text-base font-semibold text-zinc-50">{title}</h3>
      <p className="m-0 text-[13px] leading-relaxed text-zinc-400">{children}</p>
    </div>
  )
}

export default function Case() {
  const { lang } = useI18n()
  const data = useData()
  const ru = lang === 'ru'
  useEffect(() => { document.title = ru ? 'fightev — О проекте' : 'fightev — About' }, [ru])

  const card = data.status === 'ok' ? data.data.card : null
  const track = data.status === 'ok' ? data.data.track : null
  const fighters = card ? card.fights.flatMap(f => [f.fighter_1, f.fighter_2]) : []
  const nFights = card?.fights.length ?? 0
  const noStats = fighters.filter(f => !f.stats).length
  const noPhoto = fighters.filter(f => !f.photo).length
  const withPhoto = fighters.length - noPhoto
  const n = track?.n_fights ?? 0
  const rate = track && n ? Math.round(track.model.rate * 100) : null
  const dash = '—'
  const trails = !!track && n > 0 && track.model.rate < track.favourite.rate

  return (
    <article className="mx-auto max-w-[880px] px-4 pb-[90px] pt-10 md:px-6 md:pt-14">
      <div className="eyebrow mb-3.5 text-brand">{ru ? 'О проекте · кейс' : 'About · case study'}</div>
      <h1 className="m-0 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] md:text-[44px]">
        {ru ? 'Как показать прогноз, которому не стоит верить вслепую' : "How to show a forecast you shouldn't trust blindly"}
      </h1>
      <p className="mb-0 mt-[18px] text-base leading-[1.65] text-zinc-400">
        {ru
          ? 'fightev — аналитика боёв UFC на реальных данных: кард ближайшего турнира, статистика бойцов и прогноз ML-модели с честной историей точности.'
          : 'fightev is UFC fight analytics on real data: the next event’s card, fighter stats and an ML forecast with an honest accuracy record.'}
      </p>
      <div className="mt-[22px] flex flex-wrap gap-x-7 gap-y-2.5 text-[13px] text-zinc-500">
        <span>{ru ? 'Роль' : 'Role'}: <Ph>{ru ? 'твоя роль' : 'your role'}</Ph></span>
        <span>{ru ? 'Сроки' : 'Timeline'}: <Ph>{ru ? 'сроки' : 'timeline'}</Ph></span>
        <span>{ru ? 'Стек' : 'Stack'}: React, Tailwind, Python, SQLite</span>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-4">
        <Stat value={nFights || dash} label={ru ? 'боёв в карде' : 'fights on the card'} sub={ru ? 'с данными из базы UFCStats' : 'with data from the UFCStats base'} />
        <Stat value={n || dash} label={ru ? 'прогнозов сверено' : 'forecasts checked'} sub={ru ? 'с результатами, до боя' : 'against results, recorded pre-fight'} />
        <Stat value={withPhoto || dash} label={ru ? 'фото выровнены' : 'photos aligned'} sub={ru ? 'по лицу автоматически' : 'to the face, automatically'} />
        <Stat value="7" label={ru ? 'состояний' : 'states'} sub={ru ? 'от «нет фото» до промаха модели' : 'from “no photo” to a model miss'} />
      </div>

      <div className="mt-11 flex h-[220px] items-center justify-center rounded-xl border border-dashed border-zinc-700 text-[13px] text-zinc-500 md:h-[300px]">
        <Ph>{ru ? 'скриншот: было → стало' : 'screenshot: before → after'}</Ph>
      </div>

      <div className="mt-11">
        <Para title={ru ? 'Задача' : 'Problem'}>
          {ru
            ? 'Сайт был витриной платной подписки: статистика ставок и ссылки в Telegram. Проект стал бесплатным, и задача изменилась: болельщик за несколько секунд видит кард турнира, раскрывает любой бой и понимает, насколько можно доверять прогнозу.'
            : 'The site used to be a storefront for a paid subscription: betting stats and Telegram links. The project became free, and the job changed: a fan sees the event card in seconds, opens any fight and understands how far the forecast can be trusted.'}
        </Para>
        <Para title={ru ? 'Для кого' : 'Audience'}>
          {ru ? 'Болельщик UFC, который перед турниром хочет быстро понять расклад. Это гипотеза — ' : 'A UFC fan who wants a quick read on the card before an event. This is a hypothesis — '}
          <Ph>{ru ? 'подтвердить интервью или тестом' : 'validate with interviews or a test'}</Ph>.
        </Para>
        <Para title={ru ? 'Ограничения' : 'Constraints'}>
          {ru
            ? <>Данные неполные: в текущем карде у {noStats} из {fighters.length} бойцов нет подробной статистики, у {noPhoto} — фото. Модель угадывает {rate ?? dash}% победителей{trails ? ' и уступает фаворитам по линии' : ''}. Интерфейс должен работать с этим, а не прятать.</>
            : <>The data is incomplete: on the current card {noStats} of {fighters.length} fighters have no detailed stats and {noPhoto} have no photo. The model picks {rate ?? dash}% of winners{trails ? ' and trails the betting favourites' : ''}. The interface has to work with that, not hide it.</>}
        </Para>
      </div>

      <section className="mt-5">
        <h2 className="m-0 mb-[22px] text-[22px] font-bold tracking-[-0.015em] text-zinc-50">{ru ? 'Ключевые решения' : 'Key decisions'}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Decision n={1} title={ru ? 'Зелёный — это преимущество' : 'Green means the edge'}>
            {ru
              ? 'Цвет не привязан к стороне боя. Подсвечен тот, у кого выше вероятность или лучше показатель; второй канал — яркость, поэтому экран читается и при дальтонизме.'
              : 'Colour isn’t tied to a corner. Whoever has the higher probability or the better number is highlighted; brightness is a second channel, so the screen still reads with colour blindness.'}
          </Decision>
          <Decision n={2} title={ru ? 'Клик вместо наведения' : 'Click, not hover'}>
            {ru
              ? 'На телефоне наведения нет, а на десктопе блок раскрывался бы случайно. Открыт один бой, внутри — переключатель «Бой 6 из 12».'
              : 'Phones have no hover, and on desktop the panel would pop open by accident. One fight is open at a time, with a “Fight 6 of 12” switcher inside.'}
          </Decision>
          <Decision n={3} title={ru ? 'Неопределённость словами' : 'Uncertainty in words'}>
            {ru
              ? '51 на 49 подписано «Равный бой», а не «победит X». Новичкам с 1–2 боями — метка «мало данных».'
              : '51 to 49 is labelled “Even fight”, not “X wins”. Newcomers with 1–2 bouts get a “limited data” tag.'}
          </Decision>
          <Decision n={4} title={ru ? 'Точность — отдельной страницей' : 'Accuracy gets its own page'}>
            {ru
              ? 'Калибровка, интервалы и промахи на виду. Модель досрочки проиграла простому правилу — и её убрали из карточек.'
              : 'Calibration, intervals and misses are in plain sight. The finish model lost to a simple rule — so it was taken off the cards.'}
          </Decision>
          <Decision n={5} title={ru ? 'Без ставок' : 'No betting'}>
            {ru
              ? 'Коэффициенты остались только ориентиром на странице точности. В карточках — модель и статистика.'
              : 'Odds remain only as a benchmark on the accuracy page. The cards show the model and the stats.'}
          </Decision>
          <Decision n={6} title={ru ? 'Фото выровнены по лицу' : 'Photos aligned to the face'}>
            {ru
              ? 'Снимки кадрированы по-разному. Скрипт находит глаза и макушку: масштаб задаёт расстояние между глазами, а макушка у всех на одной линии — головы одного размера и не обрезаны.'
              : 'Source shots are framed differently. A script finds the eyes and the crown: eye distance sets the scale and every crown sits on one line, so heads come out the same size and never cropped.'}
          </Decision>
        </div>
      </section>

      <div className="mt-11">
        <Para title={ru ? 'Что дальше' : 'Next'}>
          {ru ? 'Юзабилити-тест с 5 болельщиками ' : 'A usability test with 5 fans '}
          <Ph>{ru ? 'результаты' : 'results'}</Ph>
          {ru
            ? '. Калибровка модели, чтобы уверенные проценты значили то, что обещают. Уведомление о начале турнира.'
            : '. Calibrating the model so confident percentages mean what they promise. A reminder when the event starts.'}
        </Para>
      </div>
    </article>
  )
}
