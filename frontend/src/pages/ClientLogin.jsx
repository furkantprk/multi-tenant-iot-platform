import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key } from 'lucide-react';

export default function ClientLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'client' })
      });
      if (res.ok) {
        const data = await res.json();
        // Save the token globally or based on slug, but since we dynamically redirect, we save it with the slug
        localStorage.setItem(`token_${data.project_slug}`, data.access_token);
        // Automatically redirect to the correct project panel
        navigate(`/client/${data.project_slug}`);
      } else {
        setLoginError('Kullanıcı adı veya şifre hatalı!');
      }
    } catch (e) {
      setLoginError('Bağlantı hatası.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="glass p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-purple-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
            <Key className="text-purple-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Müşteri Girişi</h2>
          <p className="text-gray-400 text-sm mt-2">Satış paneline erişmek için yetki bilgilerinizle giriş yapın.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Kullanıcı Adı" className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors" />
          </div>
          <div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Şifre" className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors" />
          </div>
          {loginError && <div className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded">{loginError}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer">
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
