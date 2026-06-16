import './TransitBadges.css';
import busLineBadge from '../../assets/ui-kit/bus-line-badge.svg';
import paymentVisa from '../../assets/ui-kit/payment-visa.svg';
import paymentMir from '../../assets/ui-kit/payment-mir.svg';
import paymentMastercard from '../../assets/ui-kit/payment-mastercard.svg';
import paymentUnionpay from '../../assets/ui-kit/payment-unionpay.svg';
import paymentBankCard from '../../assets/ui-kit/payment-bank-card.svg';

export type SubwayLineType =
  | 'Default'
  | '1'
  | '2'
  | '3'
  | '4'
  | '4a'
  | '5'
  | '6'
  | '7'
  | '8'
  | '8a'
  | '9'
  | '10'
  | '11'
  | '11a'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D4a'
  | 'D5'
  | 'MDC'
  | 'Bus'
  | 'KM';

export type TicketBadgeType = 'Union' | 'TAT' | 'Bus' | 'Wallet' | 'Unrecorded' | 'Default' | 'Gorod';

export type FreezeStatusType = 'Active' | 'Plan' | 'Possible' | 'Ready' | 'Disable';

export type PaymentSystemType = 'MIR' | 'VISA' | 'MASTERCARD' | 'UNIONPAY' | 'UNKNOWN';

type BadgeProps<T extends string> = {
  type: T;
  className?: string;
};

export const SubwayLineBadge = ({ type, className = '' }: BadgeProps<SubwayLineType>) => (
  <span className={`subway-line-badge subway-line-badge--${type.toLowerCase()} ${className}`} aria-label={`Линия ${type}`}>
    {type === 'Bus' ? <img src={busLineBadge} alt="" aria-hidden="true" /> : type === 'Default' ? '' : type}
  </span>
);

export const TicketBadge = ({ type, className = '' }: BadgeProps<TicketBadgeType>) => {
  const labelByType: Record<TicketBadgeType, string> = {
    Bus: 'A',
    Default: '',
    Gorod: '',
    TAT: 'T',
    Union: 'E',
    Unrecorded: '',
    Wallet: 'P',
  };

  return (
    <span className={`ticket-badge ticket-badge--${type.toLowerCase()} ${className}`} aria-label={type}>
      {labelByType[type]}
    </span>
  );
};

export const FreezeStatusBadge = ({ type, className = '' }: BadgeProps<FreezeStatusType>) => (
  <span className={`freeze-status-badge freeze-status-badge--${type.toLowerCase()} ${className}`} aria-label={type}>
    <span />
  </span>
);

const PAYMENT_SYSTEM_ICONS: Record<PaymentSystemType, string> = {
  MIR: paymentMir,
  VISA: paymentVisa,
  MASTERCARD: paymentMastercard,
  UNIONPAY: paymentUnionpay,
  UNKNOWN: paymentBankCard,
};

const PAYMENT_SYSTEM_ALT: Record<PaymentSystemType, string> = {
  MIR: 'МИР',
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  UNIONPAY: 'UnionPay',
  UNKNOWN: 'Банковская карта',
};

export const PaymentSystemBadge = ({ type, className = '' }: BadgeProps<PaymentSystemType>) => (
  <img
    src={PAYMENT_SYSTEM_ICONS[type]}
    alt={PAYMENT_SYSTEM_ALT[type]}
    className={`payment-system-badge ${className}`}
  />
);
