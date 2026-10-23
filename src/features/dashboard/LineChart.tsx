import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../admin/format'
import styles from './LineChart.module.css'

export type Series = { name: string; color: string; values: number[] }

export type LineChartProps = {
  dates: Date[]
  series: [Series, Series]
  label: string
}

const HEIGHT = 260
const M = { t: 10, r: 78, b: 28, l: 36 }

export default function LineChart({ dates, series, label }: LineChartProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [cur, setCur] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setWidth(Math.max(el.clientWidth, 280))
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const [a, b] = series
  const n = dates.length
  const max = Math.max(...a.values, ...b.values)
  const step = max > 150 ? 50 : max > 60 ? 25 : max > 30 ? 10 : 5
  const top = Math.ceil(max / step) * step
  const x = (i: number) => M.l + (i / (n - 1)) * (width - M.l - M.r)
  const y = (v: number) => M.t + (1 - v / top) * (HEIGHT - M.t - M.b)
  const path = (values: number[]) =>
    values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  const xIdx = [0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1]
  const day = (d: Date) => formatDate(d, lang, { day: 'numeric', month: 'short' })

  let ly1 = y(a.values[n - 1])
  let ly2 = y(b.values[n - 1])
  if (Math.abs(ly1 - ly2) < 16) {
    const mid = (ly1 + ly2) / 2
    ly1 = mid - 8
    ly2 = mid + 8
  }

  const clamp = (i: number) => Math.max(0, Math.min(n - 1, i))

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * width
    setCur(clamp(Math.round(((px - M.l) / (width - M.l - M.r)) * (n - 1))))
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const at = cur ?? n - 1
    const next =
      event.key === 'ArrowLeft'
        ? at - 1
        : event.key === 'ArrowRight'
          ? at + 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? n - 1
              : null
    if (next === null) return
    event.preventDefault()
    setCur(clamp(next))
  }

  const tipLeft = cur === null ? 0 : x(cur)
  const flip = cur !== null && tipLeft + 12 + 160 > width

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        height={HEIGHT}
        role="img"
        tabIndex={0}
        aria-label={label}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setCur(null)}
        onBlur={() => setCur(null)}
        onFocus={() => setCur((c) => c ?? n - 1)}
        onKeyDown={onKeyDown}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={M.l}
              x2={width - M.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--grid-line)"
              strokeWidth={1}
            />
            <text x={M.l - 8} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <line x1={M.l} x2={width - M.r} y1={y(0)} y2={y(0)} stroke="var(--axis)" strokeWidth={1} />
        {xIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
          >
            {day(dates[i])}
          </text>
        ))}
        {series.map((s) => (
          <path
            key={s.name}
            d={path(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        <text className={styles.dlabel} x={width - M.r + 8} y={ly1 + 4}>
          {a.name}
        </text>
        <text className={styles.dlabel} x={width - M.r + 8} y={ly2 + 4}>
          {b.name}
        </text>
        {cur !== null && (
          <g>
            <line
              x1={x(cur)}
              x2={x(cur)}
              y1={M.t}
              y2={HEIGHT - M.b}
              stroke="var(--text-3)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {series.map((s) => (
              <circle
                key={s.name}
                cx={x(cur)}
                cy={y(s.values[cur])}
                r={4.5}
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
          </g>
        )}
      </svg>
      {cur !== null && (
        <div
          className={styles.tooltip}
          style={{ left: flip ? Math.max(tipLeft - 172, 0) : tipLeft + 12, top: 8 }}
        >
          <div className={styles.head}>
            {formatDate(dates[cur], lang, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {series.map((s) => (
            <div key={s.name} className={styles.row}>
              <i style={{ background: s.color }} />
              <b>{s.values[cur]}</b>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
