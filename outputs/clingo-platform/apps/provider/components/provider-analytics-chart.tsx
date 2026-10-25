"use client";

import { useEffect, useRef, useState } from "react";
import { money, numberLabel, type AnalyticsMetric, type analyzeJobs } from "../lib/provider-analytics";
type Point = NonNullable<ReturnType<typeof analyzeJobs>>["series"][number];
const label = (metric: AnalyticsMetric, value: number) => metric === "value" ? money(value) : metric === "hours" ? `${numberLabel(value)} h` : numberLabel(value);
const shortDate = (date: string) => `${Number(date.slice(8))}.${date.slice(5, 7)}`;
function curve(points: number[][]) {
  return points.map(([x, y], index) => index === 0 ? `M ${x},${y}` : `C ${(points[index - 1][0] + x) / 2},${points[index - 1][1]} ${(points[index - 1][0] + x) / 2},${y} ${x},${y}`).join(" ");
}
export function ProviderAnalyticsChart({ series, metric, comparison, onSelect }: { series: Point[]; metric: AnalyticsMetric; comparison: boolean; onSelect: (point: Point) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1), [hover, setHover] = useState<number | null>(null);
  useEffect(() => { const el = ref.current; if (!el) return; const resize = () => setScale(el.clientWidth / 1012); const observer = new ResizeObserver(resize); observer.observe(el); resize(); return () => observer.disconnect(); }, []);
  const rawMax = Math.max(...series.flatMap(point => [point.current[metric], comparison ? point.previous[metric] : 0])) || (metric === "value" ? 10000 : 10);
  const step = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const max = Math.ceil(rawMax / step) * step;
  const x = (index: number) => 67 + index / Math.max(1, series.length - 1) * 909;
  const y = (value: number) => 164 - value / max * 136;
  const current = series.map((point, index) => [x(index), y(point.current[metric])]);
  const previous = series.map((point, index) => [x(index), y(point.previous[metric])]);
  const path = curve(current);
  const active = hover ?? series.length - 1;
  return <div className="analytics-chart-scroller"><div className="results-chart live-results-chart" ref={ref}>
    <div className="analytics-chart-grid" style={{ transform: `scaleX(${scale})` }}><img src="/figma-assets/analytics/dashboard/chart-grid.svg" alt="" /></div>
    <svg viewBox="0 0 1012 202" preserveAspectRatio="none" aria-label="Wyniki w czasie według wybranej miary" role="group">
      <path d={`${path} L ${x(series.length - 1)},164 L 67,164 Z`} fill="#0079de" fillOpacity=".18" />
      {comparison && <path d={curve(previous)} fill="none" stroke="#a5b4c0" strokeWidth="2" strokeDasharray="6 6" />}
      <path d={path} fill="none" stroke="#0080ed" strokeWidth="3" />
      {[1, 2 / 3, 1 / 3, 0].map((fraction, index) => <text key={index} x="4" y={32 + index * 46} fill="#7c8691" fontSize="12">{metric === "value" ? `${numberLabel(max * fraction / 100)} zł` : `${numberLabel(max * fraction)}${metric === "hours" ? " h" : ""}`}</text>)}
      {[0, Math.floor((series.length - 1) / 3), Math.floor(2 * (series.length - 1) / 3), series.length - 1].filter((value, index, all) => all.indexOf(value) === index).map((index, position) => <text key={index} x={x(index)} y="195" textAnchor={position === 0 ? "start" : index === series.length - 1 ? "end" : "middle"} fill="#7c8691" fontSize="12">{shortDate(series[index].start)}–{shortDate(series[index].end)}</text>)}
      {current[active] && <circle cx={current[active][0]} cy={current[active][1]} r="6" fill="white" stroke="#0080ed" strokeWidth="2.5" />}
      {series.map((point, index) => <rect key={point.start} x={Math.max(50, x(index) - 909 / series.length / 2)} y="18" width={909 / series.length} height="150" fill="transparent" tabIndex={0} role="button" aria-label={`${point.start} do ${point.end}: ${label(metric, point.current[metric])}${comparison ? `; poprzedni okres ${label(metric, point.previous[metric])}` : ""}`} onPointerEnter={() => setHover(index)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} onClick={() => onSelect(point)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(point); } }}><title>{point.start} – {point.end}: {label(metric, point.current[metric])}</title></rect>)}
    </svg>
    {hover !== null && <div className="analytics-chart-tooltip" role="status">{shortDate(series[hover].start)}–{shortDate(series[hover].end)}: <strong>{label(metric, series[hover].current[metric])}</strong>{comparison && <span>Poprzedni okres: {label(metric, series[hover].previous[metric])}</span>}</div>}
  </div></div>;
}
