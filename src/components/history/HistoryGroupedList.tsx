import type { HistoryDayGroup, HistoryRow } from '../../features/history/historyModel';
import { SubwayLineBadge, TicketBadge } from '../ui-kit/TransitBadges';
import { TransactionRow } from './TransactionRow';

const rowIcon = (row: HistoryRow) =>
  row.icon.kind === 'line' ? (
    <SubwayLineBadge type={row.icon.line} className="tx-row__badge" />
  ) : (
    <TicketBadge type={row.icon.ticket} className="tx-row__badge" />
  );

export interface HistoryGroupedListProps {
  readonly groups: readonly HistoryDayGroup[];
}

/** Сгруппированный по дням список истории. Переиспользует строку TransactionRow. */
export const HistoryGroupedList = ({ groups }: HistoryGroupedListProps) => (
  <div className="history-days">
    {groups.map((group) => (
      <section className="history-day" key={group.key}>
        <p className="history-day__label">{group.label}</p>
        <div className="history-day__rows">
          {group.rows.map((row) => (
            <TransactionRow
              key={row.id}
              icon={rowIcon(row)}
              title={row.title}
              source={row.source}
              amount={row.amount}
              amountTone={row.amountTone}
              caption={row.caption}
              time={row.time}
            />
          ))}
        </div>
      </section>
    ))}
  </div>
);
