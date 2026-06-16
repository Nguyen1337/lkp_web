import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './SideDrawer.css';

export interface SideDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title?: ReactNode;
  /** Ширина панели в пикселях. По умолчанию 460. */
  readonly width?: number;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly className?: string;
}

const ANIMATION_MS = 320;

/**
 * Переиспользуемое боковое модальное окно: выезжает справа налево, затеняет
 * основной экран. Используется для полной истории, детализации карт и т.п.
 */
export const SideDrawer = ({ open, onClose, title, width = 460, children, footer, className }: SideDrawerProps) => {
  const [rendered, setRendered] = useState(open);
  const [active, setActive] = useState(false);

  // Держим панель в DOM, пока она открыта (set-during-render, без setState в эффекте).
  if (open && !rendered) {
    setRendered(true);
  }

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(frame);
    }

    const frame = requestAnimationFrame(() => setActive(false));
    const timer = window.setTimeout(() => setRendered(false), ANIMATION_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!rendered) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [rendered, onClose]);

  if (!rendered) {
    return null;
  }

  return createPortal(
    <div className={`side-drawer${active ? ' side-drawer--active' : ''}${className ? ` ${className}` : ''}`}>
      <button type="button" className="side-drawer__overlay" onClick={onClose} aria-label="Закрыть" tabIndex={-1} />
      <aside className="side-drawer__panel" style={{ width }} role="dialog" aria-modal="true">
        {title !== undefined && (
          <header className="side-drawer__header">
            <h2 className="side-drawer__title">{title}</h2>
            <button type="button" className="side-drawer__close" onClick={onClose} aria-label="Закрыть">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
        )}
        <div className="side-drawer__body">{children}</div>
        {footer && <footer className="side-drawer__footer">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
};
