import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { YieldCurvePoint } from '@jbond/shared-types';
import { Skeleton } from '@jbond/ui';
import { dataService } from '../data/service.js';
import { useAppStore } from '../store/appStore.js';
import { AS_OF, CURVE_DEFS } from '../data/mock.js';
import { YieldCurveChart, type CurveSeries } from '../components/YieldCurveChart.js';

const COMPARE_OPTIONS: { label: string; days: number }[] = [
  { label: '1주 전', days: 7 },
  { label: '1개월 전', days: 30 },
  { label: '3개월 전', days: 90 },
  { label: '6개월 전', days: 180 },
  { label: '1년 전', days: 365 },
];

type Mode = 'current' | 'compare' | 'change' | 'spread' | 'trajectory';
const MODES: { key: Mode; label: string }[] = [
  { key: 'current', label: '현재' },
  { key: 'compare', label: '두 날짜 비교' },
  { key: 'change', label: '변동폭(bp)' },
  { key: 'spread', label: '국채 대비' },
  { key: 'trajectory', label: '궤적' },
];

function shift(iso: string, days: number): string {
  return new Date(Date.parse(iso) - days * 86_400_000).toISOString().slice(0, 10);
}

export function CurveScreen() {
  const navigate = useNavigate();
  const { context, pushContext } = useAppStore();
  const initialCurve =
    context.bondType && context.bondType in CURVE_DEFS ? context.bondType : 'GOVERNMENT';
  const [curveId, setCurveId] = useState(initialCurve);
  const [compareIdx, setCompareIdx] = useState(1);
  const [mode, setMode] = useState<Mode>('current');

  const [current, setCurrent] = useState<YieldCurvePoint[] | null>(null);
  const [compare, setCompare] = useState<YieldCurvePoint[] | null>(null);
  const [govt, setGovt] = useState<YieldCurvePoint[] | null>(null);

  const compareDate = shift(AS_OF, COMPARE_OPTIONS[compareIdx].days);

  useEffect(() => {
    let alive = true;
    setCurrent(null);
    Promise.all([
      dataService.getCurve(curveId, AS_OF),
      dataService.getCurve(curveId, compareDate),
      dataService.getCurve('GOVERNMENT', AS_OF),
    ]).then(([c, p, g]) => {
      if (!alive) return;
      setCurrent(c);
      setCompare(p);
      setGovt(g);
    });
    return () => {
      alive = false;
    };
  }, [curveId, compareDate]);

  const series: CurveSeries[] = useMemo(() => {
    if (!current) return [];
    if (mode === 'current') {
      return [{ name: '현재', color: '#C9A227', points: current }];
    }
    if (mode === 'compare' && compare) {
      return [
        { name: '현재', color: '#C9A227', points: current },
        { name: COMPARE_OPTIONS[compareIdx].label, color: '#64748b', dashed: true, points: compare },
      ];
    }
    if (mode === 'change' && compare) {
      const diff = current.map((p, i) => ({
        ...p,
        yield:
          p.yield != null && compare[i]?.yield != null
            ? Number(((p.yield - (compare[i].yield as number)) * 100).toFixed(1))
            : null,
      }));
      return [{ name: `변동폭 bp`, color: '#dc2626', points: diff }];
    }
    if (mode === 'spread' && govt) {
      const spread = current.map((p, i) => ({
        ...p,
        yield:
          p.yield != null && govt[i]?.yield != null
            ? Number(((p.yield - (govt[i].yield as number)) * 100).toFixed(1))
            : null,
      }));
      return [{ name: '국채 대비 스프레드 bp', color: '#2563eb', points: spread }];
    }
    if (mode === 'trajectory' && compare) {
      // 여러 시점 궤적 근사 (현재 + 3개 과거 시점)
      return [
        { name: '현재', color: '#C9A227', points: current },
        { name: '3M전', color: '#94a3b8', dashed: true, points: compare },
      ];
    }
    return [{ name: '현재', color: '#C9A227', points: current }];
  }, [current, compare, govt, mode, compareIdx]);

  const yName =
    mode === 'change' || mode === 'spread' ? 'bp' : '수익률(%)';

  const pickTenor = (tenorLabel: string) => {
    pushContext({ sourceScreen: 'CURVE', bondType: curveId });
    navigate(`/mtm?tenor=${tenorLabel}`);
  };

  return (
    <div className="flex flex-col gap-3" data-testid="curve-screen">
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
        <label className="text-[11px] text-gray-500">채권종류 · 등급</label>
        <select
          value={curveId}
          onChange={(e) => setCurveId(e.target.value)}
          className="mt-1 min-h-[40px] w-full rounded-lg bg-gray-50 px-2 text-sm"
          aria-label="곡선 선택"
        >
          {Object.entries(CURVE_DEFS).map(([id, def]) => (
            <option key={id} value={id}>
              {def.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`min-h-[36px] whitespace-nowrap rounded-lg px-3 text-[12px] ${
              mode === m.key ? 'bg-[#0b1020] text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {(mode === 'compare' || mode === 'change' || mode === 'trajectory') && (
        <div className="flex gap-1 overflow-x-auto">
          {COMPARE_OPTIONS.map((o, i) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setCompareIdx(i)}
              className={`min-h-[32px] whitespace-nowrap rounded-full px-3 text-[11px] ${
                compareIdx === i ? 'bg-bondgold text-[#0b1020]' : 'bg-white text-gray-500 ring-1 ring-gray-200'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
        <div className="w-full">
          {current == null ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <YieldCurveChart series={series} yName={yName} onPickTenor={pickTenor} />
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 px-2 text-[10px] text-gray-400">
          <span>● 관측</span>
          <span>○ 보간</span>
          <span>— 데이터 없음</span>
          <span className="ml-auto">기준 {AS_OF} · 비교 {compareDate}</span>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-400">
        만기점을 탭하면 시가평가표로 이동합니다.
      </p>
    </div>
  );
}
