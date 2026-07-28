import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { BondMaster, TenorLabel } from '@jbond/shared-types';
import { Skeleton, EmptyState } from '@jbond/ui';
import { dataService } from '../data/service.js';
import { useAppStore } from '../store/appStore.js';
import { MASTERS, MTM_ROWS, MTM_ROW_SEGMENT, residualYears } from '../data/mock.js';

const CATEGORY_LABEL: Record<string, string> = {
  GOVERNMENT: '국채',
  MONETARY: '통안채',
  LOCAL: '지방채',
  SPECIAL: '특수채',
  BANK: '은행채',
  FINANCIAL: '금융채',
  CARD: '카드채',
  CAPITAL: '캐피탈채',
  CORPORATE: '회사채',
};

const TENOR_YEARS: Record<TenorLabel, number> = {
  '3M': 0.25,
  '6M': 0.5,
  '1Y': 1,
  '2Y': 2,
  '3Y': 3,
  '5Y': 5,
  '10Y': 10,
  '20Y': 20,
  '30Y': 30,
};

/** 시가평가표 셀에서 넘어온 세그먼트(등급×만기)에 속할 수 있는 종목 필터링 */
function segmentBonds(seg: string, tenor: TenorLabel | null): BondMaster[] {
  const def = MTM_ROW_SEGMENT[seg];
  if (!def) return [];
  let list = MASTERS.filter((m) => m.category === def.category);
  if (def.rating) {
    const exact = list.filter(
      (m) => (m.creditRating ?? '').toUpperCase() === def.rating!.toUpperCase(),
    );
    if (exact.length) list = exact; // 등급 정밀 매칭이 있으면 좁히고, 없으면 카테고리로 완화
  }
  if (tenor && TENOR_YEARS[tenor] != null) {
    const target = TENOR_YEARS[tenor];
    list = [...list].sort(
      (a, b) =>
        Math.abs((residualYears(a.bondId) ?? 1e9) - target) -
        Math.abs((residualYears(b.bondId) ?? 1e9) - target),
    );
  }
  return list;
}

export function SearchScreen() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const seg = params.get('seg');
  const tenor = params.get('tenor') as TenorLabel | null;
  const segLabel = seg ? (MTM_ROWS.find((r) => r.key === seg)?.label ?? seg) : null;
  const [results, setResults] = useState<BondMaster[] | null>(null);
  const navigate = useNavigate();
  const { recents, watchlist, pushContext } = useAppStore();

  useEffect(() => {
    let alive = true;
    setResults(null);
    if (seg) {
      const list = segmentBonds(seg, tenor);
      if (alive) setResults(list);
    } else {
      dataService.search(q).then((r) => alive && setResults(r));
    }
    return () => {
      alive = false;
    };
  }, [q, seg, tenor]);

  const open = (bondId: string) => {
    if (seg) {
      // 세그먼트 종목 확정 → 컨텍스트 시드 후 유통정보(드릴다운 ③)로
      const m = dataService.getMaster(bondId);
      pushContext({ bondId, bondName: m?.bondName });
      navigate(`/distribution/${bondId}`);
    } else {
      navigate(`/issue/${bondId}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!seg && q === '' && (recents.length > 0 || watchlist.length > 0) && (
        <section className="flex flex-col gap-2">
          {watchlist.length > 0 && (
            <QuickList title="관심채권" ids={watchlist} onOpen={open} />
          )}
          {recents.length > 0 && <QuickList title="최근 조회" ids={recents} onOpen={open} />}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-medium text-gray-500">
          {seg
            ? `${segLabel}${tenor ? ` · ${tenor}` : ''} 구간 종목`
            : q
              ? `‘${q}’ 검색결과`
              : '전체 종목'}
        </h2>
        {results == null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : results.length === 0 ? (
          <EmptyState message={seg ? '이 구간에 해당하는 종목이 없습니다' : '검색 결과가 없습니다'} />
        ) : (
          <ul className="flex flex-col gap-2" data-testid="search-results">
            {results.map((m) => (
              <li key={m.bondId}>
                <button
                  type="button"
                  onClick={() => open(m.bondId)}
                  className="w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{m.bondName}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      {CATEGORY_LABEL[m.category] ?? m.category}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-gray-500">
                    <span>{m.issueCode}</span>
                    <span>{m.isin}</span>
                    {m.creditRating && <span>등급 {m.creditRating}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-[10px] text-gray-400">
        데이터 출처: SEIBro(기본)·KOFIA·KRX · 현재 Mock 모드
      </p>
    </div>
  );
}

function QuickList({
  title,
  ids,
  onOpen,
}: {
  title: string;
  ids: string[];
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-medium text-gray-500">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => {
          const m = dataService.getMaster(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpen(id)}
              className="rounded-full bg-white px-3 py-1.5 text-[11px] text-gray-700 shadow-sm ring-1 ring-gray-100"
            >
              {m?.bondName ?? id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
