import ticketCategoryMetroSet from '../../assets/ui-kit/ticket-category-metro-set.svg';
import ticketCategoryTatSet from '../../assets/ui-kit/ticket-category-tat-set.svg';
import ticketCategoryUnifiedSet from '../../assets/ui-kit/ticket-category-unified-set.svg';
import ticketRowTat from '../../assets/ui-kit/ticket-row-tat.svg';
import ticketRowTrain from '../../assets/ui-kit/ticket-row-train.svg';
import ticketRowUnified from '../../assets/ui-kit/ticket-row-unified.svg';

export type TicketCategoryType = 'UNIFIED' | 'TRAIN' | 'TAT';

const CATEGORY_BUNDLE_ICONS: Record<TicketCategoryType, string> = {
  UNIFIED: ticketCategoryUnifiedSet,
  TRAIN: ticketCategoryMetroSet,
  TAT: ticketCategoryTatSet,
};

const ROW_ICONS: Record<TicketCategoryType, string> = {
  UNIFIED: ticketRowUnified,
  TRAIN: ticketRowTrain,
  TAT: ticketRowTat,
};

const normalizeTicketCategoryType = (value?: string): TicketCategoryType => {
  const normalized = value?.trim().toUpperCase();

  if (normalized === 'TRAIN' || normalized === 'TAT') {
    return normalized;
  }

  return 'UNIFIED';
};

const getTicketCategoryRowIcon = (type?: string) => ROW_ICONS[normalizeTicketCategoryType(type)];

const getTicketCategoryBundleIcon = (type?: string) => CATEGORY_BUNDLE_ICONS[normalizeTicketCategoryType(type)];

type TicketRowIconProps = {
  alt?: string;
  className?: string;
  type?: string;
};

export const TicketRowIcon = ({ alt = '', className, type }: TicketRowIconProps) => (
  <img alt={alt} aria-hidden={alt ? undefined : true} className={className} src={getTicketCategoryRowIcon(type)} />
);

type TicketCategoryBundleIconProps = {
  className?: string;
  type?: string;
};

export const TicketCategoryBundleIcon = ({ className, type }: TicketCategoryBundleIconProps) => (
  <img alt="" aria-hidden="true" className={`ticket-category-bundle ${className ?? ''}`.trim()} src={getTicketCategoryBundleIcon(type)} />
);
