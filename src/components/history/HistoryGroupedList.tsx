import type { HistoryDayGroup, HistoryRow } from '../../features/history/historyModel';
import { SubwayLineBadge, TicketBadge } from '../ui-kit/TransitBadges';

const RowIcon = ({ row }: { row: HistoryRow }) =>
  row.icon.kind === 'line' ? (
    <SubwayLineBadge type={row.icon.line} className="history-item__badge" />
  ) : (
    <TicketBadge type={row.icon.ticket} className="history-item__badge" />
  );

export interface HistoryGroupedListProps {
  readonly groups: readonly HistoryDayGroup[];
}

/** Сгруппированный по дням список истории. Переиспользуется на разных экранах. */
export const HistoryGroupedList = ({ groups }: HistoryGroupedListProps) => (
  <div className="history-groups">
    {groups.map((group) => (
      <section className="history-group" key={group.key}>
        <p className="history-group__label">{group.label}</p>
        <div className="history-list">
          {group.rows.map((row) => (
            <article className="history-item" key={row.id}>
              <div className="history-item__main">
                <div className="history-item__title">
                  <span className="history-item__icon-box">
                    <RowIcon row={row} />
                  </span>
                  <strong>{row.title}</strong>
                </div>
                <div className="history-item__amount">
                  <p className={`history-item__amount-value history-item__amount-value--${row.amountTone}`}>{row.amount}</p>
                  <small>{row.time}</small>
                </div>
              </div>
              <div className="history-item__details">
                <p>{row.source}</p>
                <small>{row.caption}</small>
              </div>
              {row.warning && <div className="history-item__warning">{row.warning}</div>}
            </article>
          ))}
        </div>
      </section>
    ))}
  </div>
);
