import { Component, type ErrorInfo, type ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

/**
 * Глобальный перехватчик ошибок рендера/жизненного цикла.
 * Без него любое необработанное исключение «роняет» дерево React в белый экран —
 * здесь вместо этого показываем восстановимый экран и логируем причину в консоль.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Перехвачена ошибка интерфейса:', error, info.componentStack);
  }

  private readonly handleReload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary__box">
            <h1 className="error-boundary__title">Что-то пошло не так</h1>
            <p className="error-boundary__text">Произошла ошибка на странице. Обновите её, чтобы продолжить.</p>
            <button type="button" className="error-boundary__button" onClick={this.handleReload}>
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
