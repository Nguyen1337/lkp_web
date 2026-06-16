import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/apiService';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import './Login.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tokenResponse = await apiService.login(email, password);
      localStorage.setItem('authToken', tokenResponse.access_token);

      if (tokenResponse.refresh_token) {
        localStorage.setItem('refreshToken', tokenResponse.refresh_token);
      }

      localStorage.setItem('authExpiresAt', String(Date.now() + tokenResponse.expires_in * 1000));
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>LKP</h1>
          <p>Личный кабинет пассажира</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="login-button"
          >
            Вход
          </Button>
        </form>

        <div className="login-footer">
          <p>
            Нет аккаунта? <a href="/register">Создать аккаунт</a>
          </p>
        </div>
      </div>
    </div>
  );
};
