import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';

const LoginPage = ({ API_BASE }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Form URL Encoded for OAuth2
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        if (!res.ok) throw new Error('Invalid credentials');
        const data = await res.json();
        login(data.access_token, data.username, data.role);
      } else {
        // Register
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Registration failed');
        }
        const data = await res.json();
        login(data.access_token, data.username, data.role);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-wrapper">
          <div className="login-logo">
            <ShieldCheck size={36} color="var(--primary)" />
          </div>
        </div>
        
        <h2 className="login-title">VeriFi Platform</h2>
        <p className="login-subtitle">
          {isLogin ? 'Sign in to access your dashboard' : 'Register a new analyst account'}
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '20px' }}
          >
            {loading ? 'Processing...' : isLogin ? <><LogIn size={18}/> Sign In</> : <><UserPlus size={18}/> Create Account</>}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="login-toggle-btn"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
