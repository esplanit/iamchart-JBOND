import ReactECharts from 'echarts-for-react';
import type { YieldCurvePoint } from '@jbond/shared-types';

export interface CurveSeries {
  name: string;
  color: string;
  dashed?: boolean;
  points: YieldCurvePoint[];
}

export function YieldCurveChart({
  series,
  yName = '수익률(%)',
  onPickTenor,
}: {
  series: CurveSeries[];
  yName?: string;
  onPickTenor?: (tenorLabel: string) => void;
}) {
  const tenors = series[0]?.points.map((p) => p.tenorLabel) ?? [];

  const option = {
    grid: { left: 44, right: 16, top: 30, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      formatter: (items: { seriesName: string; value: number | null; name: string }[]) => {
        const head = `만기 ${items[0]?.name}`;
        const lines = items
          .map((it) => `${it.seriesName}: ${it.value == null ? '—' : `${it.value}%`}`)
          .join('<br/>');
        return `${head}<br/>${lines}`;
      },
    },
    legend: { top: 0, textStyle: { fontSize: 10 } },
    xAxis: {
      type: 'category',
      data: tenors,
      name: '잔존만기',
      nameLocation: 'end',
      nameTextStyle: { fontSize: 9 },
      axisLabel: { fontSize: 10, interval: 0, hideOverlap: true },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      scale: true,
      name: yName,
      nameTextStyle: { fontSize: 9 },
      axisLabel: { fontSize: 9, formatter: '{value}' },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      connectNulls: false,
      lineStyle: { color: s.color, width: 2, type: s.dashed ? 'dashed' : 'solid' },
      itemStyle: { color: s.color },
      symbolSize: 8,
      data: s.points.map((p) => ({
        value: p.yield,
        // 관측=실선 채운점 / 보간=빈 원
        symbol: p.valueType === 'INTERPOLATED' ? 'emptyCircle' : 'circle',
      })),
    })),
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 280, width: '100%' }}
      onEvents={{
        click: (e: { name?: string }) => {
          if (onPickTenor && e.name) onPickTenor(e.name);
        },
      }}
    />
  );
}
