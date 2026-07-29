import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { BondTerms } from '@jbond/shared-types';
import { simulate, sensitivity, type EngineBondType, type SimInput, type TaxBase } from '@jbond/bond-engine';
import { Accordion, StatCard, formatMoney, formatPercent, formatYield, formatPrice } from '@jbond/ui';
import { dataService } from '../data/service.js';
import { useAppStore } from '../store/appStore.js';
import { AS_OF, MASTERS } from '../data/mock.js';
import { KV } from '../components/KV.js';

const TAX_KEY = 'jbond.tax.v1';

interface TaxSettings {
  taxRate: number;
  taxBase: TaxBase;
}

function loadTax(): TaxSettings {
  try {
    const raw = localStorage.getItem(TAX_KEY);
    if (raw) return JSON.parse(raw) as TaxSettings;
  } catch {
    /* ignore */
  }
  return { taxRate: 15.4, taxBase: 'INCOME' };
}

function addYears(iso: string, years: number): string {
  const d = new Date(Date.parse(iso));
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function SimulationScreen() {
  const { context } = useAppStore();
  const initialBondId = context.bondId ?? MASTERS[0].bondId;
  const [bondId, setBondId] = useState(initialBondId);
  const terms = dataService.getTerms(bondId) as BondTerms;

  // A/B 입력
  const [aDate, setADate] = useState(context.valuationDate ?? AS_OF);
  const [aYield, setAYield] = useState(context.selectedYield ?? terms.issueYield ?? terms.couponRate ?? 3);
  const [bDate, setBDate] = useState(addYears(context.valuationDate ?? AS_OF, 1));
  const [bYield, setBYield] = useState(context.selectedYield ?? terms.issueYield ?? terms.couponRate ?? 3);
  const [quantity, setQuantity] = useState(100);
  const [aFx, setAFx] = useState(terms.currency === 'KRW' ? 1 : 1300);
  const [bFx, setBFx] = useState(terms.currency === 'KRW' ? 1 : 1300);
  const [buyCost, setBuyCost] = useState(0);
  const [sellCost, setSellCost] = useState(0);

  // 과세 설정 (localStorage 복원)
  const [tax, setTax] = useState<TaxSettings>(loadTax);
  useEffect(() => {
    try {
      localStorage.setItem(TAX_KEY, JSON.stringify(tax));
    } catch {
      /* ignore */
    }
  }, [tax]);

  // 종목 변경 시 기본값 재설정
  useEffect(() => {
    const t = dataService.getTerms(bondId);
    if (!t) return;
    const y = t.issueYield ?? t.couponRate ?? 3;
    if (context.bondId !== bondId) {
      setAYield(y);
      setBYield(y);
      setAFx(t.currency === 'KRW' ? 1 : 1300);
      setBFx(t.currency === 'KRW' ? 1 : 1300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bondId]);

  const input: SimInput = useMemo(
    () => ({
      bond: {
        bondType: terms.bondType as EngineBondType,
        faceValue: terms.pricingFaceValue,
        issueDate: terms.issueDate,
        maturityDate: terms.maturityDate,
        couponRate: terms.couponRate ?? 0,
        couponFrequency: terms.couponFrequency ?? 1,
        dayCount: terms.dayCount,
        redemptionRate: terms.redemptionRate,
      },
      a: { valuationDate: aDate, marketYield: aYield, fx: aFx },
      b: { valuationDate: bDate, marketYield: bYield, fx: bFx },
      quantity,
      buyCost,
      sellCost,
      taxRate: tax.taxRate,
      taxBase: tax.taxBase,
    }),
    [terms, aDate, aYield, aFx, bDate, bYield, bFx, quantity, buyCost, sellCost, tax],
  );

  const result = useMemo(() => {
    try {
      return simulate(input);
    } catch (e) {
      return { error: (e as Error).message } as const;
    }
  }, [input]);

  const sens = useMemo(() => {
    try {
      return sensitivity(input);
    } catch {
      return [];
    }
  }, [input]);

  if ('error' in result) {
    return (
      <div className="rounded-xl bg-white p-4 text-sm text-red-600 ring-1 ring-red-100">
        계산 오류: {result.error}
      </div>
    );
  }

  const sensChart = {
    grid: { left: 44, right: 44, top: 20, bottom: 24 },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { fontSize: 10 }, data: ['Total Return', '예상단가'] },
    xAxis: { type: 'category', data: sens.map((r) => `${r.bpOffset >= 0 ? '+' : ''}${r.bpOffset}`), axisLabel: { fontSize: 9 } },
    yAxis: [
      { type: 'value', name: 'TR%', nameTextStyle: { fontSize: 9 }, axisLabel: { fontSize: 9 } },
      { type: 'value', name: '단가', nameTextStyle: { fontSize: 9 }, axisLabel: { fontSize: 9 } },
    ],
    series: [
      {
        name: 'Total Return',
        type: 'bar',
        data: sens.map((r) => r.totalReturn),
        itemStyle: { color: '#C9A227' },
      },
      {
        name: '예상단가',
        type: 'line',
        yAxisIndex: 1,
        data: sens.map((r) => r.expectedCleanPrice),
        itemStyle: { color: '#2563eb' },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3" data-testid="simulation-screen">
      {/* 종목 */}
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
        <label className="text-[11px] text-gray-500">종목</label>
        <select
          value={bondId}
          onChange={(e) => setBondId(e.target.value)}
          className="mt-1 min-h-[40px] w-full rounded-lg bg-gray-50 px-2 text-sm"
          aria-label="시뮬레이션 종목"
        >
          {MASTERS.map((m) => (
            <option key={m.bondId} value={m.bondId}>
              {m.bondName}
            </option>
          ))}
        </select>
        {context.sourceScreen && (
          <p className="mt-1 text-[10px] text-gray-400">
            전달됨: {context.sourceScreen} · 수익률출처 {context.yieldSource ?? '—'}
          </p>
        )}
      </div>

      {/* A / B 입력 */}
      <div className="grid grid-cols-2 gap-2">
        <SideInput
          title="A (취득/현재)"
          date={aDate}
          onDate={setADate}
          yieldVal={aYield}
          onYield={setAYield}
          fx={aFx}
          onFx={setAFx}
          showFx={terms.currency !== 'KRW'}
        />
        <SideInput
          title="B (처분/평가)"
          date={bDate}
          onDate={setBDate}
          yieldVal={bYield}
          onYield={setBYield}
          fx={bFx}
          onFx={setBFx}
          showFx={terms.currency !== 'KRW'}
          accent
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumField label="수량(좌)" value={quantity} onChange={setQuantity} />
        <NumField label="매수비용" value={buyCost} onChange={setBuyCost} />
        <NumField label="매도비용" value={sellCost} onChange={setSellCost} />
      </div>

      {/* 핵심 결과 */}
      <div className="grid grid-cols-2 gap-2" data-testid="sim-results">
        <StatCard label="초기투자금액" value={formatMoney(result.initialInvestment)} sub="A Dirty×수량×환율" />
        <StatCard
          label="총수익"
          value={formatMoney(result.totalProfit)}
          emphasis
          tone={result.totalProfit >= 0 ? 'up' : 'down'}
        />
        <StatCard label="Income Gain" value={formatMoney(result.incomeGain)} sub="수취이자·상환" />
        <StatCard label="Capital Gain" value={formatMoney(result.capitalGain)} sub="B−A Clean" />
        <StatCard label="FX Gain" value={formatMoney(result.fxGain)} />
        <StatCard label="예상세액" value={formatMoney(result.tax)} sub={`세율 ${tax.taxRate}%`} />
        <StatCard label="TR" value={formatPercent(result.tr)} tone="gold" />
        <StatCard label="CAGR" value={formatPercent(result.cagr)} tone="gold" />
        <StatCard label="BEP 수익률" value={result.bepYield != null ? formatYield(result.bepYield) : '—'} />
        <StatCard label="보유일수" value={`${result.holdingDays}일`} />
      </div>

      {/* 과세 설정 */}
      <Accordion title="과세 설정 (사용자 지정)">
        <p className="mb-2 text-[10px] text-amber-600">
          세법은 자동 판정하지 않습니다. 세율·과세대상은 사용자 설정값이며 재실행 시 복원됩니다.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <NumField
            label="세율(%)"
            value={tax.taxRate}
            step={0.1}
            onChange={(v) => setTax((t) => ({ ...t, taxRate: v }))}
          />
          <div>
            <label className="text-[11px] text-gray-500">과세대상</label>
            <select
              value={tax.taxBase}
              onChange={(e) => setTax((t) => ({ ...t, taxBase: e.target.value as TaxBase }))}
              className="mt-1 min-h-[40px] w-full rounded-lg bg-gray-50 px-2 text-[12px]"
            >
              <option value="INCOME">이자소득</option>
              <option value="INCOME_AND_CAPITAL">이자+자본이득</option>
              <option value="TOTAL">전체손익</option>
            </select>
          </div>
        </div>
      </Accordion>

      {/* 민감도 */}
      <Accordion title="민감도 분석 (−100bp ~ +100bp)" defaultOpen>
        <ReactECharts option={sensChart} style={{ height: 220, width: '100%' }} />
        <div className="mt-2">
          <table
            className="w-full table-fixed text-[10px] tabular-nums [&_td]:px-0.5 [&_th]:px-0.5"
            data-testid="sensitivity-table"
          >
            <thead>
              <tr className="text-gray-400">
                <th className="py-1 text-left font-normal">시나리오</th>
                <th className="py-1 text-right font-normal">B수익률</th>
                <th className="py-1 text-right font-normal">단가</th>
                <th className="py-1 text-right font-normal">Capital</th>
                <th className="py-1 text-right font-normal">TR%</th>
                <th className="py-1 text-right font-normal">CAGR%</th>
              </tr>
            </thead>
            <tbody>
              {sens.map((r) => (
                <tr key={r.bpOffset} className={`border-t border-gray-50 ${r.bpOffset === 0 ? 'bg-amber-50' : ''}`}>
                  <td className="py-1 text-left text-gray-600">
                    {r.bpOffset >= 0 ? '+' : ''}
                    {r.bpOffset}bp
                  </td>
                  <td className="py-1 text-right">{r.bYield.toFixed(3)}</td>
                  <td className="py-1 text-right">{formatPrice(r.expectedCleanPrice)}</td>
                  <td className="py-1 text-right">{formatMoney(r.capitalGain)}</td>
                  <td className="py-1 text-right">{r.totalReturn.toFixed(3)}</td>
                  <td className="py-1 text-right">{r.cagr.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Accordion>

      {/* 현금흐름 할인 상세 */}
      <Accordion title="현금흐름 · 할인과정 (A/B)">
        <div className="w-full">
          <table className="w-full table-fixed text-[10px] tabular-nums [&_td]:px-0.5 [&_th]:px-0.5">
            <thead>
              <tr className="text-gray-400">
                <th className="py-1 text-left font-normal">지급일</th>
                <th className="py-1 text-right font-normal">원리금</th>
                <th className="py-1 text-right font-normal">잔존연</th>
                <th className="py-1 text-right font-normal">A할인계수</th>
                <th className="py-1 text-right font-normal">A현가</th>
              </tr>
            </thead>
            <tbody>
              {result.aPricing.cashflows.map((cf, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-1 text-left text-gray-600">{cf.paymentDate}</td>
                  <td className="py-1 text-right">{formatPrice(cf.total, 2)}</td>
                  <td className="py-1 text-right">{cf.timeYears.toFixed(3)}</td>
                  <td className="py-1 text-right">{cf.discountFactor.toFixed(5)}</td>
                  <td className="py-1 text-right">{formatPrice(cf.presentValue, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 text-[11px]">
          <KV label="A Clean" value={formatPrice(result.aPricing.cleanPrice)} />
          <KV label="B Clean" value={formatPrice(result.bPricing.cleanPrice)} />
          <KV label="A Dirty" value={formatPrice(result.aPricing.dirtyPrice)} />
          <KV label="B Dirty" value={formatPrice(result.bPricing.dirtyPrice)} />
          <KV label="A 경과이자" value={formatPrice(result.aPricing.accruedInterest, 2)} />
          <KV label="B 경과이자" value={formatPrice(result.bPricing.accruedInterest, 2)} />
        </div>
      </Accordion>
    </div>
  );
}

function SideInput({
  title,
  date,
  onDate,
  yieldVal,
  onYield,
  fx,
  onFx,
  showFx,
  accent,
}: {
  title: string;
  date: string;
  onDate: (v: string) => void;
  yieldVal: number;
  onYield: (v: number) => void;
  fx: number;
  onFx: (v: number) => void;
  showFx: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 shadow-sm ring-1 ${accent ? 'bg-[#0b1020] ring-[#0b1020]' : 'bg-white ring-gray-100'}`}>
      <h3 className={`mb-2 text-[12px] font-semibold ${accent ? 'text-bondgold' : 'text-gray-700'}`}>{title}</h3>
      <label className={`text-[10px] ${accent ? 'text-gray-300' : 'text-gray-500'}`}>일자</label>
      <input
        type="date"
        value={date}
        onChange={(e) => onDate(e.target.value)}
        className="mb-1.5 min-h-[36px] w-full rounded-lg bg-gray-50 px-2 text-[12px] text-gray-900"
      />
      <label className={`text-[10px] ${accent ? 'text-gray-300' : 'text-gray-500'}`}>수익률(%)</label>
      <input
        type="number"
        step={0.001}
        value={yieldVal}
        onChange={(e) => onYield(Number(e.target.value))}
        className="min-h-[36px] w-full rounded-lg bg-gray-50 px-2 text-[12px] text-gray-900"
      />
      {showFx && (
        <>
          <label className={`text-[10px] ${accent ? 'text-gray-300' : 'text-gray-500'}`}>환율</label>
          <input
            type="number"
            step={0.0001}
            value={fx}
            onChange={(e) => onFx(Number(e.target.value))}
            className="min-h-[36px] w-full rounded-lg bg-gray-50 px-2 text-[12px] text-gray-900"
          />
        </>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="text-[11px] text-gray-500">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 min-h-[40px] w-full rounded-lg bg-gray-50 px-2 text-[12px] text-gray-900"
      />
    </div>
  );
}
