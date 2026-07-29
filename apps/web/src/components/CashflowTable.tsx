import { formatPrice } from '@jbond/ui';

interface Row {
  paymentDate: string;
  principal: number;
  interest: number;
}

/** 현금흐름 표 (발행/시뮬레이션 공용) */
export function CashflowTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <p className="text-[12px] text-gray-400">현금흐름이 없습니다.</p>;
  return (
    <div className="w-full">
      <table className="w-full table-fixed text-[11px] tabular-nums">
        <thead>
          <tr className="text-left text-gray-400">
            <th className="py-1 pr-1 font-normal">지급일</th>
            <th className="py-1 pr-1 text-right font-normal">이자</th>
            <th className="py-1 pr-1 text-right font-normal">원금</th>
            <th className="py-1 text-right font-normal">합계</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-50">
              <td className="py-1 pr-1 text-gray-600">{r.paymentDate}</td>
              <td className="py-1 pr-1 text-right">{formatPrice(r.interest, 2)}</td>
              <td className="py-1 pr-1 text-right">{formatPrice(r.principal, 0)}</td>
              <td className="py-1 text-right font-medium">{formatPrice(r.interest + r.principal, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
