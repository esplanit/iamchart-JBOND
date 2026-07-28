import type {
  BondCategory,
  BondCreditRating,
  BondMarketObservation,
  BondMaster,
  BondTerms,
  MtmRate,
  TenorLabel,
  YieldCurvePoint,
} from '@jbond/shared-types';

/** 데모 기준일 (결정론적) */
export const AS_OF = '2026-07-23';

export const MASTERS: BondMaster[] = [
  {
    bondId: 'KR103501GA34',
    isin: 'KR103501GA34',
    issueCode: '국고03500-3403',
    bondName: '국고채권 03500-3403(24-2)',
    category: 'GOVERNMENT',
    bondType: 'FIXED_COUPON',
    issuerName: '대한민국정부',
    currency: 'KRW',
    creditRating: 'AAA',
  },
  {
    bondId: 'KR2000MONE01',
    isin: 'KR2000MONE01',
    issueCode: '통안0250-2601',
    bondName: '통화안정증권 02500-2601',
    category: 'MONETARY',
    bondType: 'DISCOUNT',
    issuerName: '한국은행',
    currency: 'KRW',
    creditRating: 'AAA',
  },
  {
    bondId: 'KR6000CORPAA',
    isin: 'KR6000CORPAA',
    issueCode: '회사AA0-2701',
    bondName: '(주)본드전자 12 회사채',
    category: 'CORPORATE',
    bondType: 'FIXED_COUPON',
    issuerName: '본드전자',
    currency: 'KRW',
    creditRating: 'AA0',
  },
  {
    bondId: 'KR3000COMPD1',
    isin: 'KR3000COMPD1',
    issueCode: '지역개발복리-2901',
    bondName: '지역개발채권(복리) 03000-2901',
    category: 'LOCAL',
    bondType: 'COMPOUND',
    issuerName: '서울특별시',
    currency: 'KRW',
    creditRating: 'AA+',
  },
  {
    bondId: 'KR4000SIMPLE',
    isin: 'KR4000SIMPLE',
    issueCode: '금융단리-2801',
    bondName: '본드은행 단리채 04000-2801',
    category: 'BANK',
    bondType: 'SIMPLE_COMPOUND',
    issuerName: '본드은행',
    currency: 'KRW',
    creditRating: 'AAA',
  },
];

export const TERMS: Record<string, BondTerms> = {
  KR103501GA34: {
    bondId: 'KR103501GA34',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2024-03-10',
    maturityDate: '2034-03-10',
    bondType: 'FIXED_COUPON',
    couponRate: 3.5,
    issueYield: 3.52,
    couponFrequency: 2,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'ARREARS',
  },
  KR2000MONE01: {
    bondId: 'KR2000MONE01',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2025-01-15',
    maturityDate: '2026-01-15',
    bondType: 'DISCOUNT',
    couponRate: null,
    issueYield: 2.9,
    couponFrequency: 1,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'AT_MATURITY',
  },
  KR6000CORPAA: {
    bondId: 'KR6000CORPAA',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2024-07-01',
    maturityDate: '2027-07-01',
    bondType: 'FIXED_COUPON',
    couponRate: 4.2,
    issueYield: 4.25,
    couponFrequency: 4,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'ARREARS',
  },
  KR3000COMPD1: {
    bondId: 'KR3000COMPD1',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2024-01-02',
    maturityDate: '2029-01-02',
    bondType: 'COMPOUND',
    couponRate: 3.0,
    issueYield: 3.0,
    couponFrequency: 1,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'AT_MATURITY',
  },
  KR4000SIMPLE: {
    bondId: 'KR4000SIMPLE',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2024-01-02',
    maturityDate: '2028-01-02',
    bondType: 'SIMPLE_COMPOUND',
    couponRate: 3.8,
    issueYield: 3.8,
    couponFrequency: 1,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'AT_MATURITY',
  },
};

export const RATINGS: Record<string, BondCreditRating[]> = {
  KR103501GA34: [{ bondId: 'KR103501GA34', agency: 'KIS', rating: 'AAA', ratedDate: '2024-03-01' }],
  KR6000CORPAA: [
    { bondId: 'KR6000CORPAA', agency: 'KIS', rating: 'AA0', ratedDate: '2024-06-20' },
    { bondId: 'KR6000CORPAA', agency: 'NICE', rating: 'AA0', ratedDate: '2024-06-21' },
  ],
  KR3000COMPD1: [{ bondId: 'KR3000COMPD1', agency: 'KIS', rating: 'AA+', ratedDate: '2024-01-02' }],
  KR4000SIMPLE: [{ bondId: 'KR4000SIMPLE', agency: 'KIS', rating: 'AAA', ratedDate: '2024-01-02' }],
  KR2000MONE01: [{ bondId: 'KR2000MONE01', agency: 'KIS', rating: 'AAA', ratedDate: '2025-01-15' }],
};

function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DAY = 86_400_000;

export function observations(bondId: string, fromIso: string, toIso: string): BondMarketObservation[] {
  const terms = TERMS[bondId];
  if (!terms) return [];
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  const base = terms.issueYield ?? terms.couponRate ?? 3;
  const rnd = seeded(bondId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const out: BondMarketObservation[] = [];
  let y = base;
  for (let t = from; t <= to; t += DAY) {
    const d = new Date(t);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue; // 주말 휴장 → 결측
    y += (rnd() - 0.5) * 0.04;
    y = Math.max(0.3, y);
    const iso = d.toISOString().slice(0, 10);
    const hasTrade = rnd() > 0.55;
    out.push({
      bondId,
      valuationDate: iso,
      yield: Number(y.toFixed(3)),
      cleanPrice: null,
      dirtyPrice: null,
      accruedInterest: null,
      tradeVolume: hasTrade ? Math.round(rnd() * 5000) * 100 : null,
      tradeAmount: null,
      valueType: 'MARK_TO_MARKET',
      source: 'MOCK',
      sourceUrl: 'mock://seibro/observation',
      sourceTimestamp: `${iso}T15:30:00+09:00`,
      collectedAt: `${iso}T16:00:00+09:00`,
      qualityStatus: 'VALID',
      rawReference: `MOCK-${bondId}-${iso}`,
    });
  }
  return out;
}

const CURVE_TENORS: { label: TenorLabel; years: number }[] = [
  { label: '3M', years: 0.25 },
  { label: '6M', years: 0.5 },
  { label: '1Y', years: 1 },
  { label: '2Y', years: 2 },
  { label: '3Y', years: 3 },
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
  { label: '20Y', years: 20 },
  { label: '30Y', years: 30 },
];

export const CURVE_DEFS: Record<string, { label: string; base: number; slope: number; rating?: string; category: YieldCurvePoint['category'] }> = {
  GOVERNMENT: { label: '국채', base: 2.9, slope: 0.9, category: 'GOVERNMENT' },
  MONETARY: { label: '통안채', base: 2.85, slope: 0.5, category: 'MONETARY' },
  LOCAL: { label: '지방채', base: 3.1, slope: 0.95, rating: 'AA+', category: 'LOCAL' },
  SPECIAL: { label: '특수채', base: 3.15, slope: 0.95, rating: 'AAA', category: 'SPECIAL' },
  BANK: { label: '은행채', base: 3.25, slope: 0.9, rating: 'AAA', category: 'BANK' },
  CORPORATE_AAA: { label: '회사채 AAA', base: 3.4, slope: 1.0, rating: 'AAA', category: 'CORPORATE' },
  CORPORATE_AA0: { label: '회사채 AA0', base: 3.6, slope: 1.0, rating: 'AA0', category: 'CORPORATE' },
  CORPORATE_A0: { label: '회사채 A0', base: 4.4, slope: 1.15, rating: 'A0', category: 'CORPORATE' },
  CORPORATE_BBB: { label: '회사채 BBB', base: 6.5, slope: 1.4, rating: 'BBB', category: 'CORPORATE' },
};

export function curve(curveId: string, valuationDate: string): YieldCurvePoint[] {
  const cfg = CURVE_DEFS[curveId] ?? CURVE_DEFS.GOVERNMENT;
  const rnd = seeded(
    curveId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) +
      valuationDate.split('-').reduce((a, c) => a + Number(c), 0),
  );
  return CURVE_TENORS.map((tn, i) => {
    const missing = tn.label === '2Y' && curveId.startsWith('CORPORATE');
    const y = cfg.base + cfg.slope * Math.log1p(tn.years) * 0.6 + (rnd() - 0.5) * 0.05;
    return {
      curveId,
      category: cfg.category,
      creditRating: cfg.rating ?? null,
      tenorLabel: tn.label,
      tenorYears: tn.years,
      valuationDate,
      yield: missing ? null : Number(y.toFixed(3)),
      valueType: missing ? 'INTERPOLATED' : i % 5 === 4 ? 'FINAL_QUOTE' : 'MARK_TO_MARKET',
      qualityStatus: missing ? 'ESTIMATED' : 'VALID',
      source: 'MOCK',
    };
  });
}

export const MTM_ROWS: { key: string; label: string; base: number; slope: number; curveId: string }[] = [
  { key: 'GOV', label: '국고채', base: 2.9, slope: 0.9, curveId: 'GOVERNMENT' },
  { key: 'MSB', label: '통안채', base: 2.85, slope: 0.5, curveId: 'MONETARY' },
  { key: 'LOCAL', label: '지방채', base: 3.1, slope: 0.95, curveId: 'LOCAL' },
  { key: 'SPECIAL', label: '특수채 AAA', base: 3.15, slope: 0.95, curveId: 'SPECIAL' },
  { key: 'BANK', label: '은행채 AAA', base: 3.25, slope: 0.9, curveId: 'BANK' },
  { key: 'FIN', label: '금융채 AA', base: 3.45, slope: 0.95, curveId: 'BANK' },
  { key: 'CARD', label: '카드채 AA', base: 3.55, slope: 1.0, curveId: 'CORPORATE_AA0' },
  { key: 'CAPITAL', label: '캐피탈채 AA', base: 3.7, slope: 1.05, curveId: 'CORPORATE_AA0' },
  { key: 'CORP_AAA', label: '회사채 AAA', base: 3.4, slope: 1.0, curveId: 'CORPORATE_AAA' },
  { key: 'CORP_AAp', label: '회사채 AA+', base: 3.5, slope: 1.0, curveId: 'CORPORATE_AA0' },
  { key: 'CORP_AA0', label: '회사채 AA0', base: 3.6, slope: 1.0, curveId: 'CORPORATE_AA0' },
  { key: 'CORP_AAm', label: '회사채 AA-', base: 3.75, slope: 1.05, curveId: 'CORPORATE_AA0' },
  { key: 'CORP_Ap', label: '회사채 A+', base: 4.1, slope: 1.1, curveId: 'CORPORATE_A0' },
  { key: 'CORP_A0', label: '회사채 A0', base: 4.4, slope: 1.15, curveId: 'CORPORATE_A0' },
  { key: 'CORP_Am', label: '회사채 A-', base: 4.8, slope: 1.2, curveId: 'CORPORATE_A0' },
  { key: 'CORP_BBB', label: '회사채 BBB', base: 6.5, slope: 1.4, curveId: 'CORPORATE_BBB' },
];

/** 시가평가표 행(종류/등급) → 종목 세그먼트(카테고리·등급) 매핑.
 *  셀 선택 시 "해당 구간에 속할 수 있는 종목 리스트" 필터에 사용한다. */
export const MTM_ROW_SEGMENT: Record<string, { category: BondCategory; rating?: string }> = {
  GOV: { category: 'GOVERNMENT' },
  MSB: { category: 'MONETARY' },
  LOCAL: { category: 'LOCAL' },
  SPECIAL: { category: 'SPECIAL', rating: 'AAA' },
  BANK: { category: 'BANK', rating: 'AAA' },
  FIN: { category: 'FINANCIAL', rating: 'AA' },
  CARD: { category: 'CARD', rating: 'AA' },
  CAPITAL: { category: 'CAPITAL', rating: 'AA' },
  CORP_AAA: { category: 'CORPORATE', rating: 'AAA' },
  CORP_AAp: { category: 'CORPORATE', rating: 'AA+' },
  CORP_AA0: { category: 'CORPORATE', rating: 'AA0' },
  CORP_AAm: { category: 'CORPORATE', rating: 'AA-' },
  CORP_Ap: { category: 'CORPORATE', rating: 'A+' },
  CORP_A0: { category: 'CORPORATE', rating: 'A0' },
  CORP_Am: { category: 'CORPORATE', rating: 'A-' },
  CORP_BBB: { category: 'CORPORATE', rating: 'BBB' },
};

/** 종목의 기준일 대비 잔존연수 (세그먼트 만기 근접 정렬용) */
export function residualYears(bondId: string, asOf = AS_OF): number | null {
  const t = TERMS[bondId];
  if (!t) return null;
  return (Date.parse(t.maturityDate) - Date.parse(asOf)) / (365 * 86_400_000);
}

export const MTM_TENORS: TenorLabel[] = ['3M', '6M', '1Y', '3Y', '5Y', '10Y', '30Y'];
const YEARS: Record<TenorLabel, number> = {
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

export function mtmMatrix(valuationDate: string): MtmRate[] {
  const rnd = seeded(valuationDate.split('-').reduce((a, c) => a + Number(c), 0) + 7);
  const out: MtmRate[] = [];
  for (const row of MTM_ROWS) {
    for (const tenor of MTM_TENORS) {
      const yrs = YEARS[tenor];
      const missing = row.key === 'MSB' && tenor === '30Y';
      const y = row.base + row.slope * Math.log1p(yrs) * 0.6 + (rnd() - 0.5) * 0.04;
      const vt =
        row.key === 'GOV' || row.key === 'MSB'
          ? ('FINAL_QUOTE' as const)
          : rnd() > 0.5
            ? ('MARK_TO_MARKET' as const)
            : ('FINAL_QUOTE' as const);
      out.push({
        rowKey: row.key,
        rowLabel: row.label,
        tenorLabel: tenor,
        valuationDate,
        yield: missing ? null : Number(y.toFixed(3)),
        changeBp: missing ? null : Number(((rnd() - 0.5) * 12).toFixed(1)),
        valueType: missing ? 'INTERPOLATED' : vt,
        qualityStatus: missing ? 'MISSING' : 'VALID',
        source: 'MOCK',
      });
    }
  }
  return out;
}
