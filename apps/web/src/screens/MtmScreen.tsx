import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { MtmRate, TenorLabel } from '@jbond/shared-types';
import { Skeleton, formatYield, formatBp } from '@jbond/ui';
import { dataService } from '../data/service.js';
import { useAppStore } from '../store/appStore.js';
import { AS_OF, MTM_ROWS, MTM_TENORS } from '../data/mock.js';

export function MtmScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const highlightTenor = params.get('tenor') as TenorLabel | null;
  const { pushContext } = useAppStore();

  const [rates, setRates] = useState<MtmRate[] | null>(null);
  const [showBp, setShowBp] = useState(false);
  // 한 화면(압축) 보기 여부. 압축 시 셀이 작아지므로 플로팅 돋보기로 수치를 확인한다.
  const [fit, setFit] = useState(false);
  const [mag, setMag] = useState<{ sub: string; big: string; note: string; x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    setRates(null);
    dataService.getMtmMatrix(AS_OF).then((r) => alive && setRates(r));
    return () => {
      alive = false;
    };
  }, []);

  const lookup = useMemo(() => {
    const m = new Map<string, MtmRate>();
    (rates ?? []).forEach((r) => m.set(`${r.rowKey}:${r.tenorLabel}`, r));
    return m;
  }, [rates]);

  if (rates == null) {
    return <Skeleton className="h-[420px] w-full" />;
  }

  // 종류(등급) 선택 → 해당 등급 수익률곡선
  const goRowCurve = (row: (typeof MTM_ROWS)[number]) => {
    pushContext({ sourceScreen: 'MTM', bondType: row.curveId });
    navigate('/curve');
  };

  // 셀(등급×만기) 선택 → 투자 시뮬레이션 (해당 채권·만기·수익률을 파라미터로 전달)
  const goSimCell = (row: (typeof MTM_ROWS)[number], rate: MtmRate | undefined, tenor: TenorLabel) => {
    pushContext({
      sourceScreen: 'MTM',
      valuationDate: AS_OF,
      bondType: row.curveId,
      selectedTenor: tenor,
      ...(rate?.yield != null
        ? { selectedYield: rate.yield, yieldSource: 'CURVE' as const }
        : {}),
    });
    navigate('/simulation');
  };

  // 플로팅 돋보기: 포인터(마우스 hover / 터치 드래그)가 지나는 셀의 수치를 크게 표시
  const showMag = (
    e: { clientX: number; clientY: number },
    row: (typeof MTM_ROWS)[number],
    rate: MtmRate | undefined,
    tenor: TenorLabel,
  ) => {
    setMag({
      sub: `${row.label} · ${tenor}`,
      big: rate?.yield != null ? formatYield(rate.yield) : '—',
      note: rate?.changeBp != null ? `전일대비 ${formatBp(rate.changeBp)}` : '전일대비 —',
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="flex flex-col gap-3" data-testid="mtm-screen">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900">시가평가표</h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setFit((v) => !v)}
            className={`min-h-[36px] rounded-lg px-3 text-[12px] ring-1 ${
              fit ? 'bg-[#0b1020] text-white ring-[#0b1020]' : 'bg-white text-gray-700 ring-gray-200'
            }`}
            title="한 화면에 맞춰 압축 (돋보기로 수치 확인)"
          >
            {fit ? '스크롤 보기' : '한 화면'}
          </button>
          <button
            type="button"
            onClick={() => setShowBp((v) => !v)}
            className="min-h-[36px] rounded-lg bg-white px-3 text-[12px] text-gray-700 ring-1 ring-gray-200"
          >
            {showBp ? '수익률 보기' : '전일대비 보기'}
          </button>
        </div>
      </div>

      {/* 시가평가표 — 기준일 상단 고정, 종류 열 sticky(베이지). 기본=가독성 스크롤, '한 화면'=압축 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        {/* 기준일 바 (스크롤 영향 없이 항상 상단 고정) */}
        <div
          className="flex items-center justify-between bg-[#F5EFDD] px-3 py-2"
          data-testid="mtm-asof"
        >
          <span className="text-[12px] font-bold text-gray-800">기준일 {AS_OF}</span>
          <span className="text-[10px] text-gray-500">
            금융투자협회 채권정보센터(kofiabond.or.kr) 원용
          </span>
        </div>

        <div
          className={`relative ${fit ? 'overflow-hidden' : 'max-h-[75vh] overflow-auto'}`}
          data-testid="mtm-grid"
          onPointerLeave={() => setMag(null)}
          onScroll={() => setMag(null)}
        >
          <table
            className={
              fit
                ? 'w-full table-fixed border-collapse text-[10px] tabular-nums'
                : 'border-collapse text-[12px] tabular-nums'
            }
          >
            {fit && (
              <colgroup>
                <col className="w-[4.75rem]" />
                {MTM_TENORS.map((t) => (
                  <col key={t} />
                ))}
              </colgroup>
            )}
            <thead>
              <tr>
                <th
                  className={`mtm-corner bg-[#F5EFDD] text-left font-semibold text-gray-600 ring-1 ring-amber-100 ${
                    fit ? 'px-1 py-2 text-[10px]' : 'min-w-[92px] px-2 py-2 text-[11px]'
                  }`}
                >
                  종류\만기
                </th>
                {MTM_TENORS.map((t) => (
                  <th
                    key={t}
                    className={`mtm-col-head bg-gray-50 text-right font-medium ring-1 ring-gray-100 ${
                      fit ? 'px-1 py-2 text-[10px]' : 'min-w-[62px] px-2 py-2 text-[12px]'
                    } ${highlightTenor === t ? 'text-bondgold' : 'text-gray-600'}`}
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MTM_ROWS.map((row) => (
                <tr key={row.key}>
                  <th
                    onClick={() => goRowCurve(row)}
                    data-testid="mtm-row-head"
                    title="이 종류의 수익률곡선 보기"
                    className={`mtm-row-head cursor-pointer bg-[#F5EFDD] text-left font-medium text-gray-700 ring-1 ring-amber-100 hover:text-bondgold ${
                      fit ? 'truncate px-1 py-2 text-[10px]' : 'min-w-[92px] whitespace-nowrap px-2 py-2 text-[11px]'
                    }`}
                  >
                    {row.label}
                  </th>
                  {MTM_TENORS.map((t) => {
                    const rate = lookup.get(`${row.key}:${t}`);
                    const missing = !rate || rate.yield == null;
                    return (
                      <td
                        key={t}
                        onClick={() => goSimCell(row, rate, t)}
                        onPointerMove={(e) => showMag(e, row, rate, t)}
                        title="투자 시뮬레이션으로"
                        className={`cursor-pointer text-right ring-1 ring-gray-100 ${
                          fit ? 'px-1 py-1.5' : 'whitespace-nowrap px-2 py-2'
                        } ${highlightTenor === t ? 'bg-amber-50' : ''}`}
                      >
                        {missing ? (
                          <span className="text-gray-300">—</span>
                        ) : showBp ? (
                          <span
                            className={
                              (rate!.changeBp ?? 0) > 0
                                ? 'text-red-600'
                                : (rate!.changeBp ?? 0) < 0
                                  ? 'text-blue-600'
                                  : 'text-gray-500'
                            }
                          >
                            {formatBp(rate!.changeBp)}
                          </span>
                        ) : (
                          <span className="font-medium text-gray-900">{formatYield(rate!.yield)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-1 text-[10px] text-gray-400">
        <span>종류(왼쪽 열) 탭 → 수익률곡선 · 셀 탭 → 투자 시뮬레이션{fit ? ' · 셀 위 드래그 → 돋보기' : ''}</span>
        <span className="ml-auto">출처 금융투자협회(kofiabond.or.kr) 원용</span>
      </div>

      {/* 플로팅 돋보기 — 압축(한 화면) 시 작은 수치를 크게 확인 */}
      {mag && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-2xl bg-[#0b1020]/95 px-5 py-3 text-center text-white shadow-xl ring-1 ring-white/10"
          style={{ left: mag.x, top: mag.y - 14 }}
        >
          <div className="text-[11px] text-gray-300">{mag.sub}</div>
          <div className="text-3xl font-bold tabular-nums text-bondgold">{mag.big}</div>
          <div className="text-[10px] text-gray-400">{mag.note}</div>
        </div>
      )}
    </div>
  );
}
