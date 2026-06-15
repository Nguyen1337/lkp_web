import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { EMPTY_FILTERS, type HistoryFilterState, type HistoryPeriodId } from '../../features/history/historyModel';
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

/** Модальное окно фильтров истории (платёжные средства + период). */
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

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const toggleMethod = (id: string) => {
    setDraft((prev) => {
      const selected = prev.paymentMethodIds.includes(id);
      return {
        ...prev,
        paymentMethodIds: selected
          ? prev.paymentMethodIds.filter((item) => item !== id)
          : [...prev.paymentMethodIds, id],
      };
    });
  };

  const selectPeriod = (period: HistoryPeriodId) => {
    setDraft((prev) => ({ ...prev, period: prev.period === period ? null : period }));
  };

  const isDirty = draft.paymentMethodIds.length > 0 || draft.period !== null;

  return createPortal(
    <div className="filters-modal">
      <button type="button" className="filters-modal__overlay" onClick={onClose} aria-label="Закрыть" tabIndex={-1} />
      <div className="filters-modal__card" role="dialog" aria-modal="true" aria-label="Фильтры">
        <header className="filters-modal__header">
          <h2 className="filters-modal__title">Фильтры</h2>
          <button type="button" className="filters-modal__close" onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="filters-modal__body">
          <section className="filters-section">
            <h3 className="filters-section__title">Платежные средства</h3>
            <div className="filters-methods">
              {methods.length === 0 && <p className="filters-empty">Нет доступных платёжных средств</p>}
              {methods.map((method) => {
                const checked = draft.paymentMethodIds.includes(method.id);
                return (
                  <label className="filters-method" key={method.id}>
                    <span className="filters-method__icon" aria-hidden="true">
                      {method.icon}
                    </span>
                    <span className="filters-method__text">
                      <span className="filters-method__title">{method.title}</span>
                      {method.subtitle && <span className="filters-method__subtitle">{method.subtitle}</span>}
                    </span>
                    <input
                      type="checkbox"
                      className="filters-method__checkbox"
                      checked={checked}
                      onChange={() => toggleMethod(method.id)}
                    />
                    <span className={`filters-checkbox${checked ? ' filters-checkbox--on' : ''}`} aria-hidden="true">
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
                <svg viewBox="0 0 24 24" aria-hidden="true" className="filters-chip__caret">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </section>
        </div>

        <footer className="filters-modal__footer">
          <button
            type="button"
            className="filters-modal__apply"
            disabled={!isDirty}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Применить
          </button>
          <button
            type="button"
            className="filters-modal__clear"
            disabled={!isDirty}
            onClick={() => setDraft(EMPTY_FILTERS)}
          >
            Очистить
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
};
