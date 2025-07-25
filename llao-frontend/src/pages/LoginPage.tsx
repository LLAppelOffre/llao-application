import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Tabs, { TabItem } from '../components/Tabs';

const API_URL = 'http://localhost:8000'; // À adapter si besoin

const loginTabs: TabItem[] = [
  { label: 'Connexion', to: '/login' },
];

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/visualisation');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append('username', username);
      form.append('password', password);
      const res = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) {
        setError(data.detail || 'Identifiants invalides');
        setLoading(false);
        return;
      }
      login(data.access_token);
      // Redirection automatique via useEffect
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen flex flex-col items-center justify-center">
      <Tabs tabs={loginTabs} />
      <div className="max-w-sm w-full bg-white rounded-lg shadow-lg p-6 dark:bg-dark-backgroundSecondary dark:border dark:border-dark-border">
        <h2 className="text-center mb-6 text-2xl font-title font-semibold dark:text-dark-text">Connexion</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-2 mb-3 rounded border border-border focus:outline-none focus:border-primary bg-backgroundSecondary text-text dark:bg-dark-background dark:border-dark-border dark:text-dark-text dark:focus:border-dark-primary"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 mb-3 rounded border border-border focus:outline-none focus:border-primary bg-backgroundSecondary text-text dark:bg-dark-background dark:border-dark-border dark:text-dark-text dark:focus:border-dark-primary"
            disabled={loading}
          />
          {error && <div className="text-error mb-3 dark:text-dark-error">{error}</div>}
          <button
            type="submit"
            className={`w-full p-2 bg-primary text-white rounded font-bold transition hover:bg-hover ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} dark:hover:bg-dark-hover`}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 