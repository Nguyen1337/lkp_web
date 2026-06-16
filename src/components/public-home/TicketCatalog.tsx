import { useMemo, useState } from 'react';

export type TicketCatalogOption = {
  id: string;
  name: string;
  descr?: string | null;
  price?: number;
  priceDelta?: number;
  isDefault?: boolean;
  isFreezable?: boolean;
  isRecommended?: boolean;
};

export type TicketCatalogTicket = {
  id: string;
  category?: string;
  isFreezable?: boolean;
  isRecommended?: boolean;
  descr?: string | null;
  name: string;
  options?: TicketCatalogOption[];
  paymentTypes?: string[];
  price?: number;
  section?: string;
};

export type TicketCatalogCategory = {
  id: string;
  iconSrc: string;
  iconType?: string;
  subtitle?: string | null;
  tickets: TicketCatalogTicket[];
  title: string;
};

type TicketCatalogProps = {
  categories: TicketCatalogCategory[];
  isCardEntered: boolean;
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value);

const normalizeCategoryType = (value?: string) => value?.trim().toUpperCase() ?? '';

export const TicketCatalog = ({ categories, isCardEntered, selectedTicketId, onSelectTicket }: TicketCatalogProps) => {
  const [enabledOptionIds, setEnabledOptionIds] = useState<Record<string, string[]>>({});

  const selectedTicket = useMemo(() => {
    const allTickets = categories.flatMap((category) => category.tickets);
    return allTickets.find((ticket) => ticket.id === selectedTicketId) ?? allTickets[0] ?? null;
  }, [categories, selectedTicketId]);

  const toggleTicketOption = (ticketId: string, optionId: string) => {
    setEnabledOptionIds((current) => {
      const next = new Set(current[ticketId] ?? []);

      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }

      return {
        ...current,
        [ticketId]: Array.from(next),
      };
    });
  };

  if (!isCardEntered) {
    return <p className="top-up-ticket-empty">Введите номер транспортной карты, чтобы увидеть билеты</p>;
  }

  if (!categories.length) {
    return <p className="top-up-ticket-empty">Для этой карты билеты недоступны</p>;
  }

  return (
    <div className="top-up-ticket-categories" aria-live="polite">
      {categories.map((category) => {
        if (!category.tickets.length) {
          return null;
        }

        const iconKind = normalizeCategoryType(category.iconType);
        const iconClassName =
          iconKind === 'TAT'
            ? 'top-up-ticket-category__icon top-up-ticket-category__icon--tat'
            : iconKind === 'TRAIN'
              ? 'top-up-ticket-category__icon top-up-ticket-category__icon--train'
              : 'top-up-ticket-category__icon top-up-ticket-category__icon--unified';

        return (
          <section className="top-up-ticket-category" key={category.id}>
            <div className="top-up-ticket-category__header">
              <img alt="" aria-hidden="true" className={iconClassName} src={category.iconSrc} />
              <div className="top-up-ticket-category__title">
                <strong>{category.title}</strong>
                {category.subtitle && <span>{category.subtitle}</span>}
              </div>
            </div>

            <div className="top-up-ticket-category__tickets">
              {category.tickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicket?.id;

                return (
                  <div className="top-up-ticket-item" key={ticket.id}>
                    <button
                      aria-pressed={isSelected}
                      className={`top-up-ticket-option${isSelected ? ' top-up-ticket-option--selected' : ''}`}
                      onClick={() => onSelectTicket(ticket.id)}
                      type="button"
                    >
                      <span className="top-up-ticket-option__content">
                        <span className="top-up-ticket-option__title-row">
                          <strong>{ticket.name}</strong>
                          {typeof ticket.price === 'number' && <b>{formatMoney(ticket.price)} ₽</b>}
                        </span>

                        {ticket.descr && <small>{ticket.descr}</small>}

                        {(ticket.category || ticket.section) && (
                          <small>{[ticket.category, ticket.section].filter(Boolean).join(' • ')}</small>
                        )}

                        <span className="top-up-ticket-option__badges">
                          {ticket.isRecommended && <span className="top-up-ticket-badge top-up-ticket-badge--recommended">Рекомендуем</span>}
                          {ticket.isFreezable && <span className="top-up-ticket-badge top-up-ticket-badge--freezable">Можно заморозить</span>}
                        </span>
                      </span>
                    </button>

                    {isSelected && ticket.options?.length ? (
                      <div className="top-up-ticket-option-list">
                        {ticket.options.map((option) => {
                          const enabled = enabledOptionIds[ticket.id]?.includes(option.id) ?? Boolean(option.isDefault);
                          const deltaLabel =
                            typeof option.priceDelta === 'number'
                              ? `${option.priceDelta >= 0 ? '+' : ''}${formatMoney(option.priceDelta)} ₽`
                              : typeof option.price === 'number' && typeof ticket.price === 'number'
                                ? `${option.price >= ticket.price ? '+' : ''}${formatMoney(option.price - ticket.price)} ₽`
                                : null;

                          return (
                            <button
                              aria-pressed={enabled}
                              className={`top-up-ticket-option-row${enabled ? ' top-up-ticket-option-row--enabled' : ''}`}
                              key={option.id}
                              onClick={() => toggleTicketOption(ticket.id, option.id)}
                              type="button"
                            >
                              <span className="top-up-ticket-option-row__content">
                                <strong>{option.name}</strong>
                                {option.descr && <small>{option.descr}</small>}
                                {option.isRecommended && (
                                  <span className="top-up-ticket-badge top-up-ticket-badge--recommended">Рекомендуем</span>
                                )}
                                {option.isFreezable && (
                                  <span className="top-up-ticket-badge top-up-ticket-badge--freezable">Можно заморозить</span>
                                )}
                              </span>

                              <span className="top-up-ticket-option-row__right">
                                {deltaLabel && <b>{deltaLabel}</b>}
                                <span className="top-up-ticket-switch" aria-hidden="true">
                                  <span className="top-up-ticket-switch__thumb" />
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
