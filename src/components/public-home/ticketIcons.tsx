import ticketCategoryBadge from '../../assets/ui-kit/ticket-category-badge.svg';
import ticketCategoryBus from '../../assets/ui-kit/ticket-category-bus.svg';
import ticketCategoryLabel from '../../assets/ui-kit/ticket-category-label.svg';
import ticketCategoryRiver from '../../assets/ui-kit/ticket-category-river.svg';
import ticketCategoryShape from '../../assets/ui-kit/ticket-category-shape.svg';
import ticketCategoryTatBus from '../../assets/ui-kit/ticket-category-tat-bus.svg';
import ticketCategoryTatElectric from '../../assets/ui-kit/ticket-category-tat-electric.svg';
import ticketCategoryTatTram from '../../assets/ui-kit/ticket-category-tat-tram.svg';
import ticketCategoryTrainMark from '../../assets/ui-kit/ticket-category-train-mark.svg';
import ticketCategoryTrolleybus from '../../assets/ui-kit/ticket-category-trolleybus.svg';
import ticketCategoryTram from '../../assets/ui-kit/ticket-category-tram.svg';
import ticketRowTat from '../../assets/ui-kit/ticket-row-tat.svg';
import ticketRowTrain from '../../assets/ui-kit/ticket-row-train.svg';
import ticketRowUnified from '../../assets/ui-kit/ticket-row-unified.svg';

export type TicketCategoryType = 'UNIFIED' | 'TRAIN' | 'TAT';

type IconSet = {
  categoryIcons: string[];
  rowIcon: string;
};

const TICKET_ICON_SETS: Record<TicketCategoryType, IconSet> = {
  UNIFIED: {
    categoryIcons: [
      ticketCategoryShape,
      ticketCategoryLabel,
      ticketCategoryBus,
      ticketCategoryTrainMark,
      ticketCategoryTrolleybus,
      ticketCategoryTram,
      ticketCategoryRiver,
      ticketCategoryBadge,
    ],
    rowIcon: ticketRowUnified,
  },
  TRAIN: {
    categoryIcons: [ticketCategoryShape, ticketCategoryLabel, ticketCategoryTrainMark],
    rowIcon: ticketRowTrain,
  },
  TAT: {
    categoryIcons: [ticketCategoryTatBus, ticketCategoryTatElectric, ticketCategoryTatTram],
    rowIcon: ticketRowTat,
  },
};

const normalizeTicketCategoryType = (value?: string) => value?.trim().toUpperCase() ?? 'UNIFIED';

const getTicketCategoryRowIcon = (type?: string) => TICKET_ICON_SETS[normalizeTicketCategoryType(type) as TicketCategoryType].rowIcon;

const getTicketCategoryBundleIcons = (type?: string) => TICKET_ICON_SETS[normalizeTicketCategoryType(type) as TicketCategoryType].categoryIcons;

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

export const TicketCategoryBundleIcon = ({ className, type }: TicketCategoryBundleIconProps) => {
  const icons = getTicketCategoryBundleIcons(type);
  const normalizedType = normalizeTicketCategoryType(type).toLowerCase();

  return (
    <div className={`ticket-category-bundle ticket-category-bundle--${normalizedType} ${className ?? ''}`.trim()} aria-hidden="true">
      {icons.map((icon, index) => (
        <img alt="" className="ticket-category-bundle__icon" key={`${icon}-${index}`} src={icon} />
      ))}
    </div>
  );
};
