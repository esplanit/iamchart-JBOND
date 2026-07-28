import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { TopBar } from './components/TopBar.js';
import { BottomNav } from './components/BottomNav.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { SearchScreen } from './screens/SearchScreen.js';
import { IssueScreen } from './screens/IssueScreen.js';
import { DistributionScreen } from './screens/DistributionScreen.js';
import { CurveScreen } from './screens/CurveScreen.js';
import { MtmScreen } from './screens/MtmScreen.js';
import { SimulationScreen } from './screens/SimulationScreen.js';

const TITLES: Record<string, string> = {
  '/issue': '발행정보',
  '/curve': '수익률곡선',
  '/distribution': '유통정보',
  '/simulation': '투자 시뮬레이션',
  '/mtm': '시가평가표',
  '/search': '종목검색',
};

function titleFor(pathname: string): string {
  const key = Object.keys(TITLES).find((k) => pathname.startsWith(k));
  return key ? TITLES[key] : '채권정보';
}

export function App() {
  const location = useLocation();
  return (
    <div className="mx-auto flex min-h-full max-w-app flex-col bg-[#eef1f6]">
      <TopBar title={titleFor(location.pathname)} />
      <main className="flex-1 px-3 pb-[84px] pt-3">
        <ErrorBoundary name={location.pathname}>
          <Routes>
            <Route path="/" element={<Navigate to="/mtm" replace />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/issue" element={<IssueScreen />} />
            <Route path="/issue/:bondId" element={<IssueScreen />} />
            <Route path="/distribution" element={<DistributionScreen />} />
            <Route path="/distribution/:bondId" element={<DistributionScreen />} />
            <Route path="/curve" element={<CurveScreen />} />
            <Route path="/mtm" element={<MtmScreen />} />
            <Route path="/simulation" element={<SimulationScreen />} />
            <Route path="*" element={<Navigate to="/mtm" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
