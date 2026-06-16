import { useState, type ReactNode } from 'react';
import { EMPTY_FILTERS, type HistoryFilterState, type HistoryPeriodId } from '../../features/history/historyModel';
import { SideDrawer } from '../ui-kit/SideDrawer';
import './HistoryFilters.css';

export interface HistoryFilterMethod {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: ReactNode;
}

export interface HistoryFiltersProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly methods: readonly HistoryFilterMethod[];
  readonly value: HistoryFilterState;
  readonly onApply: (next: HistoryFilterState) => void;
}

const PERIOD_OPTIONS: ReadonlyArray<{ id: HistoryPeriodId; label: string }> = [
  { id: 'month', label: 'Месяц' },
  { id: 'twoWeeks', label: 'Две недели' },
  { id: 'week', label: 'Неделя' },
  { id: 'threeDays', label: '3 дня' },
];

/** Боковой сайдшит фильтров истории (платёжные средства + период). 1:1 по макету. */
export const HistoryFilters = ({ open, onClose, methods, value, onApply }: HistoryFiltersProps) => {
  const [draft, setDraft] = useState<HistoryFilterState>(value);
  const [wasOpen, setWasOpen] = useState(open);

  // Сброс черновика при открытии (set-during-render, без setState в эффекте).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(value);
    }
  }

  const isDirty = draft.paymentMethodIds.length > 0 || draft.period !== null;

  const toggleMethod = (id: string) =>
    setDraft((prev) => ({
      ...prev,
      paymentMethodIds: prev.paymentMethodIds.includes(id)
        ? prev.paymentMethodIds.filter((item) => item !== id)
        : [...prev.paymentMethodIds, id],
    }));

  const selectPeriod = (period: HistoryPeriodId) =>
    setDraft((prev) => ({ ...prev, period: prev.period === period ? null : period }));

  const footer = (
    <div className="filters-actions">
      <button
        type="button"
        className="filters-actions__apply"
        disabled={!isDirty}
        onClick={() => {
          onApply(draft);
          onClose();
        }}
      >
        Применить
      </button>
      <button type="button" className="filters-actions__clear" disabled={!isDirty} onClick={() => setDraft(EMPTY_FILTERS)}>
        Очистить
      </button>
    </div>
  );

  return (
    <SideDrawer open={open} onClose={onClose} title="Фильтры" width={704} className="filters-drawer" footer={footer}>
      <div className="filters">
        <section className="filters-section">
          <h3 className="filters-section__title">Платежные средства</h3>
          <div className="filters-methods">
            {methods.length === 0 && <p className="filters-empty">Нет доступных платёжных средств</p>}
            {methods.map((method) => {
              const checked = draft.paymentMethodIds.includes(method.id);
              return (
                <label className="filter-card" key={method.id}>
                  <span className="filter-card__icon" aria-hidden="true">
                    {method.icon}
                  </span>
                  <span className="filter-card__text">
                    <span className="filter-card__title">{method.title}</span>
                    {method.subtitle && <span className="filter-card__subtitle">{method.subtitle}</span>}
                  </span>
                  <input
                    type="checkbox"
                    className="filter-card__input"
                    checked={checked}
                    onChange={() => toggleMethod(method.id)}
                  />
                  <span className={`filter-card__check${checked ? ' filter-card__check--on' : ''}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="filters-section">
          <h3 className="filters-section__title">Период</h3>
          <div className="filters-chips">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`filters-chip${draft.period === option.id ? ' filters-chip--active' : ''}`}
                onClick={() => selectPeriod(option.id)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className={`filters-chip filters-chip--select${draft.period === 'custom' ? ' filters-chip--active' : ''}`}
              onClick={() => setDraft((prev) => ({ ...prev, period: prev.period === 'custom' ? null : 'custom' }))}
            >
              Выбрать период
              <svg viewBox="0 0 24 24" className="filters-chip__caret" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </section>
      </div>
    </SideDrawer>
  );
};
