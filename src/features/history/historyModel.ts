import type { SubwayLineType, TicketBadgeType } from '../../components/ui-kit/TransitBadges';

/**
 * Доменная модель «Истории» личного кабинета.
 *
 * Источники данных — две ручки backend:
 *   - GET  /trips/v1.0      → проходы (вкладка «Проходы»)
 *   - POST /operations/v1.0 → финансовые операции (вкладки «Покупки» и «Операции»)
 *
 * Вкладки «Покупки» и «Операции» наполняются из ОДНОГО источника (operations) и
 * различаются классификатором {@link classifyOperation}. Точные значения `type`
 * нужно сверить со Swagger — сейчас классификация эвристическая и собрана в одном
 * месте, чтобы её можно было поправить одной правкой. См. AGENTS.md → Журнал решений.
 */

export type HistoryTab = 'trips' | 'purchases' | 'operations';

export type HistoryIcon =
  | { readonly kind: 'line'; readonly line: SubwayLineType }
  | { readonly kind: 'ticket'; readonly ticket: TicketBadgeType };

export type HistoryAmountTone = 'default' | 'success' | 'error';

export interface HistoryRow {
  readonly id: string;
  readonly tab: HistoryTab;
  readonly title: string;
  readonly source: string;
  readonly caption: string;
  readonly amount: string;
  readonly amountTone: HistoryAmountTone;
  readonly time: string;
  /** Метка времени в миллисекундах. */
  readonly timestamp: number;
  readonly icon: HistoryIcon;
  readonly paymentMethodId?: string;
  readonly warning?: string;
}

export interface HistoryDayGroup {
  readonly key: string;
  readonly label: string;
  readonly rows: readonly HistoryRow[];
}

export type HistoryPeriodId = 'month' | 'twoWeeks' | 'week' | 'threeDays' | 'custom';

export interface HistoryFilterState {
  readonly paymentMethodIds: readonly string[];
  readonly period: HistoryPeriodId | null;
  readonly customFrom?: number;
  readonly customTo?: number;
}

export const EMPTY_FILTERS: HistoryFilterState = {
  paymentMethodIds: [],
  period: null,
};

/* ------------------------------------------------------------------ */
/* Безопасные парсеры неизвестного JSON                                */
/* ------------------------------------------------------------------ */

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unwrapData = (value: unknown): unknown => (isRecord(value) && 'data' in value ? value.data : value);

const readRecord = (value: unknown, key: string): JsonRecord | null => {
  if (!isRecord(value)) {
    return null;
  }
  const next = value[key];
  return isRecord(next) ? next : null;
};

const readArray = (value: unknown, key: string): readonly unknown[] => {
  if (!isRecord(value)) {
    return [];
  }
  const next = value[key];
  return Array.isArray(next) ? next : [];
};

const readString = (value: unknown, keys: readonly string[]): string | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  for (const key of keys) {
    const next = value[key];
    if (typeof next === 'string' && next.trim()) {
      return next.trim();
    }
  }
  return undefined;
};

const readNumber = (value: unknown, keys: readonly string[]): number | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  for (const key of keys) {
    const next = value[key];
    if (typeof next === 'number' && Number.isFinite(next)) {
      return next;
    }
    if (typeof next === 'string') {
      const parsed = Number(next.replace(',', '.'));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
};

const findStringDeep = (value: unknown, keys: readonly string[], depth = 0): string | undefined => {
  if (depth > 4 || !isRecord(value)) {
    return undefined;
  }
  const direct = readString(value, keys);
  if (direct) {
    return direct;
  }
  for (const next of Object.values(value)) {
    if (isRecord(next)) {
      const nested = findStringDeep(next, keys, depth + 1);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
};

const findNumberDeep = (value: unknown, keys: readonly string[], depth = 0): number | undefined => {
  if (depth > 4 || !isRecord(value)) {
    return undefined;
  }
  const direct = readNumber(value, keys);
  if (direct !== undefined) {
    return direct;
  }
  for (const next of Object.values(value)) {
    if (isRecord(next)) {
      const nested = findNumberDeep(next, keys, depth + 1);
      if (nested !== undefined) {
        return nested;
      }
    }
  }
  return undefined;
};

/* ------------------------------------------------------------------ */
/* Форматирование                                                     */
/* ------------------------------------------------------------------ */

const MONEY_FORMAT = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const TIME_FORMAT = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const WEEKDAY_FORMAT = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const DAY_MONTH_FORMAT = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

const toMillis = (raw: number | undefined): number => {
  if (!raw) {
    return 0;
  }
  return raw > 10_000_000_000 ? raw : raw * 1000;
};

const formatMoney = (value: number | undefined, fallback: string, sign?: 'plus' | 'minus'): string => {
  if (value === undefined) {
    return fallback;
  }
  const prefix = sign === 'plus' ? '+ ' : sign === 'minus' ? '- ' : '';
  return `${prefix}${MONEY_FORMAT.format(Math.abs(value))} ₽`;
};

const formatTime = (millis: number): string => (millis ? TIME_FORMAT.format(new Date(millis)) : '');

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const shortWeekday = (date: Date): string => WEEKDAY_FORMAT.format(date).replace('.', '').slice(0, 2).toLowerCase();

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Заголовок дня: «Сегодня, пт» для сегодняшней даты, иначе «8 июля, ср».
 * День недели — две буквы в нижнем регистре (пн, вт, ср, чт, пт, сб, вс).
 */
export const formatDayLabel = (millis: number, now: number = Date.now()): string => {
  const date = new Date(millis);
  const weekday = shortWeekday(date);
  if (isSameDay(date, new Date(now))) {
    return `Сегодня, ${weekday}`;
  }
  return `${DAY_MONTH_FORMAT.format(date)}, ${weekday}`;
};

/* ------------------------------------------------------------------ */
/* Нормализация типов транспорта                                      */
/* ------------------------------------------------------------------ */

const SUBWAY_LINES = new Set<SubwayLineType>([
  'Default', '1', '2', '3', '4', '4a', '5', '6', '7', '8', '8a', '9', '10', '11', '11a',
  '12', '13', '14', '15', '16', 'D1', 'D2', 'D3', 'D4', 'D4a', 'D5', 'MDC', 'Bus', 'KM',
]);

const normalizeLineType = (value: string | undefined): SubwayLineType => {
  if (!value) {
    return 'Default';
  }
  const cleaned = value.toUpperCase().replace('Д', 'D').replace(/\s/g, '') as SubwayLineType;
  return SUBWAY_LINES.has(cleaned) ? cleaned : 'Default';
};

const readPaymentMethodId = (item: unknown): string | undefined =>
  findStringDeep(item, ['linkedCardId', 'cardId', 'linkedBankCardId', 'paymentMethodId', 'pan', 'cardNumber']);

/* ------------------------------------------------------------------ */
/* Нормализация рядов                                                 */
/* ------------------------------------------------------------------ */

const getTripAmount = (item: unknown): number | undefined =>
  findNumberDeep(readRecord(item, 'bankCardTripDetails'), ['amount']) ??
  findNumberDeep(readRecord(item, 'sbpTripDetails'), ['amount']) ??
  findNumberDeep(readRecord(item, 'operation'), ['sum']) ??
  findNumberDeep(item, ['amount', 'fare', 'price', 'sum']);

export const normalizeTrips = (value: unknown): HistoryRow[] =>
  readArray(unwrapData(value), 'items').map((item, index): HistoryRow => {
    const timestamp = toMillis(findNumberDeep(item, ['date', 'createdAt', 'operationDate']));
    const line = findStringDeep(item, ['lineNumber', 'line', 'routeNumber']);
    const title = readString(item, ['displayName']) ?? 'Поездка';
    const isBus = /автобус|электробус/i.test(title);
    const source =
      readString(readRecord(item, 'card'), ['displayName', 'cardNumber']) ??
      readString(readRecord(item, 'bankCard'), ['displayName', 'maskedPan']) ??
      'Платежное средство';

    return {
      id: findStringDeep(item, ['id', 'tripId', 'receiptId']) ?? `trip-${index}`,
      tab: 'trips',
      title,
      source,
      caption: 'Проход',
      amount: formatMoney(getTripAmount(item), '-', 'minus'),
      amountTone: 'default',
      time: formatTime(timestamp),
      timestamp,
      icon: { kind: 'line', line: isBus ? 'Bus' : normalizeLineType(line) },
      ...(readPaymentMethodId(item) ? { paymentMethodId: readPaymentMethodId(item) } : {}),
    };
  });

/**
 * Классификатор: к какой вкладке отнести операцию — «Покупки» или «Операции».
 *
 * Эвристика (уточнить по Swagger): пополнения кошелька, платежи и ошибки оплаты —
 * это «Операции»; всё остальное (покупка билетов/тарифов/продуктов) — «Покупки».
 */
export const classifyOperation = (item: unknown): Extract<HistoryTab, 'purchases' | 'operations'> => {
  const type = (readString(item, ['type', 'operationType', 'category']) ?? '').toLowerCase();
  const title = (findStringDeep(item, ['displayName', 'title', 'name']) ?? '').toLowerCase();
  const status = (findStringDeep(item, ['status']) ?? '').toLowerCase();

  const isTopUp = ['vtpayment', 'payment', 'topup', 'replenish', 'deposit'].some((t) => type.includes(t));
  const looksLikeTopUp = /пополн|платеж/i.test(title); // «пополн», «платеж»
  if (status === 'failure' || isTopUp || looksLikeTopUp) {
    return 'operations';
  }
  return 'purchases';
};

export const normalizeOperations = (value: unknown): HistoryRow[] =>
  readArray(unwrapData(value), 'items').map((item, index): HistoryRow => {
    const timestamp = toMillis(findNumberDeep(item, ['date', 'createdAt', 'operationDate']));
    const status = (findStringDeep(item, ['status']) ?? '').toLowerCase();
    const tab = classifyOperation(item);
    const isFailure = status === 'failure';
    const isTopUp = tab === 'operations' && !isFailure;
    const amountTone: HistoryAmountTone = isFailure ? 'error' : isTopUp ? 'success' : 'default';
    const title = findStringDeep(item, ['displayName', 'title', 'name']) ??
      (tab === 'purchases' ? 'Покупка' : 'Операция');
    const caption = isFailure
      ? 'Ошибка оплаты'
      : tab === 'purchases'
        ? 'Покупка'
        : 'Платеж';

    return {
      id: findStringDeep(item, ['id', 'operationId']) ?? `operation-${index}`,
      tab,
      title: capitalize(title),
      source: readString(readRecord(item, 'card'), ['displayName', 'cardNumber']) ?? 'Платежное средство',
      caption,
      amount: formatMoney(
        findNumberDeep(item, ['amount', 'sum', 'price', 'total', 'totalAmount']),
        '-',
        isTopUp ? 'plus' : 'minus',
      ),
      amountTone,
      time: formatTime(timestamp),
      timestamp,
      icon: { kind: 'ticket', ticket: isTopUp ? 'Wallet' : 'Union' },
      ...(readPaymentMethodId(item) ? { paymentMethodId: readPaymentMethodId(item) } : {}),
      ...(isFailure ? { warning: 'Ошибка оплаты' } : {}),
    };
  });

/* ------------------------------------------------------------------ */
/* Период и фильтрация                                                */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

export const getPeriodStart = (period: HistoryPeriodId | null, now: number = Date.now()): number | undefined => {
  switch (period) {
    case 'month':
      return now - 30 * DAY_MS;
    case 'twoWeeks':
      return now - 14 * DAY_MS;
    case 'week':
      return now - 7 * DAY_MS;
    case 'threeDays':
      return now - 3 * DAY_MS;
    default:
      return undefined;
  }
};

export const filterRows = (
  rows: readonly HistoryRow[],
  tab: HistoryTab,
  filters: HistoryFilterState,
  now: number = Date.now(),
): HistoryRow[] => {
  const from = filters.period === 'custom' ? filters.customFrom : getPeriodStart(filters.period, now);
  const to = filters.period === 'custom' ? filters.customTo : undefined;
  const methodIds = filters.paymentMethodIds;

  return rows.filter((row) => {
    if (row.tab !== tab) {
      return false;
    }
    if (from !== undefined && row.timestamp && row.timestamp < from) {
      return false;
    }
    if (to !== undefined && row.timestamp && row.timestamp > to) {
      return false;
    }
    if (methodIds.length > 0 && (!row.paymentMethodId || !methodIds.includes(row.paymentMethodId))) {
      return false;
    }
    return true;
  });
};

/** Группировка рядов по дням (по убыванию даты). */
export const groupByDay = (rows: readonly HistoryRow[], now: number = Date.now()): HistoryDayGroup[] => {
  const sorted = [...rows].sort((a, b) => b.timestamp - a.timestamp);
  const groups = new Map<string, HistoryRow[]>();

  for (const row of sorted) {
    const key = row.timestamp ? dayKey(new Date(row.timestamp)) : 'unknown';
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  return [...groups.entries()].map(([key, groupRows]) => ({
    key,
    label: groupRows[0]?.timestamp ? formatDayLabel(groupRows[0].timestamp, now) : '',
    rows: groupRows,
  }));
};

export const isHistoryFilterActive = (filters: HistoryFilterState): boolean =>
  filters.paymentMethodIds.length > 0 || filters.period !== null;
