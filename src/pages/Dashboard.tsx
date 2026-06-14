import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../api/apiService';
import type { DashboardBootstrapResponse } from '../api/apiService';
import cardSbpActive from '../assets/authorized-home/card-sbp-active.svg';
import cardSbpBlocked from '../assets/authorized-home/card-sbp-blocked.svg';
import cardSocialActive from '../assets/authorized-home/card-social-active.png';
import cardSocialBlocked from '../assets/authorized-home/card-social-blocked.png';
import cardTroikaActive from '../assets/authorized-home/card-troika-active.png';
import cardTroikaBlocked from '../assets/authorized-home/card-troika-blocked.png';
import cardVtActive from '../assets/authorized-home/card-vt-active.png';
import cardVtBlocked from '../assets/authorized-home/card-vt-blocked.png';
import feedbackCard from '../assets/public-home/feedback-figma.png';
import metroLogo from '../assets/public-home/metro-logo.svg';
import serviceBike from '../assets/public-home/service-bike-figma.png';
import serviceDriver from '../assets/public-home/service-driver-figma.png';
import serviceTaxi from '../assets/public-home/service-taxi-figma.png';
import tariffsCard from '../assets/public-home/tariffs-figma.png';
import terminalsCard from '../assets/public-home/terminals-figma.png';
import { ChatWidget } from '../components/chat/ChatWidget';
import { FastPayBanner, PublicFooter, TopUpBalanceCard } from '../components/public-home/PublicHomeComponents';
import { PaymentSystemBadge, SubwayLineBadge, TicketBadge } from '../components/ui-kit/TransitBadges';
import type { PaymentSystemType, SubwayLineType, TicketBadgeType } from '../components/ui-kit/TransitBadges';
import './PublicHome.css';
import './Dashboard.css';

type JsonRecord = Record<string, unknown>;

type PaymentCardType = 'troika' | 'virtual-troika' | 'sbp' | 'bank' | 'social' | 'virtual-social';
type PaymentSeverity = 'active' | 'warning' | 'blocker';

type PaymentMethodDetail = {
  id: string;
  label: string;
  value?: string;
  ticketType: TicketBadgeType;
};

type PaymentMethodView = {
  id: string;
  title: string;
  primary: string;
  secondary: string;
  details?: PaymentMethodDetail[];
  meta?: string;
  type: PaymentCardType;
  ticketType?: TicketBadgeType;
  paymentSystem?: PaymentSystemType;
  statusText: string;
  severity: PaymentSeverity;
  warning?: string;
  blocked: boolean;
  visualImage?: string;
};

type HistoryItemView = {
  id: string;
  title: string;
  source: string;
  action: string;
  amount: string;
  amountTone: 'default' | 'success' | 'error';
  time: string;
  iconType: 'line' | 'ticket' | 'bus';
  lineType: SubwayLineType;
  ticketType: TicketBadgeType;
  timestamp: number;
  warning?: string;
};

const serviceCards = [
  { image: tariffsCard, title: 'Тарифы\nи продукты', className: 'authorized-service--tariffs' },
  { image: terminalsCard, title: 'Терминалы\nи кассы', className: 'authorized-service--terminals' },
  { image: feedbackCard, title: 'Обратная связь', className: 'authorized-service--feedback' },
] as const;

const subwayLineTypes = new Set<SubwayLineType>([
  'Default',
  '1',
  '2',
  '3',
  '4',
  '4a',
  '5',
  '6',
  '7',
  '8',
  '8a',
  '9',
  '10',
  '11',
  '11a',
  '12',
  '13',
  '14',
  '15',
  '16',
  'D1',
  'D2',
  'D3',
  'D4',
  'D4a',
  'D5',
  'MDC',
  'Bus',
  'KM',
]);

const paymentCardVisuals: Partial<Record<PaymentCardType, { active: string; blocked: string }>> = {
  sbp: { active: cardSbpActive, blocked: cardSbpBlocked },
  social: { active: cardSocialActive, blocked: cardSocialBlocked },
  troika: { active: cardTroikaActive, blocked: cardTroikaBlocked },
  'virtual-social': { active: cardSocialActive, blocked: cardSocialBlocked },
  'virtual-troika': { active: cardVtActive, blocked: cardVtBlocked },
};

const getPaymentCardVisual = (type: PaymentCardType, blocked: boolean) => {
  const visual = paymentCardVisuals[type];
  return visual ? (blocked ? visual.blocked : visual.active) : undefined;
};

const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null && !Array.isArray(value);

const unwrapData = (value: unknown): unknown => (isRecord(value) && 'data' in value ? value.data : value);

const readRecord = (value: unknown, key: string): JsonRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const nextValue = value[key];
  return isRecord(nextValue) ? nextValue : null;
};

const readArray = (value: unknown, key: string): unknown[] => {
  if (!isRecord(value)) {
    return [];
  }

  const nextValue = value[key];
  return Array.isArray(nextValue) ? nextValue : [];
};

const readArrayByKeys = (value: unknown, keys: string[]): unknown[] => {
  if (!isRecord(value)) {
    return [];
  }

  for (const key of keys) {
    const nextValue = value[key];
    if (Array.isArray(nextValue)) {
      return nextValue;
    }
  }

  return [];
};

const readString = (value: unknown, keys: string[]) => {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const nextValue = value[key];
    if (typeof nextValue === 'string' && nextValue.trim()) {
      return nextValue.trim();
    }
  }

  return undefined;
};

const readBoolean = (value: unknown, keys: string[]) => {
  if (!isRecord(value)) {
    return false;
  }

  return keys.some((key) => value[key] === true);
};

const readNumber = (value: unknown, keys: string[]) => {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const nextValue = value[key];
    if (typeof nextValue === 'number' && Number.isFinite(nextValue)) {
      return nextValue;
    }
    if (typeof nextValue === 'string') {
      const parsed = Number(nextValue.replace(',', '.'));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const findStringDeep = (value: unknown, keys: string[], depth = 0): string | undefined => {
  if (depth > 4 || !isRecord(value)) {
    return undefined;
  }

  const direct = readString(value, keys);
  if (direct) {
    return direct;
  }

  for (const nextValue of Object.values(value)) {
    if (isRecord(nextValue)) {
      const nested = findStringDeep(nextValue, keys, depth + 1);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
};

const findNumberDeep = (value: unknown, keys: string[], depth = 0): number | undefined => {
  if (depth > 4 || !isRecord(value)) {
    return undefined;
  }

  const direct = readNumber(value, keys);
  if (direct !== undefined) {
    return direct;
  }

  for (const nextValue of Object.values(value)) {
    if (isRecord(nextValue)) {
      const nested = findNumberDeep(nextValue, keys, depth + 1);
      if (nested !== undefined) {
        return nested;
      }
    }
  }

  return undefined;
};

const formatMoney = (value: number | undefined, fallback: string, sign?: 'plus' | 'minus') => {
  if (value === undefined) {
    return fallback;
  }

  const prefix = sign === 'plus' ? '+ ' : sign === 'minus' ? '- ' : '';
  return `${prefix}${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Math.abs(value))} ₽`;
};

const formatPhone = (phone?: string) => {
  if (!phone) {
    return '+7';
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }

  return phone;
};

const formatTimestamp = (timestamp: number | undefined) => {
  if (!timestamp) {
    return '';
  }

  const normalized = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(normalized));
};

const formatDate = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = value > 10_000_000_000 ? value : value * 1000;
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(new Date(normalized));
  }

  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const trimmed = value.trim();
  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(new Date(parsed));
  }

  return trimmed;
};

const normalizeLineType = (value?: string): SubwayLineType => {
  if (!value) {
    return 'Default';
  }

  const cleaned = value.toUpperCase().replace('Д', 'D').replace(/\s/g, '') as SubwayLineType;
  return subwayLineTypes.has(cleaned) ? cleaned : 'Default';
};

const normalizePaymentSystem = (value?: string): PaymentSystemType => {
  const normalized = value?.toUpperCase().replace(/[\s_-]/g, '');
  if (normalized === 'MIR' || normalized === 'VISA' || normalized === 'MASTERCARD') {
    return normalized;
  }
  if (normalized === 'UNIONPAY') {
    return 'UNIONPAY';
  }
  return 'UNKNOWN';
};

const formatBankCardMask = (value?: string) => {
  const digits = value?.replace(/\D/g, '') ?? '';
  const lastDigits = digits.slice(-4);

  return lastDigits ? `•••• ${lastDigits}` : '••••';
};

const normalizeSbpStatus = (state?: string) => {
  switch (state) {
    case 'ACTIVE':
      return { blocked: false, severity: 'active' as const, statusText: 'Активна', warning: undefined };
    case 'IN_PROGRESS':
      return { blocked: false, severity: 'warning' as const, statusText: 'Подключается', warning: 'Статус подписки уточняется' };
    case 'FAILED':
      return { blocked: true, severity: 'blocker' as const, statusText: 'Ошибка', warning: 'Не удалось оформить подписку' };
    case 'CANCELLED':
      return { blocked: true, severity: 'blocker' as const, statusText: 'Отключена', warning: 'СБП отключена' };
    case 'NONE':
      return { blocked: true, severity: 'blocker' as const, statusText: 'Отключена', warning: 'СБП отключена' };
    default:
      return { blocked: false, severity: 'warning' as const, statusText: 'Уточняется', warning: 'Статус подписки уточняется' };
  }
};

const getCardState = (item: unknown, card: unknown) => {
  const status = readString(item, ['status']) ?? readString(card, ['status']);
  const blocked =
    readBoolean(item, ['blocked', 'isBlocked', 'limited']) ||
    readBoolean(card, ['blocked', 'isBlocked', 'limited']) ||
    ['blocked', 'annulled', 'expired', 'stopList'].includes(status ?? '');
  const debtAmount = findNumberDeep(item, ['debtAmount', 'debts']);
  const hasUnrecordedTopUps =
    readArrayByKeys(item, ['deferredActions', 'unloadedWalletToken', 'unrecordedTopUps', 'unrecordedReplenishments', 'pendingTopUps']).length > 0;

  if (debtAmount && debtAmount > 0) {
    return { blocked: true, severity: 'blocker' as const, statusText: 'Задолженность', warning: 'Задолженности' };
  }
  if (blocked) {
    return { blocked: true, severity: 'blocker' as const, statusText: 'Заблокирована', warning: 'Карта заблокирована' };
  }
  if (hasUnrecordedTopUps) {
    return { blocked: false, severity: 'warning' as const, statusText: 'Активна', warning: 'Имеются незаписанные пополнения' };
  }
  if (status === 'pending' || status === 'waiting') {
    return { blocked: false, severity: 'warning' as const, statusText: 'Ожидается', warning: 'Ожидается привязка' };
  }

  return { blocked: false, severity: 'active' as const, statusText: 'Активна', warning: undefined };
};

const getCardsPayload = (bootstrap: DashboardBootstrapResponse | null) => unwrapData(bootstrap?.carriers);

const getCardWalletBalance = (item: unknown, balance: unknown) =>
  formatMoney(findNumberDeep(balance ?? item, ['balance', 'amount', 'walletBalance', 'walletAmount', 'value']), 'Баланс уточняется');

const readDateValue = (value: unknown, keys: string[]) => {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const nextValue = value[key];
    if ((typeof nextValue === 'string' && nextValue.trim()) || (typeof nextValue === 'number' && Number.isFinite(nextValue))) {
      return nextValue;
    }
  }

  return undefined;
};

const getTicketBadgeType = (ticket: unknown): TicketBadgeType => {
  const type = (readString(ticket, ['type', 'ticketType', 'carrierType', 'kind']) ?? '').toLowerCase();
  const name = (findStringDeep(ticket, ['displayName', 'name', 'title', 'ticketName', 'productName', 'tariffName']) ?? '').toLowerCase();
  const combined = `${type} ${name}`;

  if (combined.includes('тат') || combined.includes('tat')) {
    return 'TAT';
  }
  if (combined.includes('автоб') || combined.includes('bus')) {
    return 'Bus';
  }
  if (combined.includes('кошел') || combined.includes('wallet')) {
    return 'Wallet';
  }

  return 'Union';
};

const normalizeCardDetails = (item: unknown, balance: unknown): PaymentMethodDetail[] => {
  const walletBalance = getCardWalletBalance(item, balance);
  const details: PaymentMethodDetail[] = [
    {
      id: 'wallet',
      label: 'Кошелек',
      ticketType: 'Wallet',
      value: walletBalance,
    },
  ];
  const tickets = readArrayByKeys(item, ['tickets', 'activeTickets', 'products']);

  tickets.forEach((ticket, index) => {
    const label =
      findStringDeep(ticket, ['displayName', 'name', 'title', 'ticketName', 'productName', 'tariffName', 'typeName']) ?? `Билет ${index + 1}`;
    const expiresAt = readDateValue(ticket, ['validTo', 'validUntil', 'expireDate', 'expiredDate', 'expirationDate', 'endDate', 'to', 'validityEndDate']);
    const date = formatDate(expiresAt);

    details.push({
      id: findStringDeep(ticket, ['id', 'ticketId', 'productId']) ?? `ticket-${index}`,
      label,
      ticketType: getTicketBadgeType(ticket),
      value: date ? `до ${date}` : undefined,
    });
  });

  return details;
};

const normalizePaymentMethods = (bootstrap: DashboardBootstrapResponse | null): PaymentMethodView[] => {
  if (!bootstrap) {
    return [];
  }

  const cardsPayload = getCardsPayload(bootstrap);
  const cards = readArray(cardsPayload, 'cards');
  const bankCards = readArray(cardsPayload, 'bankCards');
  const methods: PaymentMethodView[] = [];

  cards.forEach((item, index) => {
    const card = readRecord(item, 'card') ?? item;
    const balance = readRecord(item, 'balance');
    const virtualCardInfo = readRecord(item, 'virtualCardInfo');
    const cardType = readString(card, ['cardType', 'type']);
    const isSocial = cardType?.toLowerCase().includes('social');
    const state = getCardState(item, card);
    const type: PaymentCardType = isSocial ? (virtualCardInfo ? 'virtual-social' : 'social') : virtualCardInfo ? 'virtual-troika' : 'troika';

    methods.push({
      ...state,
      id: readString(card, ['linkedCardId', 'id', 'externalId']) ?? `transport-${index}`,
      details: normalizeCardDetails(item, balance),
      primary: getCardWalletBalance(item, balance),
      secondary: 'Кошелек',
      ticketType: virtualCardInfo ? 'Wallet' : 'Union',
      title: readString(card, ['displayName', 'name', 'title']) ?? (virtualCardInfo ? 'Виртуальная «Тройка»' : 'Моя «Тройка»'),
      type,
      visualImage: getPaymentCardVisual(type, state.blocked),
    });
  });

  bankCards.forEach((item, index) => {
    const state = getCardState(item, item);
    methods.push({
      ...state,
      id: readString(item, ['linkedBankCardId', 'externalLinkedBankCardId', 'id']) ?? `bank-${index}`,
      meta: readString(item, ['expiredDate', 'expirationDate']),
      paymentSystem: normalizePaymentSystem(readString(item, ['type', 'cardType'])),
      primary: formatBankCardMask(readString(item, ['maskedPan', 'pan', 'number', 'displayName'])),
      secondary: 'Банковская карта',
      title: 'Банковская карта',
      type: 'bank',
    });
  });

  const sbpPayload = unwrapData(bootstrap.sbpSubscription);
  const sbpStatus = readString(sbpPayload, ['state']);
  const sbpState = normalizeSbpStatus(sbpStatus);
  if (bootstrap.sbpSubscription && sbpStatus !== 'NONE') {
    methods.push({
      ...sbpState,
      id: 'sbp-subscription',
      primary: sbpState.statusText,
      secondary: 'Оплата по СБП',
      title: 'Подписка СБП',
      type: 'sbp',
      visualImage: getPaymentCardVisual('sbp', sbpState.blocked),
    });
  }

  return methods;
};

const getTripAmount = (item: unknown) =>
  findNumberDeep(readRecord(item, 'bankCardTripDetails'), ['amount']) ??
  findNumberDeep(readRecord(item, 'sbpTripDetails'), ['amount']) ??
  findNumberDeep(readRecord(item, 'operation'), ['sum']) ??
  findNumberDeep(item, ['amount', 'fare', 'price', 'sum']);

const normalizeTrips = (value: unknown): HistoryItemView[] => {
  const payload = unwrapData(value);
  return readArray(payload, 'items').map((item, index) => {
    const timestamp = findNumberDeep(item, ['date', 'createdAt', 'operationDate']) ?? 0;
    const line = findStringDeep(item, ['lineNumber', 'line', 'routeNumber']);
    const transportCard = readRecord(item, 'card');
    const bankCard = readRecord(item, 'bankCard');
    const title = readString(item, ['displayName']) ?? 'Поездка';
    const isBus = title.toLowerCase().includes('автобус') || title.toLowerCase().includes('электробус');

    return {
      id: findStringDeep(item, ['id', 'tripId', 'receiptId']) ?? `trip-${index}`,
      action: 'Проход',
      amount: formatMoney(getTripAmount(item), '-', 'minus'),
      amountTone: 'default',
      iconType: isBus ? 'bus' : 'line',
      lineType: isBus ? 'Bus' : normalizeLineType(line),
      source: readString(transportCard, ['displayName', 'cardNumber']) ?? readString(bankCard, ['displayName', 'maskedPan']) ?? 'Платежное средство',
      ticketType: 'Union',
      time: formatTimestamp(timestamp),
      timestamp,
      title,
    };
  });
};

const normalizeOperations = (value: unknown): HistoryItemView[] => {
  const payload = unwrapData(value);
  return readArray(payload, 'items').map((item, index) => {
    const timestamp = findNumberDeep(item, ['date', 'createdAt', 'operationDate']) ?? 0;
    const status = findStringDeep(item, ['status']);
    const type = readString(item, ['type']);
    const card = readRecord(item, 'card');
    const isTopUp = type === 'vtPayment' || type === 'payment';
    const amountTone = status === 'failure' ? 'error' : isTopUp ? 'success' : 'default';

    return {
      id: findStringDeep(item, ['id', 'operationId']) ?? `operation-${index}`,
      action: status === 'failure' ? 'Ошибка оплаты' : isTopUp ? 'Пополнение билета «Кошелек»' : 'Операция',
      amount: formatMoney(findNumberDeep(item, ['amount', 'sum', 'price', 'total', 'totalAmount']), '-', isTopUp ? 'plus' : 'minus'),
      amountTone,
      iconType: 'ticket',
      lineType: 'Default',
      source: readString(card, ['displayName', 'cardNumber']) ?? 'Платежное средство',
      ticketType: isTopUp ? 'Wallet' : 'Union',
      time: formatTimestamp(timestamp),
      timestamp,
      title: findStringDeep(item, ['displayName', 'title', 'name']) ?? 'Операция',
      warning: status === 'failure' ? 'Ошибка оплаты' : undefined,
    };
  });
};

const normalizeHistory = (bootstrap: DashboardBootstrapResponse | null) => {
  if (!bootstrap) {
    return [];
  }

  return [...normalizeTrips(bootstrap.trips), ...normalizeOperations(bootstrap.operations)]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);
};

const getDisplayPhone = (bootstrap: DashboardBootstrapResponse | null) => {
  const accountInfo = unwrapData(bootstrap?.accountInfo);
  const phone = readString(accountInfo, ['phone', 'userName', 'username']);
  return formatPhone(phone);
};

const PaymentMethodCard = ({ method }: { method: PaymentMethodView }) => (
  <article className={`payment-card payment-card--${method.type} payment-card--${method.severity}`}>
    {method.type === 'bank' ? (
      <div className="payment-card__bank-content">
        <div>
          <p>{method.title}</p>
          <strong>{method.primary}</strong>
        </div>
        <PaymentSystemBadge type={method.paymentSystem ?? 'UNKNOWN'} className="payment-card__bank-system" />
      </div>
    ) : (
      <>
        <div className="payment-card__content">
          <div>
            <p>{method.title}</p>
            <strong>{method.primary}</strong>
          </div>
          <div className={`payment-card__visual${method.visualImage ? ' payment-card__visual--with-image' : ''}`} aria-hidden="true">
            {method.visualImage && <img src={method.visualImage} alt="" />}
            <span>{method.blocked ? 'Заблокирована' : method.statusText}</span>
          </div>
        </div>
        <div className="payment-card__details">
          {(method.details?.length
            ? method.details
            : [
                {
                  id: 'default',
                  label: method.secondary,
                  ticketType: method.ticketType ?? 'Union',
                  value: method.meta,
                },
              ]).map((detail) => (
            <div className="payment-card__row" key={detail.id}>
              <TicketBadge type={detail.ticketType} />
              <span>{detail.label}</span>
              {detail.value && <span className="payment-card__meta">{detail.value}</span>}
            </div>
          ))}
        </div>
      </>
    )}
    {method.warning && <div className={`payment-card__warning payment-card__warning--${method.severity}`}>{method.warning}</div>}
  </article>
);

const EmptyPaymentMethods = () => (
  <div className="payment-methods-empty">
    <span className="payment-methods-empty__icon" aria-hidden="true" />
    <span>Новый метод оплаты</span>
  </div>
);

const HistoryIcon = ({ item }: { item: HistoryItemView }) => {
  if (item.iconType === 'ticket') {
    return <TicketBadge type={item.ticketType} className="history-item__badge" />;
  }

  return <SubwayLineBadge type={item.lineType} className="history-item__badge" />;
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [bootstrap, setBootstrap] = useState<DashboardBootstrapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFastPayVisible, setIsFastPayVisible] = useState(true);

  useEffect(() => {
    let isMounted = true;

    apiService
      .getDashboardBootstrap()
      .then((response) => {
        if (isMounted) {
          setBootstrap(response);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const paymentMethods = useMemo(() => normalizePaymentMethods(bootstrap), [bootstrap]);
  const historyItems = useMemo(() => normalizeHistory(bootstrap), [bootstrap]);
  const displayPhone = useMemo(() => getDisplayPhone(bootstrap), [bootstrap]);

  const handleLogout = () => {
    void apiService.logout().finally(() => {
      navigate('/');
      window.location.reload();
    });
  };

  return (
    <div className="authorized-home">
      <header className="authorized-header">
        <div className="authorized-header__inner">
          <Link to="/" className="authorized-logo" aria-label="Московский метрополитен">
            <img src={metroLogo} alt="Московский метрополитен" />
          </Link>
          <div className="authorized-header__actions">
            <button className="authorized-profile-button" type="button">
              <svg className="authorized-profile-button__icon" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="7.5" r="3" />
                <path d="M4.75 16.25c.78-2.7 2.67-4.05 5.25-4.05s4.47 1.35 5.25 4.05" />
              </svg>
              <span>{displayPhone}</span>
            </button>
            <button className="authorized-logout-button" type="button" onClick={handleLogout} aria-label="Выйти">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" />
                <path d="M13 8l4 4-4 4" />
                <path d="M17 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="authorized-main">
        <div className="authorized-grid">
          <section className="payment-methods-panel" aria-labelledby="payment-methods-title">
            <div className="authorized-panel__header">
              <h1 id="payment-methods-title">Платежные средства</h1>
              <button type="button" aria-label="Дополнительные действия">...</button>
            </div>

            <div className="payment-methods-list" aria-busy={isLoading}>
              {isLoading && <p className="authorized-empty-state">Загружаем платежные средства...</p>}
              {!isLoading && paymentMethods.length === 0 && <EmptyPaymentMethods />}
              {paymentMethods.map((method) => (
                <PaymentMethodCard method={method} key={method.id} />
              ))}
            </div>

            <button className="authorized-red-button" type="button">
              Добавить платежное средство
            </button>
          </section>

          <div className="authorized-content">
            <section className="authorized-services" aria-label="Разделы личного кабинета">
              {serviceCards.map((card) => (
                <article className={`authorized-service-card ${card.className}`} key={card.title}>
                  <img src={card.image} alt="" aria-hidden="true" />
                  <h2>{card.title}</h2>
                </article>
              ))}
              <article className="authorized-service-card authorized-service--stacked">
                <div className="authorized-service-stack" aria-hidden="true">
                  <img src={serviceDriver} alt="" />
                  <img src={serviceBike} alt="" />
                  <img src={serviceTaxi} alt="" />
                </div>
                <h2>Сервисы</h2>
              </article>
            </section>

            {isFastPayVisible && <FastPayBanner onDismiss={() => setIsFastPayVisible(false)} />}

            <TopUpBalanceCard />

            <section className="history-panel" aria-labelledby="history-title">
              <div className="history-panel__title">
                <h2 id="history-title">Последние операции</h2>
                <span aria-hidden="true" />
              </div>
              <p className="history-panel__date">Сегодня</p>
              <div className="history-list" aria-busy={isLoading}>
                {isLoading && <p className="authorized-empty-state">Загружаем поездки и операции...</p>}
                {!isLoading && historyItems.length === 0 && <p className="authorized-empty-state">История появится после первых поездок и операций.</p>}
                {historyItems.map((item) => (
                  <article className="history-item" key={item.id}>
                    <div className="history-item__main">
                      <div className="history-item__title">
                        <span className="history-item__icon-box">
                          <HistoryIcon item={item} />
                        </span>
                        <strong>{item.title}</strong>
                      </div>
                      <div className="history-item__amount">
                        <p className={`history-item__amount-value history-item__amount-value--${item.amountTone}`}>{item.amount}</p>
                        <small>{item.time}</small>
                      </div>
                    </div>
                    <div className="history-item__details">
                      <p>{item.source}</p>
                      <small>{item.action}</small>
                    </div>
                    {item.warning && <div className="history-item__warning">{item.warning}</div>}
                  </article>
                ))}
              </div>
              <button className="history-panel__all" type="button">
                Смотреть все
              </button>
            </section>
          </div>
        </div>

        <ChatWidget isAuthenticated />
      </main>

      <PublicFooter />
    </div>
  );
};
