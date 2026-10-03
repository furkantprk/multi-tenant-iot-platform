import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok && data.role === 'admin') {
        localStorage.setItem('adminToken', data.access_token);
        navigate('/');
      } else {
        setError('Geçersiz kullanıcı adı veya şifre (veya yetkiniz yok).');
      }
    } catch (err) {
      setError('Sunucu bağlantı hatası.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="glass w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Yönetici Girişi</h1>
          <p className="text-gray-400 text-sm mt-1">Multi-Tenant IoT Kontrol Paneli</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-purple-500/25 mt-4"
          >
            Sisteme Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
