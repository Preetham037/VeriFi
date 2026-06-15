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
    <div className="min-h-screen flex items-center justify-center bg-[#0B0C10] text-white p-4">
      <div className="max-w-md w-full bg-[#11131A] p-8 rounded-2xl shadow-2xl border border-gray-800">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
            <ShieldCheck size={32} className="text-blue-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2">VeriFi Platform</h2>
        <p className="text-center text-gray-400 mb-8">
          {isLogin ? 'Sign in to access your dashboard' : 'Register a new analyst account'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#1A1C23] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#1A1C23] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? <><LogIn size={18}/> Sign In</> : <><UserPlus size={18}/> Create Account</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
