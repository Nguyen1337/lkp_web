import { useEffect, useState } from 'react';
import './ChatWidget.css';

type ChatWidgetProps = {
  clientId?: string;
  isAuthenticated?: boolean;
};

type ThreadsWidgetMethod = (payload?: unknown) => void;

type ThreadsWidgetApi = {
  commitHash?: ThreadsWidgetMethod;
  hideChat?: ThreadsWidgetMethod;
  hideInvite?: ThreadsWidgetMethod;
  isDummy?: boolean;
  onHideChat?: ThreadsWidgetMethod;
  onLoad?: ThreadsWidgetMethod;
  onScenarios?: ThreadsWidgetMethod;
  showChat?: ThreadsWidgetMethod;
  version?: ThreadsWidgetMethod;
};

type ChatbotSettings = {
  filename?: string;
  style?: unknown;
  webchat?: Record<string, unknown>;
};

declare global {
  interface Window {
    ThreadsWidget?: ThreadsWidgetApi;
  }
}

const CHATBOT_SCRIPT_ID = 'threads-widget-sdk';
const CHATBOT_SETTINGS_KEY = '__threadsWidget';
const CHAT_CLIENT_ID_KEY = 'clientId';
const CHAT_CLIENT_DATA_KEY = 'clientData';
const CHAT_GUEST_ID_KEY = 'chat_generated_client_id';
const LEGACY_UNAUTHORIZED_COOKIE = 'unauthorizedId';
const CLIENT_ID_MAX_AGE = 15552000;
const WIDGET_READY_TIMEOUT = 12000;
const WIDGET_METHODS = ['hideInvite', 'version', 'commitHash', 'showChat', 'hideChat', 'onHideChat', 'onScenarios', 'onLoad'] as const;

const chatButtonIcon = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16.3799 2.667C18.7465 2.667 20.9776 3.2237 22.9141 4.21C22.4246 4.6946 22.0282 5.2734 21.7549 5.917C20.169 5.1524 18.3436 4.7178 16.3799 4.7178C10.0216 4.7179 5.0986 9.4024 5.0986 14.9062C5.0987 18.2101 6.8028 21.0692 9.5986 23.1025C9.864 23.2955 10.0215 23.6035 10.0215 23.9316V26.627L13.3037 24.9385C13.3973 24.8891 13.4992 24.8545 13.6055 24.8359C13.623 24.8329 13.6406 24.8303 13.6582 24.8281C13.7598 24.8158 13.8619 24.8183 13.9609 24.8359C14.775 24.9714 15.6547 25.0937 16.3799 25.0938C22.7382 25.0938 27.6619 20.4101 27.6621 14.9062C27.6621 14.3469 27.6111 13.7984 27.5176 13.2637C28.2251 13.1502 28.8861 12.899 29.4717 12.5361C29.6297 13.2995 29.7139 14.0915 29.7139 14.9062C29.7137 21.7099 23.6966 27.1455 16.3799 27.1455C15.5883 27.1455 14.7083 27.0326 13.9512 26.9131L9.4648 29.2197C9.1469 29.3832 8.7661 29.3698 8.4609 29.1836C8.1558 28.9973 7.9697 28.6651 7.9697 28.3076V24.4424C4.9868 22.1122 3.047 18.8055 3.0469 14.9062C3.0469 8.1026 9.0632 2.6672 16.3799 2.667Z" fill="#F5F5F5"/><path d="M30.6665 8C30.6665 10.2091 28.8756 12 26.6665 12C24.4574 12 22.6665 10.2091 22.6665 8C22.6665 5.7909 24.4574 4 26.6665 4C28.8756 4 30.6665 5.7909 30.6665 8Z" fill="#F5F5F5"/></svg>`,
)}`;

const getCookie = (name: string) => {
  const encodedName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(encodedName));

  return cookie ? decodeURIComponent(cookie.slice(encodedName.length)) : undefined;
};

const setCookie = (name: string, value: string) => {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${CLIENT_ID_MAX_AGE}; path=/; SameSite=Lax`;
};

const createGuestClientId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `web${crypto.randomUUID().replace(/-/g, '')}`;
  }

  return `web${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

const getGuestClientId = () => {
  const savedClientId = localStorage.getItem(CHAT_GUEST_ID_KEY) || getCookie(LEGACY_UNAUTHORIZED_COOKIE);

  if (savedClientId) {
    localStorage.setItem(CHAT_GUEST_ID_KEY, savedClientId);
    setCookie(LEGACY_UNAUTHORIZED_COOKIE, savedClientId);
    return savedClientId;
  }

  const generatedClientId = createGuestClientId();
  localStorage.setItem(CHAT_GUEST_ID_KEY, generatedClientId);
  setCookie(LEGACY_UNAUTHORIZED_COOKIE, generatedClientId);
  return generatedClientId;
};

const writeClientIdentity = (clientId: string, isAuthenticated: boolean) => {
  const clientData = JSON.stringify({
    auth: isAuthenticated,
    clientId,
    source: 'lkp_web',
  });

  localStorage.setItem(CHAT_CLIENT_ID_KEY, clientId);
  sessionStorage.setItem(CHAT_CLIENT_ID_KEY, clientId);
  localStorage.setItem(CHAT_CLIENT_DATA_KEY, clientData);
  sessionStorage.setItem(CHAT_CLIENT_DATA_KEY, clientData);

  if (!isAuthenticated) {
    localStorage.setItem(CHAT_GUEST_ID_KEY, clientId);
    setCookie(LEGACY_UNAUTHORIZED_COOKIE, clientId);
  }
};

const installThreadsWidgetProxy = () => {
  if (window.ThreadsWidget && !window.ThreadsWidget.isDummy) {
    return;
  }

  const widgetProxy: ThreadsWidgetApi = { isDummy: true };

  WIDGET_METHODS.forEach((method) => {
    widgetProxy[method] = (payload?: unknown) => {
      const intervalId = window.setInterval(() => {
        const widget = window.ThreadsWidget;
        if (widget && !widget.isDummy) {
          window.clearInterval(intervalId);
          widget[method]?.(payload);
        }
      }, 100);
    };
  });

  window.ThreadsWidget = widgetProxy;
};

const getSettingsUrl = () => {
  const configuredUrl = import.meta.env.VITE_CHATBOT_SETTINGS_URL as string | undefined;

  if (configuredUrl) {
    return configuredUrl;
  }

  return import.meta.env.DEV ? '/chatbot/settings.dev.json' : '/chatbot/settings.main.json';
};

const configureChatButtonTheme = (settings: ChatbotSettings) => {
  const webchat = settings.webchat ?? {};
  const theme = (webchat.theme && typeof webchat.theme === 'object' ? webchat.theme : {}) as Record<string, unknown>;
  const desktop = (theme.desktop && typeof theme.desktop === 'object' ? theme.desktop : {}) as Record<string, unknown>;
  const chatButton = (desktop.ChatButton && typeof desktop.ChatButton === 'object' ? desktop.ChatButton : {}) as Record<string, unknown>;

  settings.webchat = {
    ...webchat,
    theme: {
      ...theme,
      desktop: {
        ...desktop,
        ChatButton: {
          ...chatButton,
          backgroundColor: '#DA2032',
          backgroundImage: chatButtonIcon,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '32px 32px',
          borderRadius: '16px',
          boxShadow: '0 12px 28px rgba(218, 32, 50, 0.28)',
          height: '56px',
          width: '56px',
        },
      },
    },
  };
};

const appendWidgetScript = (src: string, abortSignal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(CHATBOT_SCRIPT_ID);

    if (existingScript instanceof HTMLScriptElement && existingScript.src === new URL(src, window.location.href).href) {
      resolve();
      return;
    }

    existingScript?.remove();

    const script = document.createElement('script');
    script.async = true;
    script.id = CHATBOT_SCRIPT_ID;
    script.src = src;
    script.type = 'text/javascript';

    const cleanup = () => {
      script.onload = null;
      script.onerror = null;
    };

    abortSignal.addEventListener(
      'abort',
      () => {
        cleanup();
        script.remove();
        reject(new DOMException('Chat widget loading aborted', 'AbortError'));
      },
      { once: true },
    );

    script.onload = () => {
      cleanup();
      resolve();
    };
    script.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load chat widget bundle: ${src}`));
    };

    document.body.appendChild(script);
  });

const waitForWidgetReady = (abortSignal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (abortSignal.aborted) {
        window.clearInterval(intervalId);
        reject(new DOMException('Chat widget loading aborted', 'AbortError'));
        return;
      }

      if (window.ThreadsWidget && !window.ThreadsWidget.isDummy) {
        window.clearInterval(intervalId);
        resolve();
        return;
      }

      if (Date.now() - startedAt > WIDGET_READY_TIMEOUT) {
        window.clearInterval(intervalId);
        reject(new Error('Chat widget bundle did not initialize in time'));
      }
    }, 100);
  });

const loadThreadsWidget = async (clientId: string, isAuthenticated: boolean, abortSignal: AbortSignal) => {
  writeClientIdentity(clientId, isAuthenticated);
  installThreadsWidgetProxy();

  const settingsResponse = await fetch(`${getSettingsUrl()}?rnd=${Math.random()}`, { signal: abortSignal });
  if (!settingsResponse.ok) {
    throw new Error(`Failed to load chat settings: ${settingsResponse.status}`);
  }

  const settings = (await settingsResponse.json()) as ChatbotSettings;
  const bundleUrl = (import.meta.env.VITE_CHATBOT_BUNDLE_URL as string | undefined) || settings.filename;

  if (!bundleUrl) {
    throw new Error('Chat widget bundle URL is missing');
  }

  settings.filename = bundleUrl;
  settings.webchat = {
    ...(settings.webchat ?? {}),
    filename: bundleUrl,
  };
  if (settings.style && settings.webchat) {
    settings.webchat.style = settings.style;
  }

  configureChatButtonTheme(settings);
  sessionStorage.setItem(CHATBOT_SETTINGS_KEY, JSON.stringify(settings.webchat));

  await appendWidgetScript(bundleUrl, abortSignal);
  await waitForWidgetReady(abortSignal);
  window.ThreadsWidget?.hideInvite?.();
};

const ChatBubbleIcon = () => (
  <svg className="chat-widget__bubble-icon" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16.3799 2.667C18.7465 2.667 20.9776 3.2237 22.9141 4.21C22.4246 4.6946 22.0282 5.2734 21.7549 5.917C20.169 5.1524 18.3436 4.7178 16.3799 4.7178C10.0216 4.7179 5.0986 9.4024 5.0986 14.9062C5.0987 18.2101 6.8028 21.0692 9.5986 23.1025C9.864 23.2955 10.0215 23.6035 10.0215 23.9316V26.627L13.3037 24.9385C13.3973 24.8891 13.4992 24.8545 13.6055 24.8359C13.623 24.8329 13.6406 24.8303 13.6582 24.8281C13.7598 24.8158 13.8619 24.8183 13.9609 24.8359C14.775 24.9714 15.6547 25.0937 16.3799 25.0938C22.7382 25.0938 27.6619 20.4101 27.6621 14.9062C27.6621 14.3469 27.6111 13.7984 27.5176 13.2637C28.2251 13.1502 28.8861 12.899 29.4717 12.5361C29.6297 13.2995 29.7139 14.0915 29.7139 14.9062C29.7137 21.7099 23.6966 27.1455 16.3799 27.1455C15.5883 27.1455 14.7083 27.0326 13.9512 26.9131L9.4648 29.2197C9.1469 29.3832 8.7661 29.3698 8.4609 29.1836C8.1558 28.9973 7.9697 28.6651 7.9697 28.3076V24.4424C4.9868 22.1122 3.047 18.8055 3.0469 14.9062C3.0469 8.1026 9.0632 2.6672 16.3799 2.667Z" fill="#F5F5F5" />
    <path d="M30.6665 8C30.6665 10.2091 28.8756 12 26.6665 12C24.4574 12 22.6665 10.2091 22.6665 8C22.6665 5.7909 24.4574 4 26.6665 4C28.8756 4 30.6665 5.7909 30.6665 8Z" fill="#F5F5F5" />
  </svg>
);

const LoadingIcon = () => <span className="chat-widget__loader" aria-hidden="true" />;

export const ChatWidget = ({ clientId, isAuthenticated = false }: ChatWidgetProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');
  const [retryIndex, setRetryIndex] = useState(0);

  useEffect(() => {
    const effectiveClientId = isAuthenticated ? clientId?.trim() || undefined : getGuestClientId();

    if (!effectiveClientId) {
      return undefined;
    }

    const abortController = new AbortController();
    const loadingTimerId = window.setTimeout(() => {
      if (!abortController.signal.aborted) {
        setStatus('loading');
      }
    }, 0);

    loadThreadsWidget(effectiveClientId, isAuthenticated, abortController.signal)
      .then(() => {
        if (!abortController.signal.aborted) {
          setStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        console.warn('Chat widget is unavailable', error);
        setStatus('fallback');
      });

    return () => {
      window.clearTimeout(loadingTimerId);
      abortController.abort();
    };
  }, [clientId, isAuthenticated, retryIndex]);

  if (status === 'ready') {
    return null;
  }

  return (
    <div className="chat-widget chat-widget--fallback" data-chat-auth={isAuthenticated ? 'auth=true' : 'auth=false'}>
      <button
        className="chat-widget__launcher"
        disabled={status === 'idle' || status === 'loading'}
        onClick={() => {
          if (status === 'fallback') {
            setRetryIndex((currentIndex) => currentIndex + 1);
            return;
          }

          window.ThreadsWidget?.showChat?.();
        }}
        title={status === 'fallback' ? 'Повторить загрузку чата' : 'Чат загружается'}
        type="button"
        aria-label={status === 'fallback' ? 'Повторить загрузку чата' : 'Чат загружается'}
      >
        {status === 'loading' ? <LoadingIcon /> : <ChatBubbleIcon />}
      </button>
    </div>
  );
};
