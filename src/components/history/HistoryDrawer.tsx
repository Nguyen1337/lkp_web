import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../api/apiService';
import {
  EMPTY_FILTERS,
  filterRows,
  groupByDay,
  isHistoryFilterActive,
  normalizeOperations,
  normalizeTrips,
  type HistoryFilterState,
  type HistoryRow,
  type HistoryTab,
} from '../../features/history/historyModel';
import { SegmentedTabs, type SegmentedTabOption } from '../ui-kit/SegmentedTabs';
import { SideDrawer } from '../ui-kit/SideDrawer';
import { HistoryFilters, type HistoryFilterMethod } from './HistoryFilters';
import { HistoryGroupedList } from './HistoryGroupedList';
import './HistoryDrawer.css';

const TABS: readonly SegmentedTabOption<HistoryTab>[] = [
  { id: 'trips', label: 'Проходы' },
  { id: 'purchases', label: 'Покупки' },
  { id: 'operations', label: 'Операции' },
];

const HISTORY_PAGE_SIZE = 50;

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

const EMPTY_LABEL: Record<HistoryTab, string> = {
  trips: 'Проходов пока нет',
  purchases: 'Покупок пока нет',
  operations: 'Операций пока нет',
};

export interface HistoryDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly paymentMethods?: readonly HistoryFilterMethod[];
}

/** Полная история пользователя: выезжающая панель с вкладками и фильтрами. */
export const HistoryDrawer = ({ open, onClose, paymentMethods = [] }: HistoryDrawerProps) => {
  const [rows, setRows] = useState<readonly HistoryRow[]>([]);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [tab, setTab] = useState<HistoryTab>('trips');
  const [filters, setFilters] = useState<HistoryFilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Сброс в состояние загрузки при открытии (set-during-render, без setState в эффекте).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStatus('loading');
      setRows([]);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    void Promise.allSettled([
      apiService.getTrips(HISTORY_PAGE_SIZE),
      apiService.getOperations(HISTORY_PAGE_SIZE),
    ]).then(([tripsResult, operationsResult]) => {
      if (!active) {
        return;
      }

      const trips = tripsResult.status === 'fulfilled' ? normalizeTrips(tripsResult.value) : [];
      const operations = operationsResult.status === 'fulfilled' ? normalizeOperations(operationsResult.value) : [];
      const anyOk = tripsResult.status === 'fulfilled' || operationsResult.status === 'fulfilled';

      setRows([...trips, ...operations]);
      setStatus(anyOk ? 'ready' : 'error');
    });

    return () => {
      active = false;
    };
  }, [open]);

  const groups = useMemo(() => groupByDay(filterRows(rows, tab, filters)), [rows, tab, filters]);
  const filterActive = isHistoryFilterActive(filters);

  return (
    <SideDrawer open={open} onClose={onClose} title="История" width={704} className="history-drawer-shell">
      <div className="history-drawer">
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} className="history-drawer__tabs" />

        <div className="history-drawer__toolbar">
          <button
            type="button"
            className={`history-drawer__filter${filterActive ? ' history-drawer__filter--active' : ''}`}
            onClick={() => setFiltersOpen(true)}
          >
            <span>Фильтры</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 5h14M5.5 10h9M8 15h4" />
            </svg>
          </button>
        </div>

        <div className="history-drawer__content">
          {status === 'loading' && <p className="history-drawer__state">Загружаем историю…</p>}
          {status === 'error' && <p className="history-drawer__state">Не удалось загрузить историю</p>}
          {status === 'ready' && groups.length === 0 && <p className="history-drawer__state">{EMPTY_LABEL[tab]}</p>}
          {groups.length > 0 && <HistoryGroupedList groups={groups} />}
        </div>
      </div>

      <HistoryFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        methods={paymentMethods}
        value={filters}
        onApply={setFilters}
      />
    </SideDrawer>
  );
};
