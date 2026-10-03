import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Settings, Trash2, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Create Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchProjects();
  }, [navigate]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, slug })
      });
      if (res.ok) {
        setName('');
        setSlug('');
        fetchProjects();
      } else if (res.status === 401) {
        navigate('/admin/login');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Bu projeyi tamamen silmek istediğinize emin misiniz?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/projects/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) navigate('/admin/login');
      fetchProjects();
    } catch (e) {
      console.error(e);
    }
  };

  const changeAdminPassword = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          old_password: oldPassword, 
          new_password: newPassword,
          new_username: newUsername
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert('Bilgiler başarıyla güncellendi!');
        setOldPassword('');
        setNewPassword('');
        setNewUsername('');
        
        // If username changed, they need to log in again with new username
        if (data.new_username && data.new_username !== 'admin' && newUsername) {
          alert('Kullanıcı adınız değiştiği için güvenlik amacıyla yeniden giriş yapmalısınız.');
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        }
      } else {
        const err = await res.json();
        alert('Hata: ' + err.detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Maket Üreticisi Admin Paneli
        </h1>
        <button 
          onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>
      <p className="text-gray-400 mb-8">Projeleri oluşturun, kat şemalarını düzenleyin ve LED eşleştirmelerini gerçekleştirin.</p>

      {/* List Projects */}
      <div className="glass rounded-2xl p-6 mb-8 shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Kayıtlı Tüm Projeler</h2>
        {loading ? <p className="text-gray-400">Yükleniyor...</p> : (
          <div className="space-y-3">
            {projects.length === 0 && <p className="text-gray-500 text-sm">Henüz proje yok.</p>}
            {projects.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors">
                <div>
                  <div className="font-semibold text-lg text-blue-300">{p.name}</div>
                  <div className="text-xs text-gray-400">URL: /client/{p.slug} - Toplam {p.total_leds} LED</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/admin/project/${p.slug}`)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Settings size={16} /> Yönet
                  </button>
                  <button onClick={() => deleteProject(p.id)} className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Form */}
      <div className="glass rounded-2xl p-6 mb-8 shadow-xl border-t-4 border-blue-500">
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
          <Plus className="text-blue-400" /> Yeni Proje Oluştur
        </h2>
        <form onSubmit={createProject} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Proje Adı</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 focus:border-blue-500 outline-none" placeholder="Örn: Vadi Konakları" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL (Slug)</label>
            <input required type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 focus:border-blue-500 outline-none" placeholder="Örn: vadi-konaklari" />
          </div>

          <div className="md:col-span-3 mt-2">
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-2 px-6 rounded-lg transition-all shadow-lg hover:shadow-blue-500/25">Projeyi Oluştur</button>
          </div>
        </form>
      </div>
      
      {/* Admin Settings Form */}
      <div className="glass rounded-2xl p-6 mb-8 shadow-xl border-t-4 border-purple-500">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
          ⚙️ Admin Bilgilerini Güncelle
        </h2>
        <form onSubmit={changeAdminPassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mevcut Şifre (Zorunlu)</label>
            <input required type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 focus:border-purple-500 outline-none" placeholder="Kimliğinizi Doğrulayın" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Yeni Kullanıcı Adı</label>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 focus:border-purple-500 outline-none" placeholder="Boş bırakılabilir" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Yeni Şifre</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 focus:border-purple-500 outline-none" placeholder="Boş bırakılabilir" />
          </div>
          <div className="md:col-span-3 mt-2">
            <button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-2 px-6 rounded-lg transition-all shadow-lg">Bilgileri Güncelle</button>
          </div>
        </form>
      </div>
    </div>
  );
}
