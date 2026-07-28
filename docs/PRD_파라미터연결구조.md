# PRD — 채권 파라미터 연결 구조 (Active Bond Context Spine)

**제품:** 제임스 본드(James Bond) 모바일 채권정보 웹앱 · `jbond.iamchart.co.kr`
**문서 버전:** v1.0 (2026-07)
**대상 릴리스:** MVP+1 (콘텐츠 유기 연결)
**한 줄 요약:** 사용자가 선택한 **종목(bondName)·수익률(yield)·평가일(valuationDate)** 을 앱 전체의 공통 파라미터로 승격시켜, 6개 탭·모든 화면·모든 콘텐츠가 **하나의 활성 채권 컨텍스트**를 유기적으로 공유·반영·갱신하도록 한다. 진입 기본 화면은 **시가평가표**이며, 거기서 **시장 전체 → 개별 종목 → 단가**로 좁혀가는 표준 드릴다운을 제공한다.

---

## 1. 배경 & 문제 정의

### 1.1 현재 구조 (As-is)
앱은 이미 화면 간 상태 전달용 공통 객체 `BondContext` 와 zustand 스토어(`useAppStore`)를 갖고 있다.

| 구성 | 현재 |
|------|------|
| 화면(탭) | 발행정보 `/issue` · 유통정보 `/distribution` · 수익률곡선 `/curve` · 시가평가표 `/mtm` · 투자 시뮬레이션 `/simulation` · 종목검색 `/search` |
| 하단 내비 | 곡선 · 유통 · 투자 · 시가표 · 발행 (+ 검색) |
| 공통 상태 | `BondContext { bondId, isin, issueCode, bondName, bondType, valuationDate, selectedYield, selectedPrice, yieldSource, sourceScreen }` |
| 전달 방식 | 버튼 클릭 시 `pushContext(patch)` → `navigate(path)` 로 병합·이동 |
| 영속화 | `recents`·`watchlist` 만 localStorage 저장. **`context` 는 메모리 전용** |

### 1.2 문제 (Gaps)
현재 파라미터 연결은 **부분적·단방향·비영속적**이라, "종목명·수익률이 앱 전체를 관통한다"는 목표에 미달한다.

- **G1. 컨텍스트 휘발성** — `context` 가 메모리에만 있어 새로고침/앱 재실행 시 활성 종목·수익률이 사라진다.
- **G2. 하단탭 이동 시 컨텍스트 단절** — BottomNav 로 탭 전환하면 `pushContext` 가 호출되지 않아, 발행정보에서 보던 종목이 곡선/시가표로 넘어가지 않는다.
- **G3. 곡선·시가표의 종목 비종속** — `CurveScreen` 은 `curveId`(채권 *종류*) 기준, `MtmScreen` 은 등급×만기 매트릭스 기준이라, **활성 종목의 등급/카테고리/자기 수익률**을 자동으로 강조·오버레이하지 않는다.
- **G4. 검색이 컨텍스트를 시드하지 않음** — `SearchScreen` 은 `/issue/:bondId` 로 이동만 하고 `bondName`·`bondId` 를 즉시 컨텍스트에 넣지 않는다.
- **G5. 활성 종목의 상시 가시성 부재** — `TopBar` 는 화면 제목만 표시. 지금 어떤 종목·수익률·평가일을 보고 있는지 항상 보이지 않는다.
- **G6. 전체 파라미터 딥링크 부재** — 일부 라우트만 `:bondId` 를 담고, `yield`·`date`·`yieldSource` 를 포함한 **공유 가능한 URL** 이 없다.
- **G7. 수익률 출처(provenance) 노출 제한** — `yieldSource(MARKET/ISSUE/CURVE/USER)` 가 시뮬레이션 화면에서만 작게 표기된다.

---

## 2. 목표 & 비목표

### 2.1 목표 (Goals)
- **P1.** `BondContext` 를 **앱 전역·영속·양방향** 의 "파라미터 스파인"으로 승격한다.
- **P2.** 6개 화면 모두 진입 시 활성 컨텍스트를 **읽어(in-params)** 종목 특화 콘텐츠를 렌더링하고, 화면 내 조작으로 관련 파라미터를 **갱신(out-params)** 하면 전역에 즉시 반영된다.
- **P3.** 활성 종목명·수익률·평가일·출처를 **상시 표시**(TopBar 컨텍스트 바)하고, 어떤 경로로 이동해도 일관되게 유지한다.
- **P4.** 컨텍스트 전체를 **URL 파라미터로 인코딩**해 딥링크·공유·새로고침 복원을 지원한다.
- **P5.** 수익률 **출처 배지(yieldSource)** 를 전 화면 공통 UI 요소로 표준화한다.

### 2.2 비목표 (Non-goals)
- 실시간 원천(SEIBro/KOFIA/KRX) 연동 자체 (별도 `DATA_SOURCE_MODE=live` 트랙). 본 PRD는 **연결 구조**에 한정하며 mock/live 양쪽에서 동일하게 동작한다.
- 세법 자동판정 — 과세는 기존대로 사용자 지정값 유지.
- 다종목 동시 비교(포트폴리오) — 활성 컨텍스트는 **단일 종목**을 원칙으로 하되, 최근 종목(`recents`) 로 빠른 전환만 지원(향후 확장 여지).

---

## 3. 핵심 개념 — 활성 채권 컨텍스트(Active Bond Context)

앱 전체가 공유하는 **단일 파라미터 묶음**. 기존 `BondContext` 를 확장한다.

### 3.1 파라미터 스키마 (확장)
```ts
interface BondContext {
  // ── 식별 (종목) ──
  bondId?: string;
  isin?: string;
  issueCode?: string;
  bondName?: string;        // ★ 전 화면 상시 표시 파라미터
  bondType?: string;
  category?: BondCategory;   // (신규) 곡선/시가표 행 자동선택용
  creditRating?: string | null; // (신규) 등급 기반 곡선 선택용

  // ── 평가 파라미터 ──
  valuationDate?: string;    // ★ 공유 평가일
  selectedYield?: number;    // ★ 공유 수익률(%)
  selectedPrice?: number;
  selectedTenor?: TenorLabel; // (신규) 곡선↔시가표 만기축 공유

  // ── 메타 ──
  yieldSource?: 'MARKET' | 'ISSUE' | 'CURVE' | 'USER';
  sourceScreen?: 'ISSUE' | 'CURVE' | 'MARKET' | 'SIMULATION' | 'MTM' | 'SEARCH';
  updatedAt?: string;        // (신규) 컨텍스트 최종 갱신 시각
}
```

### 3.2 스파인 원칙
1. **단일 출처(single source of truth):** 활성 컨텍스트는 `useAppStore().context` 하나뿐. 각 화면의 로컬 state 초깃값은 항상 컨텍스트에서 파생한다(현재 `SimulationScreen`/`DistributionScreen` 패턴을 전 화면으로 일반화).
2. **읽고-쓰기 양방향:** 화면은 진입 시 컨텍스트를 **읽고**, 사용자가 종목/수익률/평가일/만기를 바꾸면 `pushContext` 로 **되쓴다**. 되쓰기는 디바운스하여 과도한 갱신을 막는다.
3. **영속 + 복원:** 컨텍스트는 `localStorage(jbond.context.v1)` 에 저장하고, 앱 부팅 시 `URL 파라미터 > localStorage > 기본값` 우선순위로 복원한다.
4. **관성(inertia):** 하단탭으로 화면을 바꿔도 활성 종목·수익률은 유지된다(G2 해소). 종목을 바꾸는 명시적 조작이 있을 때만 교체된다.

### 3.3 표준 드릴다운 흐름 (Canonical Funnel) ★
도메인 접속 시 **기본 화면은 시가평가표**이며, 시장 전체 조망에서 개별 종목 단가까지 **점점 좁혀가는** 순방향 흐름을 1급 경로로 제공한다. 각 단계는 앞 단계에서 선택한 파라미터를 이어받는다.

```
[접속] ─▶ ① 시가평가표(/mtm)   ← 진입 기본(default landing)
             │
             ├─(A) 행(종류/등급) 선택 ─▶ ② 수익률곡선(/curve)
             │        {category, creditRating, bondType}         │ 곡선상 지점(만기점) 선택
             │                                                    ▼ {selectedTenor, selectedYield(보간)}
             │                                              ③ 유통정보(/distribution)
             │                                                    ▲
             └─(B) 셀(등급×만기) 선택 ─▶ [종목 리스트] ──종목 확정──┘
                      {category, creditRating, selectedTenor, selectedYield}
                                                            │  {bondId, bondName, valuationDate, selectedPrice}
                                                            ▼
                                                      ④ 발행정보(/issue)
                                                            │ 단가계산 진입
                                                            ▼ {bondId, bondName, selectedYield, valuationDate}
                                                      ⑤ 단가계산 · 투자 시뮬레이션(/simulation)
```

**단계별 파라미터 연결 규칙**
| 단계 | 사용자 액션 | 전달(Out) 파라미터 | 다음 화면이 하는 일(In) |
|------|-------------|--------------------|--------------------------|
| ①(A)→② | 시가표에서 **행(종류/등급)** 탭 | `category, creditRating, bondType, sourceScreen:'MTM'` | 해당 등급 곡선 자동 선택 |
| ①(B)→리스트 | 시가표에서 **특정 셀(등급×만기)** 탭 | `category, creditRating, selectedTenor, selectedYield, yieldSource:'CURVE', sourceScreen:'MTM'` | 해당 구간 **종목 리스트** 표시 → 종목 확정 시 ③으로 |
| ②→③ | 곡선상 **만기점** 탭 | `selectedTenor, selectedYield(보간치), yieldSource:'CURVE', sourceScreen:'CURVE'` | 해당 부문·만기에 부합하는 **대표 종목**(또는 활성 종목)의 유통 시계열 표시 |
| ③→④ | 유통 화면에서 **발행정보 보기** | `bondId, bondName, valuationDate, selectedPrice, sourceScreen:'MARKET'` | 종목 발행 상세 렌더 |
| ④→⑤ | 발행 화면에서 **단가계산** | `bondId, bondName, selectedYield, valuationDate, yieldSource, sourceScreen:'ISSUE'` | A/B 수익률·일자 초기값을 이어받아 계산 |

**보조 규칙**
- **역방향/횡방향 이동**은 하단 내비로 언제나 가능하며 §3.2의 관성 원칙을 따른다. 드릴다운은 *권장 1급 경로*일 뿐 강제 마법사가 아니다.
- **②→③의 의미 브리지:** 곡선의 한 점은 "부문·만기·수익률"이라 특정 종목이 아니다. 유통정보는 `{category, creditRating, selectedTenor}` 로 **대표 종목을 해석(resolve)** 하되, 활성 종목이 그 부문에 부합하면 활성 종목을 유지한다.
- **정규 흐름 브레드크럼:** 컨텍스트 바(§5.1)에 현재 드릴다운 위치(①~⑤)를 축약 표시해 "지금 어디까지 좁혔는지" 를 보여준다.

---

## 4. 화면별 요구사항 (In-params / Out-params)

각 화면이 **읽는 파라미터**와 **되쓰는 파라미터**를 정의한다. "content가 파라미터를 활용한다"의 구체 규격이다.

### 4.1 종목검색 `/search`
- **In:** `keyword`(URL `?q=`), `recents`, `watchlist`
- **Out:** 종목 탭 시 `{ bondId, bondName, isin, issueCode, category, creditRating, sourceScreen:'SEARCH' }` 를 즉시 `pushContext` 후 `/issue/:bondId` 이동 **(G4 해소)**
- **content:** 결과 리스트에 활성 종목이면 하이라이트, `watchlist` 별표 반영

### 4.2 발행정보 `/issue`, `/issue/:bondId` — 드릴다운 ④
- **In:** `bondId`(URL param > context > recents[0]) → `getDetail` 로 상세. 진입 시 `addRecent`
- **Out (④→⑤, 순방향):** **"단가계산"** → `{ bondId, bondName, selectedYield(최근관측 or 발행수익률), yieldSource:'MARKET'|'ISSUE', valuationDate, sourceScreen:'ISSUE' }` → **`/simulation`** (기존 `btn-simulation`)
- **Out (보조):** "유통정보" → `{ bondId, bondName, valuationDate, sourceScreen:'ISSUE' }` → `/distribution/:bondId` (횡/역방향)
- **자동 시드:** 상세 로드 완료 시 `{ bondName, category, creditRating, bondType }` 를 컨텍스트에 **자동 반영**(버튼 없이도 곡선/시가표가 이 종목을 알도록)
- **content:** 헤더에 `bondName` + 관심 토글, 표면금리/발행수익률/만기 등 종목 파라미터 표시

### 4.3 유통정보 `/distribution`, `/distribution/:bondId` — 드릴다운 ③
- **In:** 곡선에서 넘어온 `{category, creditRating, selectedTenor}` 로 **대표/활성 종목을 해석**(§3.3 의미 브리지), `valuationDate`(선택일; 기본 최신), 관측 시계열.
- **Out (③→④):** **"발행정보 보기"**(신규 버튼) → `{ bondId, bondName, valuationDate, selectedPrice, sourceScreen:'MARKET' }` → **`/issue/:bondId`** (표준 드릴다운).
- **Out (보조):** 날짜 선택(picked) → `{ valuationDate, selectedYield(선택일 관측수익률), selectedPrice, yieldSource:'MARKET'(폴백 'ISSUE') }`. "이 수익률로 계산" → `/simulation` **(기존 `btn-calc-from-yield` 우회로 유지)**
- **content:** 가격/수익률 시계열 차트에서 선택일 마커 → 공유 `valuationDate` 와 동기화. 선택일 변경이 곧 전역 평가일 변경. 부문 브리지로 해석된 종목이 활성 종목과 다르면 "부문 대표 종목" 라벨 표시.

### 4.4 수익률곡선 `/curve` — 드릴다운 ②
- **In (G3 해소):**
  - `category`/`creditRating` → 진입 시 곡선 종류를 **활성 종목/선택 부문 등급 곡선**으로 자동 선택(현재는 `bondType` 만 사용).
  - `valuationDate` → 곡선 기준일로 사용(현재 `AS_OF` 고정 → 컨텍스트 기준일로).
  - `selectedTenor` → 시가표에서 넘어온 만기점 강조.
  - `selectedYield` + 종목 잔존만기 → **활성 종목을 곡선 위 점으로 오버레이**해 "내 종목이 곡선 대비 어디" 를 시각화.
- **Out (②→③):** 곡선상 **만기점 탭** → `{ selectedTenor, selectedYield(해당 만기치), yieldSource:'CURVE', sourceScreen:'CURVE' }` → **`/distribution`** (표준 드릴다운). 시가표 재조회는 하단 내비로.
- **content:**
  - 기존 모드(현재/비교/변동폭/스프레드/궤적) 유지, 기준일·비교일은 컨텍스트에서 파생.
  - **보간 규칙 ★:** 특정 연물(만기)의 관측 데이터가 없으면 **인접 관측점 기반 보간치로 곡선을 연속 표현**한다. 관측점과 보간점은 시각적으로 구분(기존 범례 `● 관측 / ○ 보간 / — 데이터 없음`)하고, 각 점의 `valueType`(`MARK_TO_MARKET` / `INTERPOLATED`)·`qualityStatus` 를 유지한다. 보간점을 선택해 다음 단계로 넘길 때 전달되는 `selectedYield` 는 `yieldSource:'CURVE'` 로 표기하고, 필요 시 "보간값" 배지를 함께 노출한다.
  - **보간 방식:** 선형(잔존연 `tenorYears` 기준) 보간을 기본으로 하며, 양 끝단(범위 밖) 만기는 최근접 관측점으로 평탄 처리(flat extrapolation)한다. 완전 결측(양쪽 모두 관측 없음) 구간은 `— 데이터 없음`으로 표기하고 선택 불가.

### 4.5 시가평가표 `/mtm` — 드릴다운 ① (진입 기본 화면 ★)
- **역할:** 도메인 접속 시 **디폴트 랜딩**. 시장 전체(등급×만기 매트릭스)를 조망하고 부문을 골라 곡선으로 좁혀가는 출발점.
- **In (G3 해소):** `category`/`creditRating` → 매트릭스에서 **활성 종목의 행을 자동 하이라이트**, `selectedTenor` → 해당 열 강조.
- **Out — 두 갈래 (★):**
  - **(A) 행(종류/등급) 선택 → 수익률곡선.** 행 라벨(부문·등급)을 탭하면 `{ category, creditRating, bondType(=rowKey/curveId), sourceScreen:'MTM' }` → **`/curve`**. 해당 등급 곡선을 조망(드릴다운 ①→②).
  - **(B) 특정 셀(등급×만기) 선택 → 종목 리스트.** 셀을 탭하면 `{ category, creditRating, selectedTenor, selectedYield(셀 수익률), yieldSource:'CURVE', sourceScreen:'MTM' }` → **해당 구간(등급×만기)에 속할 수 있는 종목 리스트**를 보여준다. 리스트에서 종목 확정 → 드릴다운 ③(유통정보)로 진입.
  - **(보조)** "시뮬레이션으로"(`btn-to-sim`) 빠른 우회로 유지.
- **종목 리스트(세그먼트 뷰):** 셀이 지정한 `category`/`creditRating`(행) + `selectedTenor`(열, 잔존만기 근접) 조건으로 종목을 필터링해 나열. 구현은 **검색 화면(`/search`) 을 세그먼트 필터로 재사용**(`?cat=&rating=&tenor=`)하거나 전용 뷰로 확장. 각 항목 탭 → `{ bondId, bondName, isin, category, creditRating }` 시드 후 `/distribution/:bondId`(권장) 또는 `/issue/:bondId`.
- **content:** sticky 헤더/첫열 유지(기존 E2E), 활성 종목 등급 행에 배지. **행 라벨과 데이터 셀의 탭 타깃(hit area)을 시각적으로 구분**해 (A)/(B) 를 오인하지 않게 한다.

### 4.6 단가계산 · 투자 시뮬레이션 `/simulation` — 드릴다운 ⑤ (종착)
- **In:** `bondId`, `selectedYield`(→ A/B 수익률 초기값), `valuationDate`(→ A일자), `yieldSource`(출처 배지)
- **Out:** 종목 셀렉트 변경 시 `{ bondId, bondName, yieldSource:'USER' }` 되쓰기. 계산 파라미터(수익률/일자)는 사용자 조정값을 `USER` 출처로 컨텍스트에 반영(선택).
- **content:** 이미 `context.selectedYield/valuationDate/sourceScreen/yieldSource` 를 사용 중 — **기준 화면**. 나머지 화면을 이 수준으로 끌어올린다.

### 4.7 파라미터 흐름 매트릭스
**정규 드릴다운 (순방향 1급 경로)**
| # | From → To | 전달 파라미터 |
|---|-----------|---------------|
| ①A | 시가표(행) → 곡선 | category, creditRating, bondType |
| ①B | 시가표(셀) → 종목 리스트 | category, creditRating, selectedTenor, selectedYield, yieldSource:CURVE |
| ② | 곡선 → 유통 | selectedTenor, selectedYield(보간 가능), yieldSource:CURVE |
| ①B' | 종목 리스트 → 유통/발행 | bondId, bondName, isin, category, creditRating |
| ③ | 유통 → 발행 | bondId, bondName, valuationDate, selectedPrice |
| ④ | 발행 → 단가계산 | bondId, bondName, selectedYield, yieldSource, valuationDate |

**보조(횡/역/우회) 경로**
| From → To | 전달 파라미터 |
|-----------|---------------|
| 검색 → 발행 | bondId, bondName, isin, category, rating |
| 발행 → 유통 | bondId, bondName, valuationDate |
| 유통 → 단가계산 | valuationDate, selectedYield, selectedPrice, yieldSource |
| 시가표 → 단가계산 | selectedYield, selectedTenor, yieldSource:CURVE |
| (자동) 발행 → 곡선/시가표 | category, creditRating, bondType |
| 임의탭 → 임의탭 | bondId·bondName·valuationDate·selectedYield **관성 유지** |

---

## 5. 공통(Cross-cutting) 요구사항

### 5.1 상시 컨텍스트 바 (TopBar 확장) — G5
- `TopBar` 아래(또는 내부)에 **활성 종목 칩**: `bondName` · `selectedYield%` · `valuationDate` · `yieldSource 배지`.
- 칩 탭 → 종목 전환 시트(최근 `recents` + 검색 진입).
- 컨텍스트 비었을 때: "종목을 선택하세요" placeholder + 검색 유도.

### 5.2 수익률 출처 배지 표준화 — G7
- `yieldSource` 를 공통 `<YieldSourceBadge>` 로: `MARKET`(관측) / `ISSUE`(발행) / `CURVE`(곡선보간) / `USER`(직접입력). 색상·아이콘 통일, 곡선·시가표·유통·시뮬 어디서든 동일하게 노출.

### 5.3 URL 파라미터 딥링크 — G4/G6
- 컨텍스트를 쿼리스트링으로 직렬화: `?bond=<bondId>&y=<yield>&d=<date>&t=<tenor>&src=<yieldSource>`.
- 부팅 복원 우선순위: **URL > localStorage(jbond.context.v1) > 기본값**.
- 화면 내 파라미터 변경 시 `replaceState` 로 URL 동기화(히스토리 오염 방지). "공유" 버튼으로 현재 상태 링크 복사.

### 5.4 영속화 — G1
- 신규 키 `jbond.context.v1` 에 컨텍스트 저장. 기존 `jbond.recents.v1`·`jbond.watchlist.v1`·`jbond.lastgood.v1`·`jbond.tax.v1` 와 동일 패턴.
- 저장은 디바운스(예: 300ms), 손상 시 무시하고 기본값(기존 코드 관용구 재사용).

### 5.5 데이터 품질·오프라인 일관성
- 기존 `readLastGood`/`cacheLastGood`·`qualityStatus`·`StaleBanner` 를 컨텍스트 파라미터 렌더에도 적용: 활성 종목 수익률이 폴백/지연이면 컨텍스트 칩에도 stale 표시.

---

## 6. 상태·데이터 설계 (구현 가이드)

### 6.1 스토어 확장 (`apps/web/src/store/appStore.ts`)
```ts
interface AppState {
  context: BondContext;
  recents: string[];
  watchlist: string[];

  pushContext: (patch: Partial<BondContext>) => void;  // + updatedAt 스탬프 + 영속화
  setActiveBond: (bondId: string) => void;             // (신규) 마스터 조회→식별 필드 일괄 시드
  hydrateFromUrl: (search: string) => void;            // (신규) 부팅 URL 복원
  clearContext: () => void;
  addRecent / toggleWatch / isWatched;                 // (유지)
}
```
- `pushContext` 는 병합 후 `jbond.context.v1` 저장 + `updatedAt` 갱신.
- 신규 selector 훅 `useActiveBond()` — `context` + `getMaster/getTerms` 조합으로 활성 종목의 파생값(잔존만기·표면금리 등) 제공.

### 6.2 라우팅
- **기본 랜딩 변경 ★:** `App.tsx` 의 `/` → `Navigate to "/mtm"`(현재 `/issue`), `path="*"` 폴백도 `/mtm` 로. 시가평가표가 진입 기본 화면.
- 각 화면 진입 시 `useSearchParams` + `hydrateFromUrl` 로 컨텍스트 보강(현재 `MtmScreen`/`SearchScreen` 이 이미 `useSearchParams` 사용 — 전 화면 일반화).
- `App.tsx` 최상위에서 URL↔컨텍스트 동기화 이펙트 1개 추가.
- 곡선의 만기점 탭 목적지를 `/mtm?tenor=` → **`/distribution`** 로 변경(§3.3 ②→③).

### 6.3 서비스 계층
- `dataService` 변경 최소. 곡선/시가표에서 활성 종목 오버레이를 위해 `getMaster(bondId)`·`priceAt` 조합 재사용(신규 API 불필요).

---

## 7. 엣지 케이스 & 규칙
- **컨텍스트 없음:** 첫 방문/초기화 → 발행 기본 종목 시드 또는 검색 유도. 화면은 빈 상태(`EmptyState`)로 안전 렌더.
- **종목 교체 vs 파라미터 유지:** `bondId` 변경 시 종목 종속 파라미터(`selectedYield`, `selectedPrice`, `selectedTenor`)는 초기화, 사용자 설정(과세 `jbond.tax.v1`)은 유지(현 `SimulationScreen` 로직 일반화).
- **URL·저장소 충돌:** URL 우선. 단 URL의 `bondId` 가 없고 저장소에만 있으면 저장소 사용.
- **유효하지 않은 파라미터:** 미존재 `bondId`/`tenor`/음수 수익률은 무시하고 기본값 폴백(방어적).
- **관성의 예외:** `clearContext`(명시적 초기화) 또는 검색에서 새 종목 확정 시에만 종목 교체.

---

## 8. 수용 기준 (Acceptance Criteria) & E2E
기존 `e2e/connections.spec.ts`(콘텐츠 연결)·`e2e/mtm-sticky.spec.ts` 를 확장한다.

- **AC0 (기본 랜딩):** 도메인 루트(`/`)·미매칭 경로 접속 시 **시가평가표(`/mtm`)** 가 표시된다.
- **AC-FUNNEL (정규 드릴다운):** 시가표 → 곡선 → 만기점 탭 → 유통 → "발행정보 보기" → 발행 → "단가계산" → 시뮬레이션까지 **한 흐름으로 이어지며**, 각 단계에서 앞 단계 파라미터(등급/만기/수익률/평가일/종목)가 유지·반영된다.
- **AC-MTM-A (행→곡선):** 시가표에서 **행(종류/등급)** 을 탭하면 해당 등급 **수익률곡선**으로 이동한다.
- **AC-MTM-B (셀→종목리스트):** 시가표에서 **특정 셀(등급×만기)** 을 탭하면 그 구간에 속하는 **종목 리스트**가 표시되고, 항목 선택 시 해당 종목 컨텍스트를 시드하며 유통/발행으로 진입한다.
- **AC-INTERP (곡선 보간):** 특정 연물 관측이 결측이어도 곡선이 **보간치로 연속 표현**되고, 보간점은 `○` 로 구분되며 선택 시 `yieldSource:'CURVE'` + 보간 배지로 다음 단계에 전달된다. 양쪽 모두 결측인 구간은 `—` 로 표기·선택 불가.
- **AC1 (관성):** 발행에서 종목 X 조회 → 하단탭 "곡선"/"시가표"/"시뮬" 이동 시 **X 의 종목명·수익률이 유지**된다.
- **AC2 (검색 시드):** 검색 → 결과 탭 즉시 컨텍스트 바에 `bondName` 표시.
- **AC3 (곡선 종속):** 활성 종목 등급 곡선이 자동 선택되고, 종목 수익률 점이 곡선 위에 오버레이된다.
- **AC4 (시가표 하이라이트):** 활성 종목 등급 행 + `selectedTenor` 열이 강조된다.
- **AC5 (평가일 동기화):** 유통정보에서 선택일 변경 → 시뮬레이션 A일자·곡선 기준일이 동일 날짜로 반영.
- **AC6 (딥링크):** `?bond=&y=&d=&t=&src=` URL 로 진입 시 모든 화면이 해당 파라미터로 복원.
- **AC7 (새로고침 복원):** 새로고침 후에도 활성 종목·수익률 유지(localStorage).
- **AC8 (출처 배지):** `yieldSource` 배지가 유통·곡선·시가표·시뮬에서 일관 노출.
- **AC9 (회귀):** 기존 6개 연결 테스트 + sticky 테스트 전부 통과(CI E2E: chromium + webkit).

---

## 9. 단계별 롤아웃 (Phasing)
| 단계 | 범위 | 산출 |
|------|------|------|
| **P0. 스파인 기반** | 스토어 영속화(`jbond.context.v1`) + `updatedAt` + 부팅 복원 | G1 해소, 회귀 무 |
| **P1. 랜딩 & 정규 흐름 & 컨텍스트 바** | 기본 랜딩 `/mtm`, 드릴다운 배선(①시가표→②곡선→③유통→④발행→⑤단가), BottomNav 관성, TopBar 활성 종목 칩·브레드크럼, 검색 시드 | 흐름·G2·G4·G5 |
| **P2. 종목 종속 곡선·시가표 & 보간** | 등급 자동선택·오버레이·행/열 하이라이트, 결측 연물 곡선 보간(선형+평탄) | G3·보간 |
| **P3. 딥링크 & 출처 배지** | URL 직렬화/복원, 공유 버튼, `YieldSourceBadge` 표준화 | G6·G7 |
| **P4. 다듬기** | stale 일관성, 엣지 케이스, E2E 확장 | 품질 |

---

## 10. 성공 지표 (Metrics)
- **연결 사용률:** 세션당 화면 간 컨텍스트 전달(파라미터 동반 이동) 횟수 ↑.
- **컨텍스트 유지율:** 탭 전환 후 동일 종목 유지 비율(관성 성공률) ≥ 목표치.
- **딥링크 진입:** 공유 링크를 통한 세션 유입 수.
- **이탈:** 빈 컨텍스트 이탈률 ↓, 검색→발행→시뮬 퍼널 완주율 ↑.

---

## 부록 A. 참조 코드 앵커
- 화면: `apps/web/src/screens/{Search,Issue,Distribution,Curve,Mtm,Simulation}Screen.tsx`
- 스토어: `apps/web/src/store/appStore.ts`
- 타입: `packages/shared-types/src/index.ts` (`BondContext` §2.2)
- 서비스: `apps/web/src/data/service.ts` (`dataService`, `priceAt`, `readLastGood`)
- 라우팅/셸: `apps/web/src/App.tsx`, `components/{TopBar,BottomNav}.tsx`
- E2E: `apps/web/e2e/connections.spec.ts`, `apps/web/e2e/mtm-sticky.spec.ts`
