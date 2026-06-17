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
  isLkpWrapped?: boolean;
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
const CHAT_OPEN_STORAGE_KEY = '__threadsWidget_chatOpen';
const LEGACY_UNAUTHORIZED_COOKIE = 'unauthorizedId';
const CLIENT_ID_MAX_AGE = 15552000;
const WIDGET_READY_TIMEOUT = 12000;
const CHAT_COMPATIBILITY_STYLE_ID = 'lkp-chatbot-compatibility-style';
const CHAT_BUTTON_ICON_URL = '/chatbot/button-help.svg';
const SDK_INVITE_TEXT_MARKERS = [
  '\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c \u0432 \u043d\u0430\u0448 \u0447\u0430\u0442',
  '\u0437\u0430\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0432\u0430\u0448\u0438 \u0432\u043e\u043f\u0440\u043e\u0441\u044b',
] as const;
const CHAT_ALIGNMENT_SELECTORS = ['.authorized-grid', '.public-main__grid', '.history-panel'] as const;
const WIDGET_METHODS = ['hideInvite', 'version', 'commitHash', 'showChat', 'hideChat', 'onHideChat', 'onScenarios', 'onLoad'] as const;
const STARTER_QUICK_REPLIES = [
  'Как пополнить «Тройку»?',
  'Как оплатить проезд по МЦК?',
  'В трамвай пустят с котом?',
  'Когда в метро наступает час пик?',
  'Где в метро зарядить телефон?',
] as const;

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

const getObject = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

const getCurrentTimeLabel = () =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

const configureChatTheme = (settings: ChatbotSettings) => {
  const webchat = settings.webchat ?? {};
  const theme = getObject(webchat.theme);
  const desktop = getObject(theme.desktop);

  settings.webchat = {
    ...webchat,
    chatHeader: {
      ...getObject(webchat.chatHeader),
      title: 'Быстрый ответ',
    },
    enableVoiceMessages: true,
    hideWelcome: false,
    lkpStarterQuickReplies: STARTER_QUICK_REPLIES,
    theme: {
      ...theme,
      desktop: {
        ...desktop,
        AttachmentButton: {
          ...getObject(desktop.AttachmentButton),
          opacity: 1,
          backgroundSize: '20px 20px',
        },
        Chat: {
          ...getObject(desktop.Chat),
          borderRadius: '16px',
          boxShadow: '0 0 10px 0 rgba(117, 117, 117, 0.15)',
          height: '571px',
          width: '520px',
        },
        ChatBody: {
          ...getObject(desktop.ChatBody),
          backgroundColor: '#FFFFFF',
        },
        ChatButton: {
          ...getObject(desktop.ChatButton),
          backgroundColor: 'transparent',
          backgroundImage: CHAT_BUTTON_ICON_URL,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '56px 56px',
          borderRadius: '16px',
          boxShadow: 'none',
          height: '56px',
          width: '56px',
        },
        ChatHeader: {
          ...getObject(desktop.ChatHeader),
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #F8F8F8',
          color: '#333333',
          fontSize: '22px',
          fontWeight: '500',
          height: '81px',
          padding: '0 24px',
        },
        ChatInput: {
          ...getObject(desktop.ChatInput),
          backgroundColor: '#FFFFFF',
          buttonsContainerTop: '20px',
          buttonsPlacement: [[], ['attach', 'send']],
          color: '#333333',
          fontSize: '16px',
          paddingBottom: '24px',
          paddingLeft: '24px',
          paddingRight: '112px',
          paddingTop: '24px',
          placeholderColor: '#7B7F85',
          wrapperBackgroundColor: '#FFFFFF',
          wrapperBorderTop: '1px solid #F8F8F8',
          wrapperHeight: '96px',
          wrapperPadding: '24px',
        },
        CloseButton: {
          ...getObject(desktop.CloseButton),
          backgroundColor: '#F8F8F8',
          borderRadius: '100px',
          height: '36px',
          width: '36px',
        },
        EmojiButton: {
          ...getObject(desktop.EmojiButton),
          display: 'none',
        },
        InputText: {
          ...getObject(desktop.InputText),
          backgroundColor: '#FFFFFF',
          borderColor: '#FFFFFF',
          borderRadius: '0',
          color: '#333333',
          fontSize: '16px',
          margin: '0',
          padding: '0',
          placeholder: 'Ваше сообщение...',
          placeholderColor: '#7B7F85',
          textAlign: 'left',
        },
        MessageClient: {
          ...getObject(desktop.MessageClient),
          backgroundColor: '#DA2032',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '2px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          color: '#FFFFFF',
          dateColor: '#7B7F85',
          fontFamily: "'Moscow Sans', 'MoscowSans', sans-serif",
          fontSize: '16px',
          pointerDisplay: 'none',
        },
        MessageOperator: {
          ...getObject(desktop.MessageOperator),
          backgroundColor: '#F8F8F8',
          borderBottomLeftRadius: '2px',
          borderBottomRightRadius: '12px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          color: '#333333',
          dateColor: '#7B7F85',
          fontFamily: "'Moscow Sans', 'MoscowSans', sans-serif",
          fontSize: '16px',
          pointerDisplay: 'none',
        },
        MessageTime: {
          ...getObject(desktop.MessageTime),
          color: '#7B7F85',
          fontSize: '12px',
        },
        MicrophoneButton: {
          ...getObject(desktop.MicrophoneButton),
          backgroundColor: '#F8F8F8',
          borderRadius: '100px',
          height: '36px',
          opacity: 1,
          backgroundSize: '20px 20px',
          width: '36px',
        },
        Notification: {
          ...getObject(desktop.Notification),
          color: '#7B7F85',
          fontFamily: "'Moscow Sans', 'MoscowSans', sans-serif",
          fontSize: '14px',
          fontStyle: 'normal',
        },
        QuickQuestions: {
          ...getObject(desktop.QuickQuestions),
          buttonBackground: '#FFFFFF',
          buttonBackgroundHover: '#FFFFFF',
          buttonBorder: '0',
          buttonBorderRadius: '8px',
          buttonColor: '#333333',
          containerBackground: '#F8F8F8',
          direction: 'row',
        },
        SendButton: {
          ...getObject(desktop.SendButton),
          opacity: 1,
          backgroundSize: '20px 20px',
          circleBackgroundPosition: 'center',
          circleBackgroundSize: '20px 20px',
        },
      },
    },
    welcome: {
      ...getObject(webchat.welcome),
      pre: {
        text: 'Привет!',
        notice: 'Добро пожаловать в чат-бот Александра!',
      },
    },
  };
};

const getWidgetDocuments = () => {
  const documents: Document[] = [document];
  const iframes = Array.from(document.querySelectorAll('iframe'));

  iframes.forEach((iframe) => {
    try {
      const iframeDocument = iframe.contentDocument;
      if (iframeDocument && !documents.includes(iframeDocument)) {
        documents.push(iframeDocument);
      }
    } catch {
      // Cross-origin frames are not inspectable; the SDK chat frame is same-origin with this bundle.
    }
  });

  return documents;
};

const getVisibleWidgetFrame = () => {
  const frame = document.getElementById('__threadswidget_chat__iframe') || document.querySelector('iframe[id*="threadswidget"]');
  const container = document.getElementById('__threadswidget_chat__container') || frame?.parentElement;
  const target = frame ?? container;

  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const rect = target.getBoundingClientRect();
  const style = window.getComputedStyle(target);
  const isVisible =
    rect.width > 240 &&
    rect.height > 240 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || 1) !== 0;

  return isVisible ? target : null;
};

const injectWidgetCompatibilityStyles = () => {
  getWidgetDocuments().forEach((targetDocument) => {
    if (targetDocument.getElementById(CHAT_COMPATIBILITY_STYLE_ID)) {
      return;
    }

    const style = targetDocument.createElement('style');
    style.id = CHAT_COMPATIBILITY_STYLE_ID;
    style.textContent = `
      #__threadswidget_chat__container {
        bottom: 32px !important;
        font-family: var(--font-sans, 'Moscow Sans', 'MoscowSans', sans-serif) !important;
        left: auto !important;
        right: var(--chat-widget-right, max(32px, calc((100% - 1440px) / 2))) !important;
        z-index: 70 !important;
      }

      #__threadswidget_chat__iframe {
        border-radius: 16px !important;
        box-shadow: 0 0 10px 0 rgba(117, 117, 117, 0.15) !important;
        z-index: 70 !important;
      }

      textarea,
      input,
      button {
        font-family: var(--font-sans, 'Moscow Sans', 'MoscowSans', sans-serif) !important;
      }

      @media (max-width: 760px) {
        #__threadswidget_chat__container {
          bottom: 20px !important;
          right: 16px !important;
        }
      }
    `;

    targetDocument.head.appendChild(style);
  });
};

const findChatAlignmentTarget = () => {
  for (const selector of CHAT_ALIGNMENT_SELECTORS) {
    const target = document.querySelector(selector);
    if (target instanceof HTMLElement) {
      return target;
    }
  }

  return null;
};

const syncChatAlignment = () => {
  const target = findChatAlignmentTarget();
  if (!target) {
    document.documentElement.style.removeProperty('--chat-widget-right');
    return;
  }

  const targetRect = target.getBoundingClientRect();
  if (targetRect.width <= 0 || targetRect.height <= 0) {
    document.documentElement.style.removeProperty('--chat-widget-right');
    return;
  }

  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const rightOffset = Math.max(0, viewportWidth - targetRect.right);
  document.documentElement.style.setProperty('--chat-widget-right', `${rightOffset}px`);
};

const containsSdkInviteText = (text: string) => SDK_INVITE_TEXT_MARKERS.some((marker) => text.includes(marker));

const hideSdkInviteArtifacts = () => {
  window.ThreadsWidget?.hideInvite?.();

  // Корень приложения — его и его предков (html/body) скрывать нельзя, иначе белый экран.
  const appRoot = document.getElementById('root');

  getWidgetDocuments().forEach((targetDocument) => {
    const elements = Array.from(targetDocument.querySelectorAll<HTMLElement>('body *'));

    elements.forEach((element) => {
      const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      if (!text || !containsSdkInviteText(text)) {
        return;
      }

      const hasMatchingChild = Array.from(element.children).some((child) =>
        containsSdkInviteText(child.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
      );
      if (hasMatchingChild) {
        return;
      }

      let target = element;
      for (let level = 0; level < 6 && target.parentElement; level += 1) {
        const rect = target.getBoundingClientRect();
        const targetWindow = target.ownerDocument.defaultView ?? window;
        const style = targetWindow.getComputedStyle(target);

        if (rect.width >= 180 && rect.height >= 40 && style.position !== 'static') {
          break;
        }

        target = target.parentElement;
      }

      const ownerDocument = target.ownerDocument;
      const wouldHideApp =
        target === ownerDocument.documentElement ||
        target === ownerDocument.body ||
        (appRoot !== null && target.contains(appRoot));

      if (target !== targetDocument.body && !wouldHideApp) {
        target.setAttribute('data-lkp-hidden-sdk-invite', 'true');
        target.style.setProperty('display', 'none', 'important');
        target.style.setProperty('opacity', '0', 'important');
        target.style.setProperty('pointer-events', 'none', 'important');
      }
    });
  });
};

// Module-level flag: tracks what the SDK told us via showChat/hideChat.
// More reliable than DOM inspection — `getVisibleWidgetFrame` depends on
// guessing the SDK's element IDs and can easily return null when the SDK
// is actually open, causing the polling to call setIsOpen(false) and close the chat.
let sdkChatShown = false;

const readChatOpenState = () =>
  document.body.classList.contains('lkp-chat-starter-visible') ||
  localStorage.getItem(CHAT_OPEN_STORAGE_KEY) === 'true' ||
  sdkChatShown ||
  Boolean(getVisibleWidgetFrame());

const wrapWidgetOpenMethods = (setOpen: (isOpen: boolean) => void) => {
  const widget = window.ThreadsWidget;

  if (!widget || widget.isDummy || widget.isLkpWrapped) {
    return undefined;
  }

  const originalShowChat = widget.showChat?.bind(widget);
  const originalHideChat = widget.hideChat?.bind(widget);

  widget.isLkpWrapped = true;
  widget.showChat = (payload?: unknown) => {
    sdkChatShown = true;
    setOpen(true);
    originalShowChat?.(payload);
  };
  widget.hideChat = (payload?: unknown) => {
    sdkChatShown = false;
    setOpen(false);
    originalHideChat?.(payload);
  };

  return () => {
    widget.showChat = originalShowChat;
    widget.hideChat = originalHideChat;
    widget.isLkpWrapped = false;
  };
};

const triggerSdkAttachButton = () => {
  const widgetDocuments = getWidgetDocuments();

  for (const targetDocument of widgetDocuments) {
    const fileInput = targetDocument.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.click();
      return true;
    }

    const buttons = Array.from(targetDocument.querySelectorAll<HTMLButtonElement>('button'));
    const attachBtn = buttons.find((btn) =>
      /attach|clip|файл|paper/i.test(`${btn.className} ${btn.title} ${btn.getAttribute('aria-label') ?? ''}`),
    );

    if (attachBtn) {
      attachBtn.click();
      return true;
    }
  }

  return false;
};

const triggerSdkMicButton = () => {
  const widgetDocuments = getWidgetDocuments();

  for (const targetDocument of widgetDocuments) {
    const buttons = Array.from(targetDocument.querySelectorAll<HTMLButtonElement>('button'));
    const micBtn = buttons.find((btn) =>
      /micro|voice|audio|mic|голос/i.test(`${btn.className} ${btn.title} ${btn.getAttribute('aria-label') ?? ''}`),
    );

    if (micBtn) {
      micBtn.click();
      return true;
    }
  }

  return false;
};

const sendMessageThroughWidget = (message: string) => {
  const trimmedMessage = message.trim();
  const widgetDocuments = getWidgetDocuments();

  for (const targetDocument of widgetDocuments) {
    const input = targetDocument.querySelector('textarea, input[type="text"], [contenteditable="true"]');

    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      const valueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
      valueSetter?.call(input, trimmedMessage);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.focus();
    } else if (input instanceof HTMLElement) {
      input.textContent = trimmedMessage;
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: trimmedMessage }));
      input.focus();
    } else {
      continue;
    }

    window.setTimeout(() => {
      const buttons = Array.from(targetDocument.querySelectorAll('button')) as HTMLButtonElement[];
      const sendButton =
        buttons.find((button) => /send|отправ/i.test(`${button.className} ${button.title} ${button.ariaLabel}`)) ||
        buttons[buttons.length - 1];

      sendButton?.click();
    }, 50);

    return true;
  }

  return false;
};

const startWidgetOpenStateSync = (setOpen: (isOpen: boolean) => void) => {
  const unwrapWidgetMethods = wrapWidgetOpenMethods(setOpen);

  setOpen(readChatOpenState());

  const intervalId = window.setInterval(() => {
    injectWidgetCompatibilityStyles();
    hideSdkInviteArtifacts();
    setOpen(readChatOpenState());
  }, 150);

  window.ThreadsWidget?.onHideChat?.(() => {
    sdkChatShown = false;
    setOpen(false);
  });

  return () => {
    window.clearInterval(intervalId);
    unwrapWidgetMethods?.();
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

  configureChatTheme(settings);
  sessionStorage.setItem(CHATBOT_SETTINGS_KEY, JSON.stringify(settings.webchat));

  await appendWidgetScript(bundleUrl, abortSignal);
  await waitForWidgetReady(abortSignal);
  hideSdkInviteArtifacts();
  injectWidgetCompatibilityStyles();
};

const ChatBubbleIcon = () => (
  <svg className="chat-widget__bubble-icon" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16.3799 2.667C18.7465 2.667 20.9776 3.2237 22.9141 4.21C22.4246 4.6946 22.0282 5.2734 21.7549 5.917C20.169 5.1524 18.3436 4.7178 16.3799 4.7178C10.0216 4.7179 5.0986 9.4024 5.0986 14.9062C5.0987 18.2101 6.8028 21.0692 9.5986 23.1025C9.864 23.2955 10.0215 23.6035 10.0215 23.9316V26.627L13.3037 24.9385C13.3973 24.8891 13.4992 24.8545 13.6055 24.8359C13.623 24.8329 13.6406 24.8303 13.6582 24.8281C13.7598 24.8158 13.8619 24.8183 13.9609 24.8359C14.775 24.9714 15.6547 25.0937 16.3799 25.0938C22.7382 25.0938 27.6619 20.4101 27.6621 14.9062C27.6621 14.3469 27.6111 13.7984 27.5176 13.2637C28.2251 13.1502 28.8861 12.899 29.4717 12.5361C29.6297 13.2995 29.7139 14.0915 29.7139 14.9062C29.7137 21.7099 23.6966 27.1455 16.3799 27.1455C15.5883 27.1455 14.7083 27.0326 13.9512 26.9131L9.4648 29.2197C9.1469 29.3832 8.7661 29.3698 8.4609 29.1836C8.1558 28.9973 7.9697 28.6651 7.9697 28.3076V24.4424C4.9868 22.1122 3.047 18.8055 3.0469 14.9062C3.0469 8.1026 9.0632 2.6672 16.3799 2.667Z" fill="#F5F5F5" />
    <path d="M30.6665 8C30.6665 10.2091 28.8756 12 26.6665 12C24.4574 12 22.6665 10.2091 22.6665 8C22.6665 5.7909 24.4574 4 26.6665 4C28.8756 4 30.6665 5.7909 30.6665 8Z" fill="#F5F5F5" />
  </svg>
);

const LoadingIcon = () => <span className="chat-widget__loader" aria-hidden="true" />;

type StarterChatProps = {
  onClose: () => void;
  onSubmit: (message: string) => void;
  onAttach: () => void;
  onVoice: () => void;
};

const StarterChat = ({ onClose, onSubmit, onAttach, onVoice }: StarterChatProps) => {
  const [message, setMessage] = useState('');
  const timeLabel = getCurrentTimeLabel();

  const submitMessage = (nextMessage: string) => {
    const trimmedMessage = nextMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    onSubmit(trimmedMessage);
    setMessage('');
  };

  return (
    <section className="chat-widget__starter" aria-label="Быстрый ответ">
      <header className="chat-widget__starter-header">
        <h2>Быстрый ответ</h2>
        <button className="chat-widget__starter-close" type="button" aria-label="Закрыть чат" onClick={onClose}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5.25 5.25L14.75 14.75M14.75 5.25L5.25 14.75" />
          </svg>
        </button>
      </header>

      <div className="chat-widget__starter-dialog">
        <div className="chat-widget__starter-group">
          <div className="chat-widget__starter-message chat-widget__starter-message--hello">
            <strong>Привет!</strong>
            <span>Добро пожаловать в чат-бот Александра!</span>
          </div>
          <time>{timeLabel}</time>
        </div>

        <div className="chat-widget__starter-group">
          <div className="chat-widget__starter-message chat-widget__starter-message--questions">
            <strong>Что вас интересует?</strong>
            <div className="chat-widget__starter-chips">
              {STARTER_QUICK_REPLIES.map((question) => (
                <button key={question} type="button" onClick={() => submitMessage(question)}>
                  {question}
                </button>
              ))}
            </div>
          </div>
          <time>{timeLabel}</time>
        </div>
      </div>

      <form
        className="chat-widget__starter-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(message);
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ваше сообщение..."
          aria-label="Ваше сообщение"
        />
        <button className="chat-widget__starter-action" type="button" aria-label="Прикрепить файл" onClick={onAttach}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M7.25 10.75L11.9 6.1C12.75 5.25 14.13 5.25 14.98 6.1C15.83 6.95 15.83 8.33 14.98 9.18L8.78 15.38C7.48 16.68 5.37 16.68 4.07 15.38C2.77 14.08 2.77 11.97 4.07 10.67L10.35 4.39" />
          </svg>
        </button>
        <button
          className="chat-widget__starter-action"
          type={message.trim() ? 'submit' : 'button'}
          aria-label={message.trim() ? 'Отправить' : 'Голосовое сообщение'}
          onClick={message.trim() ? undefined : onVoice}
        >
          {message.trim() ? (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3.5 10L16.5 3.5L12.25 16.5L9.7 10.3L3.5 10Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 12.5C11.38 12.5 12.5 11.38 12.5 10V5.5C12.5 4.12 11.38 3 10 3C8.62 3 7.5 4.12 7.5 5.5V10C7.5 11.38 8.62 12.5 10 12.5Z" />
              <path d="M5.5 9.5C5.5 12 7.5 14 10 14M14.5 9.5C14.5 12 12.5 14 10 14M10 14V17" />
            </svg>
          )}
        </button>
      </form>
    </section>
  );
};

export const ChatWidget = ({ clientId, isAuthenticated = false }: ChatWidgetProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const [isStarterVisible, setIsStarterVisible] = useState(true);
  const [retryIndex, setRetryIndex] = useState(0);

  useEffect(() => {
    let frameId = 0;

    const scheduleSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncChatAlignment);
    };

    scheduleSync();

    const resizeObserver = new ResizeObserver(scheduleSync);
    const observeTarget = () => {
      const target = findChatAlignmentTarget();
      if (target) {
        resizeObserver.observe(target);
      }
    };

    observeTarget();

    const targetRefreshId = window.setInterval(() => {
      resizeObserver.disconnect();
      observeTarget();
      scheduleSync();
    }, 500);

    window.addEventListener('resize', scheduleSync);
    window.addEventListener('scroll', scheduleSync, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(targetRefreshId);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('scroll', scheduleSync);
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty('--chat-widget-right');
    };
  }, []);

  useEffect(() => {
    const effectiveClientId = isAuthenticated ? clientId?.trim() || undefined : getGuestClientId();

    if (!effectiveClientId) {
      return undefined;
    }

    let stopOpenStateSync: (() => void) | undefined;
    const abortController = new AbortController();
    const loadingTimerId = window.setTimeout(() => {
      if (!abortController.signal.aborted) {
        setStatus('loading');
      }
    }, 0);

    loadThreadsWidget(effectiveClientId, isAuthenticated, abortController.signal)
      .then(() => {
        if (!abortController.signal.aborted) {
          stopOpenStateSync = startWidgetOpenStateSync(setIsOpen);
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
      stopOpenStateSync?.();
      abortController.abort();
    };
  }, [clientId, isAuthenticated, retryIndex]);

  useEffect(() => {
    document.body.classList.toggle('lkp-chat-starter-visible', status === 'ready' && isOpen && isStarterVisible);
    document.body.classList.toggle('lkp-chat-sdk-hidden', status === 'ready' && (!isOpen || isStarterVisible));

    return () => {
      document.body.classList.remove('lkp-chat-starter-visible');
      document.body.classList.remove('lkp-chat-sdk-hidden');
    };
  }, [isOpen, isStarterVisible, status]);

  if (status === 'ready') {
    return isOpen ? (
      <>
        {/*
          Backdrop is rendered ONLY while StarterChat is visible.
          When isStarterVisible=false the SDK panel is showing directly;
          the backdrop (z-index 2147483645) would sit ON TOP of the SDK
          iframe (z-index 70), blocking all user interaction with the SDK
          and causing every click to close the chat.
        */}
        {isStarterVisible ? (
          <>
            <button
              className="chat-widget__backdrop"
              type="button"
              aria-label="Закрыть чат"
              onClick={() => {
                setIsOpen(false);
                setIsStarterVisible(true);
                window.ThreadsWidget?.hideChat?.();
              }}
            />
            <StarterChat
              onClose={() => {
                setIsOpen(false);
                setIsStarterVisible(true);
                window.ThreadsWidget?.hideChat?.();
              }}
              onSubmit={(nextMessage) => {
                setIsStarterVisible(false);
                // Delay until after React commits (StarterChat unmounted),
                // so sendMessageThroughWidget finds only the SDK's input—
                // not the starter form's input which would cause it to click
                // the backdrop button instead of the SDK's send button.
                window.setTimeout(() => {
                  sendMessageThroughWidget(nextMessage);
                }, 150);
              }}
              onAttach={() => {
                setIsStarterVisible(false);
                window.setTimeout(triggerSdkAttachButton, 300);
              }}
              onVoice={() => {
                setIsStarterVisible(false);
                window.setTimeout(triggerSdkMicButton, 300);
              }}
            />
          </>
        ) : null}
      </>
    ) : (
      <div className="chat-widget" data-chat-auth={isAuthenticated ? 'auth=true' : 'auth=false'}>
        <button
          className="chat-widget__launcher"
          onClick={() => {
            setIsStarterVisible(true);
            setIsOpen(true);
            window.ThreadsWidget?.showChat?.();
          }}
          title="Чат"
          type="button"
          aria-label="Открыть чат"
        >
          <ChatBubbleIcon />
        </button>
      </div>
    );
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
