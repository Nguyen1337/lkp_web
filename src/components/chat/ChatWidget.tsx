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

const ChatBubbleIcon = ({ withBackground = false }: { withBackground?: boolean }) => (
  <svg className="chat-widget__bubble-icon" viewBox="0 0 56 56" aria-hidden="true">
    {withBackground && (
      <path d="M0 16C0 7.16344 7.16344 0 16 0H40C48.8366 0 56 7.16344 56 16V40C56 48.8366 48.8366 56 40 56H16C7.16344 56 0 48.8366 0 40V16Z" fill="#DA2032" />
    )}
    <path d="M28.3799 14.667C30.7465 14.667 32.9776 15.2237 34.9141 16.21C34.4246 16.6946 34.0282 17.2734 33.7549 17.917C32.169 17.1524 30.3436 16.7178 28.3799 16.7178C22.0216 16.7179 17.0986 21.4024 17.0986 26.9062C17.0987 30.2101 18.8028 33.0692 21.5986 35.1025C21.864 35.2955 22.0215 35.6035 22.0215 35.9316V38.627L25.3037 36.9385C25.3973 36.8891 25.4992 36.8545 25.6055 36.8359C25.623 36.8329 25.6406 36.8303 25.6582 36.8281C25.7598 36.8158 25.8619 36.8183 25.9609 36.8359C26.775 36.9714 27.6547 37.0937 28.3799 37.0938C34.7382 37.0938 39.6619 32.4101 39.6621 26.9062C39.6621 26.3469 39.6111 25.7984 39.5176 25.2637C40.2251 25.1502 40.8861 24.899 41.4717 24.5361C41.6297 25.2995 41.7139 26.0915 41.7139 26.9062C41.7137 33.7099 35.6966 39.1455 28.3799 39.1455C27.5883 39.1455 26.7083 39.0326 25.9512 38.9131L21.4648 41.2197C21.1469 41.3832 20.7661 41.3698 20.4609 41.1836C20.1558 40.9973 19.9697 40.6651 19.9697 40.3076V36.4424C16.9868 34.1122 15.047 30.8055 15.0469 26.9062C15.0469 20.1026 21.0632 14.6672 28.3799 14.667Z" fill="#F5F5F5" />
    <path d="M42.6665 20C42.6665 22.2091 40.8756 24 38.6665 24C36.4574 24 34.6665 22.2091 34.6665 20C34.6665 17.7909 36.4574 16 38.6665 16C40.8756 16 42.6665 17.7909 42.6665 20Z" fill="#F5F5F5" />
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
        {isOpen ? <CloseIcon className="chat-widget__close-icon" /> : <ChatBubbleIcon withBackground />}
      </button>
    </div>
  );
};
