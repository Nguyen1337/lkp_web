import './TransitBadges.css';

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

export type PaymentSystemType = 'MIR' | 'VISA' | 'MASTERCARD' | 'UNKNOWN';

type BadgeProps<T extends string> = {
  type: T;
  className?: string;
};

export const SubwayLineBadge = ({ type, className = '' }: BadgeProps<SubwayLineType>) => (
  <span className={`subway-line-badge subway-line-badge--${type.toLowerCase()} ${className}`} aria-label={`Линия ${type}`}>
    {type === 'Default' ? '' : type}
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

export const PaymentSystemBadge = ({ type, className = '' }: BadgeProps<PaymentSystemType>) => (
  <span className={`payment-system-badge payment-system-badge--${type.toLowerCase()} ${className}`}>{type === 'UNKNOWN' ? '' : type}</span>
);
