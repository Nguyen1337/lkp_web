import type { ReactNode } from 'react';
import type { HistoryAmountTone } from '../../features/history/historyModel';
import './TransactionRow.css';

export interface TransactionRowProps {
  /** Бейдж 20px (SubwayLineBadge / TicketBadge). */
  readonly icon: ReactNode;
  readonly title: string;
  readonly source: string;
  readonly amount: string;
  readonly amountTone?: HistoryAmountTone;
  readonly caption: string;
  readonly time: string;
}

/**
 * Строка одной операции/прохода. 1:1 по компоненту Figma «Transactions»:
 * строка 1 — иконка (30px) + название; строки 2–3 со сдвигом 36px:
 * метод оплаты + сумма (16/300) и подпись + время (14/300, secondary).
 */
export const TransactionRow = ({ icon, title, source, amount, amountTone = 'default', caption, time }: TransactionRowProps) => (
  <article className="tx-row">
    <div className="tx-row__head">
      <span className="tx-row__icon">{icon}</span>
      <span className="tx-row__title">{title}</span>
    </div>
    <div className="tx-row__info">
      <div className="tx-row__line">
        <span className="tx-row__source">{source}</span>
        <span className={`tx-row__amount tx-row__amount--${amountTone}`}>{amount}</span>
      </div>
      <div className="tx-row__line">
        <span className="tx-row__caption">{caption}</span>
        <span className="tx-row__time">{time}</span>
      </div>
    </div>
  </article>
);
