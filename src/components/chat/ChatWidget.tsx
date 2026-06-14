import { useMemo, useState } from 'react';
import './ChatWidget.css';

type ChatWidgetProps = {
  isAuthenticated?: boolean;
};

type ChatMessage = {
  id: string;
  author: 'bot' | 'user';
  text: string;
};

const quickMessages = [
  'Вопрос по карте «Тройка»',
  'Пополнить баланс',
  'Не пришел билет',
  'Возврат средств',
  'Тарифы и билеты',
  'Связаться с оператором',
] as const;

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const ChatBubbleIcon = () => (
  <svg className="chat-widget__bubble-icon" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16.3799 2.667C18.7465 2.667 20.9776 3.2237 22.9141 4.21C22.4246 4.6946 22.0282 5.2734 21.7549 5.917C20.169 5.1524 18.3436 4.7178 16.3799 4.7178C10.0216 4.7179 5.0986 9.4024 5.0986 14.9062C5.0987 18.2101 6.8028 21.0692 9.5986 23.1025C9.864 23.2955 10.0215 23.6035 10.0215 23.9316V26.627L13.3037 24.9385C13.3973 24.8891 13.4992 24.8545 13.6055 24.8359C13.623 24.8329 13.6406 24.8303 13.6582 24.8281C13.7598 24.8158 13.8619 24.8183 13.9609 24.8359C14.775 24.9714 15.6547 25.0937 16.3799 25.0938C22.7382 25.0938 27.6619 20.4101 27.6621 14.9062C27.6621 14.3469 27.6111 13.7984 27.5176 13.2637C28.2251 13.1502 28.8861 12.899 29.4717 12.5361C29.6297 13.2995 29.7139 14.0915 29.7139 14.9062C29.7137 21.7099 23.6966 27.1455 16.3799 27.1455C15.5883 27.1455 14.7083 27.0326 13.9512 26.9131L9.4648 29.2197C9.1469 29.3832 8.7661 29.3698 8.4609 29.1836C8.1558 28.9973 7.9697 28.6651 7.9697 28.3076V24.4424C4.9868 22.1122 3.047 18.8055 3.0469 14.9062C3.0469 8.1026 9.0632 2.6672 16.3799 2.667Z" fill="#F5F5F5" />
    <path d="M30.6665 8C30.6665 10.2091 28.8756 12 26.6665 12C24.4574 12 22.6665 10.2091 22.6665 8C22.6665 5.7909 24.4574 4 26.6665 4C28.8756 4 30.6665 5.7909 30.6665 8Z" fill="#F5F5F5" />
  </svg>
);

const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="m5.5 5.5 9 9" />
    <path d="m14.5 5.5-9 9" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h11" />
    <path d="m10.5 5 5 5-5 5" />
  </svg>
);

const AttachIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="m14.5 8.8-5.9 5.9a3 3 0 1 1-4.2-4.2l6.4-6.4a4 4 0 0 1 5.7 5.7l-6.4 6.4" />
  </svg>
);

export const ChatWidget = ({ isAuthenticated = false }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      author: 'bot',
      id: 'greeting',
      text: 'Здравствуйте! Я виртуальный помощник Московского транспорта. Чем могу помочь?',
    },
  ]);
  const apiLabel = useMemo(() => (isAuthenticated ? 'auth=true' : 'auth=false'), [isAuthenticated]);

  const pushUserMessage = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        author: 'user',
        id: createMessageId(),
        text: trimmedText,
      },
      {
        author: 'bot',
        id: createMessageId(),
        text: 'Подскажите, пожалуйста, подробности. Если вопрос потребует проверки данных, подключим специалиста.',
      },
    ]);
    setMessageText('');
  };

  return (
    <div className={`chat-widget${isOpen ? ' chat-widget--open' : ''}`} data-chat-auth={apiLabel}>
      {isOpen && (
        <section className="chat-widget__panel" aria-label="Чат поддержки">
          <header className="chat-widget__header">
            <div className="chat-widget__avatar" aria-hidden="true">
              <ChatBubbleIcon />
            </div>
            <div>
              <h2>Чат поддержки</h2>
              <p>Московский транспорт</p>
            </div>
            <button className="chat-widget__close" type="button" aria-label="Закрыть чат" onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </button>
          </header>

          <div className="chat-widget__messages">
            {messages.map((message) => (
              <p className={`chat-widget__message chat-widget__message--${message.author}`} key={message.id}>
                {message.text}
              </p>
            ))}
          </div>

          <div className="chat-widget__quick" aria-label="Быстрые сообщения">
            {quickMessages.map((message) => (
              <button type="button" key={message} onClick={() => pushUserMessage(message)}>
                {message}
              </button>
            ))}
          </div>

          <form
            className="chat-widget__form"
            onSubmit={(event) => {
              event.preventDefault();
              pushUserMessage(messageText);
            }}
          >
            <button className="chat-widget__attach" type="button" aria-label="Прикрепить файл">
              <AttachIcon />
            </button>
            <input
              aria-label="Сообщение"
              maxLength={4000}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Введите сообщение"
              value={messageText}
            />
            <button className="chat-widget__send" type="submit" aria-label="Отправить сообщение" disabled={!messageText.trim()}>
              <SendIcon />
            </button>
          </form>
        </section>
      )}

      <button className="chat-widget__launcher" type="button" aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат'} onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? <CloseIcon className="chat-widget__close-icon" /> : <ChatBubbleIcon />}
      </button>
    </div>
  );
};
