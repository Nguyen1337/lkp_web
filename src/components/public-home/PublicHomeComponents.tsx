import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import type { OtpStartResponse } from '../../api/apiService';
import accountApple from '../../assets/public-home/account-apple-figma.png';
import accountGoogle from '../../assets/public-home/account-google-figma.svg';
import accountMos from '../../assets/public-home/account-mos-figma.svg';
import accountT from '../../assets/public-home/account-t-figma.svg';
import accountVk from '../../assets/public-home/account-vk-figma.svg';
import accountYa from '../../assets/public-home/account-ya-figma.svg';
import fastPayPattern from '../../assets/public-home/fast-pay-pattern-figma.svg';
import fastPayTariffs from '../../assets/public-home/fast-pay-tariffs-figma.png';
import fastPayTerminal from '../../assets/public-home/fast-pay-terminal-figma.png';
import feedbackCard from '../../assets/public-home/feedback-figma.png';
import iconCloseDark from '../../assets/public-home/icon-close-dark-figma.svg';
import iconClose from '../../assets/public-home/icon-close-figma.svg';
import metroLogo from '../../assets/public-home/metro-logo.svg';
import serviceBike from '../../assets/public-home/service-bike-figma.png';
import serviceDriver from '../../assets/public-home/service-driver-figma.png';
import serviceTaxi from '../../assets/public-home/service-taxi-figma.png';
import storeIcons from '../../assets/public-home/store-icons.png';
import tariffsCard from '../../assets/public-home/tariffs-figma.png';
import terminalsCard from '../../assets/public-home/terminals-figma.png';

const PHONE_DIGITS_LENGTH = 10;

const footerLinks = [
  ['MOS.RU', 'Правительство Москвы'],
  ['MINTRANS.RU', 'Министерство транспорта Российской Федерации'],
  ['DT.MOS.RU', 'Департамент транспорта и развития дорожно-транспортной инфраструктуры'],
  ['MOSGORTRANS.RU', 'Государственное унитарное предприятие Мосгортранс'],
  ['TRANSPORT.MOS.RU', 'Московский Транспорт'],
] as const;

const accountButtons = [
  { icon: accountYa, label: 'Войти через Яндекс' },
  { icon: accountVk, label: 'Войти через VK' },
  { icon: accountMos, label: 'Войти через mos.ru' },
  { icon: accountT, label: 'Войти через T-ID' },
  { icon: accountApple, label: 'Войти через Apple' },
  { icon: accountGoogle, label: 'Войти через Google' },
] as const;

const serviceCards = [
  { image: tariffsCard, title: 'Тарифы и продукты', className: 'service-card--tariffs' },
  { image: terminalsCard, title: 'Терминалы и кассы', className: 'service-card--terminals' },
  { image: feedbackCard, title: 'Обратная связь', className: 'service-card--feedback' },
  { image: null, title: 'Сервисы', className: 'service-card--services' },
] as const;

const fastPaySlides = [
  {
    closeIcon: iconClose,
    image: fastPayTerminal,
    imageClassName: 'fast-pay-banner__terminal',
    text: 'и оплачивайте поездки на городском транспорте',
    title: 'Подключайте систему быстрых платежей',
    variant: 'sbp',
  },
  {
    closeIcon: iconCloseDark,
    image: fastPayTariffs,
    imageClassName: 'fast-pay-banner__tariffs-image',
    text: 'Все для ваших поездок',
    title: 'Тарифы и билеты',
    variant: 'tariffs',
  },
] as const;

const FAST_PAY_AUTOPLAY_DELAY_MS = 5000;
const fastPayCarouselSlides = [fastPaySlides[0], fastPaySlides[1], fastPaySlides[0], fastPaySlides[1]] as const;

type ServiceCard = (typeof serviceCards)[number];

const normalizePhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const withoutCountryCode = digits.length > PHONE_DIGITS_LENGTH && /^[78]/.test(digits) ? digits.slice(1) : digits;

  return withoutCountryCode.slice(0, PHONE_DIGITS_LENGTH);
};

const formatPhoneDigits = (digits: string) => {
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 8);
  const fourth = digits.slice(8, 10);

  if (!digits) {
    return '';
  }

  let result = first ? `(${first}` : '';

  if (first.length === 3) {
    result += ')';
  }

  if (second) {
    result += ` ${second}`;
  }

  if (third) {
    result += ` ${third}`;
  }

  if (fourth) {
    result += ` ${fourth}`;
  }

  return result;
};

const formatPhoneForAuthUsername = (digits: string) => `7${digits}`;

const formatPhoneForDisplay = (digits: string) => `+7 ${formatPhoneDigits(digits)}`;

const formatTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;

  return `${minutes}:${restSeconds.toString().padStart(2, '0')}`;
};

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null && !Array.isArray(value);

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
      const parsedValue = Number(nextValue);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return undefined;
};

const getResponseData = (error: unknown) => {
  if (!isRecord(error) || !isRecord(error.response)) {
    return undefined;
  }

  return error.response.data;
};

const getRetryAfterSeconds = (error: unknown) => {
  const data = getResponseData(error);
  const retryAfterSeconds = readNumber(data, ['retries_in', 'retry_after', 'retryAfter', 'retryAfterSeconds', 'seconds']);

  return retryAfterSeconds && retryAfterSeconds > 0 ? Math.ceil(retryAfterSeconds) : undefined;
};

const getErrorMessage = (error: unknown) => {
  const data = getResponseData(error);

  if (typeof data === 'string') {
    return data;
  }

  if (isRecord(data)) {
    if (typeof data.title === 'string') {
      return data.title;
    }

    if (typeof data.detail === 'string') {
      return data.detail;
    }

    if (typeof data.error_description === 'string' && data.error_description !== 'retry_after') {
      return data.error_description;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Не удалось выполнить запрос. Попробуйте еще раз.';
};

const getRetryAfterMessage = (seconds: number) => `Новый код можно запросить через ${formatTimer(seconds)}`;

type AuthCodeInfo = {
  attemptCount?: number;
  retryAfterSeconds?: number;
  codeLifetimeSeconds?: number;
  codeLength?: number;
};

const createAuthCodeInfo = (response: OtpStartResponse): AuthCodeInfo => ({
  attemptCount: response.password_parameters?.attempt_count,
  codeLength: response.password_parameters?.length,
  codeLifetimeSeconds: response.password_parameters?.expires_in,
  retryAfterSeconds: response.retries_in,
});

type PublicHeaderProps = {
  onLoginClick: () => void;
};

export const PublicHeader = ({ onLoginClick }: PublicHeaderProps) => (
  <header className="public-header">
    <div className="public-header__inner">
      <Link to="/" className="public-logo" aria-label="Московский метрополитен">
        <img src={metroLogo} alt="Московский метрополитен" />
      </Link>
      <button className="public-header__login" onClick={onLoginClick} type="button">
        Войти
      </button>
    </div>
  </header>
);

type LoginEntryCardProps = {
  focusRequest: number;
  onAuthenticated: () => void;
};

type AuthSession = {
  phoneDigits: string;
  authKey: string;
  codeInfo: AuthCodeInfo;
  retryAvailableAt: number;
};

const AUTH_SESSION_STORAGE_KEY = 'public-home.otp-session';

const getRetryCountdown = (session: AuthSession) => Math.max(0, Math.ceil((session.retryAvailableAt - Date.now()) / 1000));

const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;

  return (
    typeof session.phoneDigits === 'string' &&
    typeof session.authKey === 'string' &&
    typeof session.retryAvailableAt === 'number' &&
    typeof session.codeInfo === 'object' &&
    session.codeInfo !== null
  );
};

const readCachedAuthSession = () => {
  try {
    const rawSession = sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    const session: unknown = JSON.parse(rawSession);

    if (!isAuthSession(session) || getRetryCountdown(session) <= 0) {
      sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
};

const saveCachedAuthSession = (session: AuthSession) => {
  sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
};

const clearCachedAuthSession = () => {
  sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
};

export const LoginEntryCard = ({ focusRequest, onAuthenticated }: LoginEntryCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const initialCachedAuthSession = useMemo(() => readCachedAuthSession(), []);
  const [phoneDigits, setPhoneDigits] = useState(initialCachedAuthSession?.phoneDigits ?? '');
  const [showFormatError, setShowFormatError] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [cachedAuthSession, setCachedAuthSession] = useState<AuthSession | null>(initialCachedAuthSession);
  const [authError, setAuthError] = useState('');
  const [isRequestingCode, setIsRequestingCode] = useState(false);

  const isPhoneComplete = phoneDigits.length === PHONE_DIGITS_LENGTH;
  const formattedPhone = useMemo(() => formatPhoneDigits(phoneDigits), [phoneDigits]);

  const updateCachedAuthSession = (session: AuthSession) => {
    setCachedAuthSession(session);
    saveCachedAuthSession(session);
  };

  const updateRetryCooldown = (session: AuthSession, seconds: number) => {
    const nextSession = {
      ...session,
      retryAvailableAt: Date.now() + seconds * 1000,
    };

    updateCachedAuthSession(nextSession);
    setAuthSession(nextSession);

    return nextSession;
  };

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    inputRef.current?.focus();
  }, [focusRequest]);

  useEffect(() => {
    if (!phoneDigits || isPhoneComplete) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setShowFormatError(true);
    }, 3000);

    return () => window.clearTimeout(timerId);
  }, [phoneDigits, isPhoneComplete]);

  useEffect(() => {
    if (!cachedAuthSession) {
      return;
    }

    const remainingSeconds = getRetryCountdown(cachedAuthSession);

    if (remainingSeconds <= 0) {
      clearCachedAuthSession();
      return;
    }

    const timerId = window.setTimeout(() => {
      clearCachedAuthSession();
      setCachedAuthSession((session) => (session === cachedAuthSession ? null : session));
    }, remainingSeconds * 1000);

    return () => window.clearTimeout(timerId);
  }, [cachedAuthSession]);

  const moveCaretToEnd = () => {
    window.requestAnimationFrame(() => {
      const input = inputRef.current;

      if (!input) {
        return;
      }

      input.setSelectionRange(input.value.length, input.value.length);
    });
  };

  const updatePhoneDigits = (digits: string) => {
    setPhoneDigits(digits);
    setShowFormatError(false);
    moveCaretToEnd();
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    updatePhoneDigits(normalizePhoneDigits(event.target.value));
  };

  const handlePhoneKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
      return;
    }

    const input = event.currentTarget;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const digitsBeforeSelection = input.value.slice(0, selectionStart).replace(/\D/g, '').length;
    const digitsBeforeSelectionEnd = input.value.slice(0, selectionEnd).replace(/\D/g, '').length;

    if (selectionStart !== selectionEnd) {
      event.preventDefault();
      updatePhoneDigits(phoneDigits.slice(0, digitsBeforeSelection) + phoneDigits.slice(digitsBeforeSelectionEnd));
      return;
    }

    if (event.key === 'Backspace' && digitsBeforeSelection > 0) {
      event.preventDefault();
      const removeIndex = digitsBeforeSelection - 1;
      updatePhoneDigits(phoneDigits.slice(0, removeIndex) + phoneDigits.slice(removeIndex + 1));
      return;
    }

    if (event.key === 'Delete' && digitsBeforeSelection < phoneDigits.length) {
      event.preventDefault();
      updatePhoneDigits(phoneDigits.slice(0, digitsBeforeSelection) + phoneDigits.slice(digitsBeforeSelection + 1));
    }
  };

  const requestAuthSession = async (digits: string): Promise<AuthSession> => {
    const response = await apiService.requestOtpCode(formatPhoneForAuthUsername(digits));

    if (!response.key) {
      throw new Error('Backend не вернул key для подтверждения кода.');
    }

    return {
      authKey: response.key,
      codeInfo: createAuthCodeInfo(response),
      phoneDigits: digits,
      retryAvailableAt: Date.now() + (response.retries_in || response.password_parameters?.expires_in || 300) * 1000,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isPhoneComplete) {
      inputRef.current?.focus();
      return;
    }

    setIsRequestingCode(true);
    setAuthError('');

    try {
      if (cachedAuthSession?.phoneDigits === phoneDigits && getRetryCountdown(cachedAuthSession) > 0) {
        setAuthSession(cachedAuthSession);
        return;
      }

      const nextSession = await requestAuthSession(phoneDigits);
      updateCachedAuthSession(nextSession);
      setAuthSession(nextSession);
    } catch (error) {
      const retryAfterSeconds = getRetryAfterSeconds(error);

      if (retryAfterSeconds) {
        if (cachedAuthSession?.phoneDigits === phoneDigits) {
          updateRetryCooldown(cachedAuthSession, retryAfterSeconds);
        } else {
          setAuthError(getRetryAfterMessage(retryAfterSeconds));
        }

        return;
      }

      setAuthError(getErrorMessage(error));
    } finally {
      setIsRequestingCode(false);
    }
  };

  return (
    <section className="login-panel" aria-labelledby="public-login-title">
      <form className="login-panel__form" onSubmit={handleSubmit}>
        <h1 id="public-login-title">Войдите в профиль</h1>
        <p className="login-panel__copy">
          Получите доступ к своим транспортным картам, пополнению баланса, сервисам и другим возможностям личного кабинета
        </p>

        <label className={`phone-field${showFormatError ? ' phone-field--error' : ''}`}>
          <span className="sr-only">Номер телефона</span>
          <span className="phone-field__prefix">+7</span>
          <input
            aria-describedby={showFormatError ? 'phone-format-error' : undefined}
            aria-invalid={showFormatError}
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={15}
            onChange={handlePhoneChange}
            onKeyDown={handlePhoneKeyDown}
            placeholder="(999) 999 99 99"
            ref={inputRef}
            type="tel"
            value={formattedPhone}
          />
        </label>

        {showFormatError && (
          <p className="phone-field__error" id="phone-format-error">
            Неверный формат номера
          </p>
        )}

        <button className={`primary-action-button${isRequestingCode ? ' primary-action-button--loading' : ''}`} disabled={!isPhoneComplete || isRequestingCode} type="submit">
          {isRequestingCode && <span className="button-loader" aria-hidden="true" />}
          <span>Войти</span>
          {isRequestingCode && <span className="button-loader-placeholder" aria-hidden="true" />}
        </button>
      </form>

      {authError && <p className="login-panel__error">{authError}</p>}

      <div className="login-divider" />
      <p className="login-panel__helper">или войдите с помощью</p>
      <div className="account-buttons" aria-label="Способы входа">
        {accountButtons.map((button) => (
          <button className="account-button" type="button" aria-label={button.label} key={button.label}>
            <img src={button.icon} alt="" aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="login-policy">
        Продолжая, вы соглашаетесь
        <br />с политикой обработки персональных данных
      </p>

      {authSession && (
        <AuthConfirmationModal
          authKey={authSession.authKey}
          codeInfo={authSession.codeInfo}
          initialCountdown={getRetryCountdown(authSession)}
          onAuthenticated={onAuthenticated}
          onClose={() => setAuthSession(null)}
          onError={setAuthError}
          onRetryCooldown={(seconds) => updateRetryCooldown(authSession, seconds)}
          onResend={async () => {
            const nextSession = await requestAuthSession(authSession.phoneDigits);
            updateCachedAuthSession(nextSession);
            setAuthSession(nextSession);
            return nextSession;
          }}
          phone={formatPhoneForDisplay(authSession.phoneDigits)}
        />
      )}
    </section>
  );
};

type AuthConfirmationModalProps = {
  authKey: string;
  codeInfo: AuthCodeInfo;
  initialCountdown: number;
  onAuthenticated: () => void;
  onClose: () => void;
  onError: (message: string) => void;
  onRetryCooldown: (seconds: number) => AuthSession;
  onResend: () => Promise<AuthSession>;
  phone: string;
};

const AuthConfirmationModal = ({
  authKey,
  codeInfo,
  initialCountdown,
  onAuthenticated,
  onClose,
  onError,
  onResend,
  onRetryCooldown,
  phone,
}: AuthConfirmationModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const codeLength = codeInfo.codeLength || 6;
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(initialCountdown);
  const [modalError, setModalError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isCodeComplete = code.length === codeLength;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [countdown]);

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value.replace(/\D/g, '').slice(0, codeLength));
    setModalError('');
  };

  const handleConfirm = async () => {
    if (!isCodeComplete) {
      inputRef.current?.focus();
      return;
    }

    setIsConfirming(true);
    setModalError('');

    try {
      const tokenResponse = await apiService.confirmOtpCode(authKey, code);
      localStorage.setItem('authToken', tokenResponse.access_token);

      if (tokenResponse.refresh_token) {
        localStorage.setItem('refreshToken', tokenResponse.refresh_token);
      }

      localStorage.setItem('authExpiresAt', String(Date.now() + tokenResponse.expires_in * 1000));
      clearCachedAuthSession();
      onAuthenticated();
    } catch (error) {
      const message = getErrorMessage(error);
      setModalError(message);
      onError(message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setModalError('');

    try {
      const nextSession = await onResend();
      setCode('');
      setCountdown(getRetryCountdown(nextSession));
      inputRef.current?.focus();
    } catch (error) {
      const retryAfterSeconds = getRetryAfterSeconds(error);

      if (retryAfterSeconds) {
        onRetryCooldown(retryAfterSeconds);
        setCountdown(retryAfterSeconds);
        setModalError('');
        inputRef.current?.focus();
        return;
      }

      const message = getErrorMessage(error);
      setModalError(message);
      onError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-code-title">
        <div className="auth-modal__pattern" aria-hidden="true" />
        <button className="auth-modal__close" type="button" aria-label="Закрыть окно подтверждения" onClick={onClose}>
          <img src={iconCloseDark} alt="" aria-hidden="true" />
        </button>

        <div className="auth-modal__content">
          <h2 id="auth-code-title">Код подтверждения</h2>
          <p>Отправили код подтверждения на номер</p>
          <strong>{phone}</strong>

          <button className="auth-code-dots" type="button" onClick={() => inputRef.current?.focus()} aria-label="Ввести код подтверждения">
            {Array.from({ length: codeLength }, (_, index) => (
              <span className={index < code.length ? 'is-filled' : ''} key={index} />
            ))}
          </button>

          <input
            ref={inputRef}
            className="auth-code-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={handleCodeChange}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleConfirm();
              }
            }}
          />

          {modalError && <p className="auth-modal__error">{modalError}</p>}

          <button className="auth-modal__submit" disabled={!isCodeComplete || isConfirming} type="button" onClick={handleConfirm}>
            {isConfirming ? 'Проверяем' : 'Подтвердить'}
          </button>

          <button className="auth-modal__resend" disabled={countdown > 0 || isResending} type="button" onClick={handleResend}>
            {countdown > 0 ? `Новый код (через ${formatTimer(countdown)})` : 'Получить новый код'}
          </button>
        </div>
      </section>
    </div>
  );
};

const ServiceTile = ({ image, title, className }: ServiceCard) => (
  <article className={`service-card ${className}`}>
    {image ? (
      <img className="service-card__image" src={image} alt="" aria-hidden="true" />
    ) : (
      <div className="service-card__services-image" aria-hidden="true">
        <img className="service-card__services-driver" src={serviceDriver} alt="" />
        <img className="service-card__services-bike" src={serviceBike} alt="" />
        <img className="service-card__services-taxi" src={serviceTaxi} alt="" />
      </div>
    )}
    <h2>{title}</h2>
  </article>
);

export const ServicesGrid = () => (
  <section className="services-grid" aria-label="Сервисы">
    {serviceCards.map((card) => (
      <ServiceTile key={card.title} {...card} />
    ))}
  </section>
);

type FastPayBannerProps = {
  onDismiss: () => void;
};

export const FastPayBanner = ({ onDismiss }: FastPayBannerProps) => {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isResettingTrack, setIsResettingTrack] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [autoPlayResetKey, setAutoPlayResetKey] = useState(0);
  const renderedSlides = useMemo(() => [...fastPayCarouselSlides, fastPayCarouselSlides[0]], []);
  const slideCount = fastPayCarouselSlides.length;
  const safeTrackIndex = trackIndex > slideCount ? trackIndex % slideCount : trackIndex;
  const activeSlide = safeTrackIndex % slideCount;
  const activeVariant = fastPayCarouselSlides[activeSlide].variant;

  useEffect(() => {
    if (isClosing || isCarouselPaused || document.hidden) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setTrackIndex((index) => {
        if (document.hidden) {
          return index > slideCount ? index % slideCount : index;
        }

        return index >= slideCount ? 1 : index + 1;
      });
    }, FAST_PAY_AUTOPLAY_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [autoPlayResetKey, isCarouselPaused, isClosing, slideCount, trackIndex]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        return;
      }

      setTrackIndex((index) => (index > slideCount ? index % slideCount : index));
      setAutoPlayResetKey((key) => key + 1);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [slideCount]);

  const handleTrackTransitionEnd = () => {
    if (trackIndex !== slideCount) {
      return;
    }

    setIsResettingTrack(true);
    setTrackIndex(0);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsResettingTrack(false));
    });
  };

  const handleSlideSelect = (index: number) => {
    if (index === activeSlide) {
      return;
    }

    setTrackIndex((currentIndex) => {
      const currentSlide = currentIndex % slideCount;
      return index > currentSlide ? currentIndex + index - currentSlide : currentIndex + slideCount - currentSlide + index;
    });
    setAutoPlayResetKey((key) => key + 1);
  };

  const handleClose = () => {
    setIsClosing(true);

    window.setTimeout(() => {
      onDismiss();
    }, 360);
  };

  return (
    <section
      className={`fast-pay-banner fast-pay-banner--${activeVariant}${isClosing ? ' is-closing' : ''}${
        isResettingTrack ? ' is-resetting' : ''
      }`}
      aria-label="Карусель баннеров"
      onMouseEnter={() => setIsCarouselPaused(true)}
      onMouseLeave={() => setIsCarouselPaused(false)}
    >
      <div
        className="fast-pay-banner__track"
        onTransitionEnd={handleTrackTransitionEnd}
        style={{ transform: `translateX(-${safeTrackIndex * 100}%)` }}
      >
        {renderedSlides.map((slide, index) => (
          <article className={`fast-pay-banner__slide fast-pay-banner__slide--${slide.variant}`} key={`${slide.variant}-${index}`}>
            {slide.variant === 'sbp' && <img className="fast-pay-banner__pattern" src={fastPayPattern} alt="" aria-hidden="true" />}
            <img className={slide.imageClassName} src={slide.image} alt="" aria-hidden="true" />
            <div className="fast-pay-banner__content">
              <div>
                <h2>{slide.title}</h2>
                <p>{slide.text}</p>
              </div>
              <button className="fast-pay-banner__close" type="button" aria-label="Скрыть баннер" onClick={handleClose}>
                <img src={slide.closeIcon} alt="" aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="fast-pay-banner__dots" aria-label="Выбор баннера">
        {fastPayCarouselSlides.map((item, index) => (
          <button
            aria-current={activeSlide === index}
            aria-label={`Показать баннер ${index + 1}: ${item.title}`}
            className={activeSlide === index ? 'is-active' : ''}
            key={`${item.variant}-${index}`}
            onClick={() => handleSlideSelect(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
};

type MockFieldProps = {
  label: string;
  value: string;
  icon?: 'card' | 'payment';
  suffix?: string;
  selectable?: boolean;
};

const MockField = ({ label, value, icon, suffix, selectable = false }: MockFieldProps) => (
  <label className="field">
    <span>{label}</span>
    <span className={`mock-input${selectable ? ' mock-input--select' : ''}`}>
      {icon && <span className={`field-icon field-icon--${icon}`} />}
      <span>{value}</span>
      {suffix && <span className="rub">{suffix}</span>}
      {selectable && <span className="chevron" aria-hidden="true" />}
    </span>
  </label>
);

export const TopUpBalanceCard = () => (
  <section className="top-up-panel" aria-labelledby="top-up-title">
    <h2 id="top-up-title">Пополнить баланс</h2>

    <div className="top-up-tabs" role="tablist" aria-label="Тип пополнения">
      <button className="top-up-tabs__tab top-up-tabs__tab--active" type="button">
        Кошелек
      </button>
      <button className="top-up-tabs__tab" type="button">
        Билеты
      </button>
    </div>

    <form className="top-up-form">
      <MockField label="Номер транспортной карты" value="1234 567 890" icon="card" selectable />
      <MockField label="Сумма пополнения" value="0" suffix="₽" />
      <MockField label="Способ оплаты" value="Выберите способ оплаты" icon="payment" selectable />
      <MockField label="Направить чек" value="example@mail.ru" />

      <button className="primary-disabled-button top-up-submit" type="button">
        Пополнить
      </button>
    </form>
  </section>
);

export const PublicFooter = () => (
  <footer className="public-footer">
    <div className="public-footer__inner">
      <div className="public-footer__legal">
        <p className="copyright">
          ГУП «Московский метрополитен»
          <br />
          1935 - 2025 ©
        </p>
        <p className="legal-title">Правовая информация</p>
        <p>
          Посещая сайт <a href="https://www.mosmetro.ru">www.mosmetro.ru</a> Вы даете согласие на обработку файлов cookie, сбор которых
          осуществляется ГУП «Московский метрополитен» на условиях{' '}
          <a href="https://www.mosmetro.ru">Политики обработки файлов cookie</a>. Метрополитен также может использовать указанные данные для их
          последующей обработки системами Яндекс.Метрика и др., которая осуществляется с целью функционирования сайта{' '}
          <a href="https://www.mosmetro.ru">www.mosmetro.ru</a>.
        </p>
      </div>

      <nav className="public-footer__links" aria-label="Ссылки организаций">
        {footerLinks.map(([title, text]) => (
          <a href="https://www.mosmetro.ru" key={title}>
            <strong>{title}</strong>
            <span>{text}</span>
          </a>
        ))}
        <img className="store-icons" src={storeIcons} alt="App Store, Google Play, RuStore, Huawei AppGallery" />
      </nav>
    </div>
  </footer>
);
