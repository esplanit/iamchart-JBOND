/**
 * @jbond/shared-types
 * 제임스 본드 공통 도메인 타입 정의 (PRD §2, §4 기준)
 *
 * 원칙:
 * - 결측값은 0으로 대체하지 않고 `null`/`undefined`로 유지한다.
 * - 모든 시장 관측값은 valueType / qualityStatus / 출처 메타를 동반한다.
 */

// ─────────────────────────────────────────────────────────────
// 공통 열거형
// ─────────────────────────────────────────────────────────────
export type BondCategory =
  | 'GOVERNMENT' // 국채(국고채)
  | 'MONETARY' // 통안채
  | 'LOCAL' // 지방채
  | 'SPECIAL' // 특수채
  | 'BANK' // 은행채
  | 'FINANCIAL' // 금융채
  | 'CARD' // 카드채
  | 'CAPITAL' // 캐피탈채
  | 'CORPORATE'; // 회사채

export type BondType =
  | 'DISCOUNT' // 할인채
  | 'FIXED_COUPON' // 고정금리 이표채
  | 'SIMPLE_COMPOUND' // 단리채
  | 'COMPOUND' // 복리채
  | 'FRN'; // 변동금리부(2차 확장)

export type DayCount = 'ACT_365' | 'ACT_ACT' | 'ACT_360' | '30_360';

export type RedemptionType = 'BULLET' | 'INSTALLMENT';

export type InterestPaymentType = 'ARREARS' | 'ADVANCE' | 'AT_MATURITY';

export type CouponFrequency = 1 | 2 | 4 | 12;

/** 시장 관측값의 성격 */
export type ValueType =
  | 'ACTUAL_TRADE' // 실제 거래
  | 'MARK_TO_MARKET' // 시가평가
  | 'FINAL_QUOTE' // 최종호가
  | 'ISSUE_YIELD' // 발행수익률
  | 'INTERPOLATED' // 보간
  | 'USER_INPUT'; // 사용자 입력

export type QualityStatus = 'VALID' | 'STALE' | 'ESTIMATED' | 'MISSING';

export type DataSource = 'SEIBRO' | 'KOFIA' | 'KRX' | 'MOCK' | 'USER';

// ─────────────────────────────────────────────────────────────
// 4.1 핵심 도메인
// ─────────────────────────────────────────────────────────────
export interface BondMaster {
  bondId: string;
  isin?: string;
  issueCode?: string; // 종목코드
  bondName: string;
  category: BondCategory;
  bondType: BondType;
  issuerName: string;
  currency: string; // KRW, USD ...
  creditRating?: string | null; // 신용등급 (없으면 null)
  isSubordinated?: boolean;
  isSecured?: boolean;
  isGuaranteed?: boolean;
}

export interface BondTerms {
  bondId: string;
  faceValue: number; // 실제 액면
  pricingFaceValue: 10000 | 1000000; // 기준 액면
  currency: string;

  issueDate: string; // ISO yyyy-mm-dd
  maturityDate: string;

  bondType: BondType;

  couponRate?: number | null; // 표면금리 (연 %) — 할인채 null 가능
  issueYield?: number | null; // 발행수익률 (연 %)
  couponFrequency?: CouponFrequency; // 연 지급횟수
  dayCount: DayCount;

  redemptionType: RedemptionType;
  redemptionRate: number; // 상환율 (통상 100)
  interestPaymentType: InterestPaymentType;
}

export interface BondCashflow {
  bondId: string;
  paymentDate: string;
  principal: number | null; // 원금상환액
  interest: number | null; // 이자
  outstandingFace: number | null; // 지급 후 잔여 액면
  isEstimated?: boolean;
}

export interface BondCreditRating {
  bondId: string;
  agency: string;
  rating: string;
  ratedDate: string;
}

/** 4.3 시장데이터 공통 규격 */
export interface BondMarketObservation {
  bondId: string;
  valuationDate: string; // 기준일

  yield?: number | null; // 연율 %, 소수 셋째
  cleanPrice?: number | null; // 10,000원 기준
  dirtyPrice?: number | null;
  accruedInterest?: number | null;
  tradeVolume?: number | null; // 거래량(액면)
  tradeAmount?: number | null; // 거래대금

  valueType: ValueType;

  source: DataSource | string;
  sourceUrl?: string;
  sourceTimestamp: string; // 원천 기준시각
  collectedAt: string; // 수집시각
  qualityStatus: QualityStatus;
  rawReference?: string; // 원본 참조 키
}

export interface YieldCurvePoint {
  curveId: string; // 예: GOVERNMENT / CORPORATE_AA0
  category: BondCategory;
  creditRating?: string | null;
  tenorLabel: TenorLabel;
  tenorYears: number;
  valuationDate: string;
  yield: number | null; // 없으면 null
  valueType: ValueType; // MARK_TO_MARKET | INTERPOLATED | FINAL_QUOTE ...
  qualityStatus: QualityStatus;
  source: DataSource | string;
}

export type TenorLabel = '3M' | '6M' | '1Y' | '2Y' | '3Y' | '5Y' | '10Y' | '20Y' | '30Y';

/** 시가평가표 원자료 셀 */
export interface MtmRate {
  rowKey: string; // 예: CORP_AA0
  rowLabel: string; // 회사채 AA0
  tenorLabel: TenorLabel;
  valuationDate: string;
  yield: number | null;
  changeBp: number | null; // 전일대비 bp
  valueType: ValueType;
  qualityStatus: QualityStatus;
  source: DataSource | string;
}

export interface SourceMetadata {
  source: DataSource | string;
  sourceUrl?: string;
  sourceTimestamp: string;
  collectedAt: string;
  qualityStatus: QualityStatus;
  note?: string;
}

// ─────────────────────────────────────────────────────────────
// 2.2 콘텐츠 연결 — 공통 상태 객체
// ─────────────────────────────────────────────────────────────
export interface BondContext {
  bondId?: string;
  isin?: string;
  issueCode?: string;
  bondName?: string;
  bondType?: string;
  valuationDate?: string;
  selectedYield?: number;
  selectedPrice?: number;
  selectedTenor?: TenorLabel;
  yieldSource?: 'MARKET' | 'ISSUE' | 'CURVE' | 'USER';
  sourceScreen?: 'ISSUE' | 'CURVE' | 'MARKET' | 'SIMULATION' | 'MTM';
}

// ─────────────────────────────────────────────────────────────
// 어댑터 계약 (Prompt03)
// ─────────────────────────────────────────────────────────────
export interface BondSearchQuery {
  keyword?: string; // 채권명/코드/ISIN
  issuer?: string;
  category?: BondCategory;
  currency?: string;
}

export interface BondDetail {
  master: BondMaster;
  terms: BondTerms;
  ratings: BondCreditRating[];
  latestObservation?: BondMarketObservation | null;
  metadata: SourceMetadata;
}

export interface BondDataAdapter {
  readonly source: DataSource;
  search(query: BondSearchQuery): Promise<BondMaster[]>;
  getDetail(bondId: string): Promise<BondDetail | null>;
  getObservations(bondId: string, from: string, to: string): Promise<BondMarketObservation[]>;
  getCurve(curveId: string, valuationDate: string): Promise<YieldCurvePoint[]>;
  getMtmMatrix(valuationDate: string): Promise<MtmRate[]>;
}
