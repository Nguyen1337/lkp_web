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
  productIconUrl?: string;
  isFreezable?: boolean;
  isRecommended?: boolean;
  descr?: string | null;
  name: string;
  options?: TicketCatalogOption[];
  paymentTypes?: string[];
  price?: number;
  section?: string;
};

export type TicketCatalogSection = {
  id: string;
  title?: string;
  iconUrls: string[];
  tickets: TicketCatalogTicket[];
};

export type TicketCatalogCategory = {
  id: string;
  iconUrls: string[];
  subtitle?: string | null;
  sections: TicketCatalogSection[];
  title: string;
};

type TicketCatalogProps = {
  categories: TicketCatalogCategory[];
  isCardEntered: boolean;
  isLoading?: boolean;
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value);

const getOptionDelta = (ticketPrice: number | undefined, option: TicketCatalogOption) => {
  if (typeof option.priceDelta === 'number') {
    return Math.abs(option.priceDelta);
  }

  if (typeof option.price === 'number' && typeof ticketPrice === 'number') {
    return Math.abs(option.price - ticketPrice);
  }

  return 0;
};

export const TicketCatalog = ({ categories, isCardEntered, isLoading = false, selectedTicketId, onSelectTicket }: TicketCatalogProps) => {
  const [enabledOptionIds, setEnabledOptionIds] = useState<Record<string, string[]>>({});

  const selectedTicket = useMemo(() => {
    const allTickets = categories.flatMap((cat) => cat.sections.flatMap((s) => s.tickets));
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

  if (isLoading) {
    return <p className="top-up-ticket-empty">Загружаем доступные билеты...</p>;
  }

  if (!categories.length) {
    return <p className="top-up-ticket-empty">Для этой карты билеты недоступны</p>;
  }

  return (
    <div className="top-up-ticket-categories" aria-live="polite">
      {categories.map((category) => {
        const hasTickets = category.sections.some((s) => s.tickets.length > 0);
        if (!hasTickets) return null;

        return (
          <section className="top-up-ticket-category" key={category.id}>
            <div className="top-up-ticket-category__header">
              <div className="top-up-ticket-category__title">
                <strong>{category.title}</strong>
                {category.subtitle && <span>{category.subtitle}</span>}
              </div>
              {category.iconUrls.length > 0 && (
                <div className="top-up-ticket-category__bundle" aria-hidden="true">
                  {category.iconUrls.map((url) => (
                    <img key={url} src={url} alt="" />
                  ))}
                </div>
              )}
            </div>

            {category.sections.map((section) => {
              if (!section.tickets.length) return null;
              return (
                <div className="top-up-ticket-section" key={section.id}>
                  {section.title && (
                    <div className="top-up-ticket-section__header">
                      {section.iconUrls.length > 0 && (
                        <div className="top-up-ticket-section__icons" aria-hidden="true">
                          {section.iconUrls.map((url) => (
                            <img key={url} src={url} alt="" />
                          ))}
                        </div>
                      )}
                      <span className="top-up-ticket-section__title">{section.title}</span>
                    </div>
                  )}
                  <div className="top-up-ticket-category__tickets">
                    {section.tickets.map((ticket) => {
                      const isSelected = ticket.id === selectedTicket?.id;
                      const enabledOptionIdsForTicket = enabledOptionIds[ticket.id] ?? [];
                      const selectedOptions =
                        ticket.options?.filter((option) => enabledOptionIdsForTicket.includes(option.id) || Boolean(option.isDefault)) ?? [];
                      const selectedOptionsDelta = selectedOptions.reduce((sum, option) => sum + getOptionDelta(ticket.price, option), 0);
                      const ticketTotalPrice = typeof ticket.price === 'number' ? ticket.price + selectedOptionsDelta : undefined;

                      return (
                        <div className="top-up-ticket-item" key={ticket.id}>
                          <button
                            aria-pressed={isSelected}
                            className={`top-up-ticket-option${isSelected ? ' top-up-ticket-option--selected' : ''}`}
                            onClick={() => onSelectTicket(ticket.id)}
                            type="button"
                          >
                            {ticket.productIconUrl && <img className="top-up-ticket-option__icon" src={ticket.productIconUrl} alt="" aria-hidden="true" />}
                            <span className="top-up-ticket-option__content">
                              <span className="top-up-ticket-option__title-row">
                                <strong>{ticket.name}</strong>
                                {typeof ticketTotalPrice === 'number' && <b>{formatMoney(ticketTotalPrice)} ₽</b>}
                              </span>

                              {ticket.descr && <small>{ticket.descr}</small>}

                              <span className="top-up-ticket-option__badges">
                                {ticket.isRecommended && <span className="top-up-ticket-badge top-up-ticket-badge--recommended">Рекомендуем</span>}
                                {ticket.isFreezable && <span className="top-up-ticket-badge top-up-ticket-badge--freezable">Можно заморозить</span>}
                              </span>
                            </span>
                          </button>

                          {isSelected && ticket.options?.length ? (
                            <div className="top-up-ticket-option-list">
                              {ticket.options.map((option) => {
                                const enabled = enabledOptionIdsForTicket.includes(option.id) || Boolean(option.isDefault);
                                const deltaValue = getOptionDelta(ticket.price, option);
                                const deltaLabel = deltaValue > 0 ? `+${formatMoney(deltaValue)} ₽` : null;

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
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
};
