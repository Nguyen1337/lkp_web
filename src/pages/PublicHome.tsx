import { useState } from 'react';
import {
  FastPayBanner,
  HelpButton,
  LoginEntryCard,
  PublicFooter,
  PublicHeader,
  ServicesGrid,
  TopUpBalanceCard,
} from '../components/public-home/PublicHomeComponents';
import './PublicHome.css';

export const PublicHome = () => {
  const [loginFocusRequest, setLoginFocusRequest] = useState(0);
  const [isFastPayVisible, setIsFastPayVisible] = useState(true);
  const handleAuthenticated = () => window.location.reload();

  return (
    <div className="public-home">
      <PublicHeader onLoginClick={() => setLoginFocusRequest((request) => request + 1)} />

      <main className="public-main">
        <div className={`public-main__grid${isFastPayVisible ? '' : ' public-main__grid--banner-hidden'}`}>
          <LoginEntryCard focusRequest={loginFocusRequest} onAuthenticated={handleAuthenticated} />
          <ServicesGrid />
          {isFastPayVisible && <FastPayBanner onDismiss={() => setIsFastPayVisible(false)} />}
          <TopUpBalanceCard />
        </div>

        <HelpButton />
      </main>

      <PublicFooter />
    </div>
  );
};
