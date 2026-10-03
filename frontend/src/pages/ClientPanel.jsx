import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Layers, Key, CheckCircle, LogOut } from 'lucide-react';

export default function ClientPanel() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [units, setUnits] = useState([]);
  const [colors, setColors] = useState([]);
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem(`token_${slug}`) || null);

  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}` }
    });
  };

  useEffect(() => {
    if (token) {
      fetchProjectData();
    }
  }, [token, slug]);

  const fetchProjectData = async () => {
    // In a real app we would fetch by slug or use the token's project_id
    // Since backend expects project_id, let's fetch all projects to find ID by slug
    const pRes = await authFetch('/api/admin/projects');
    const allP = await pRes.json();
    const curr = allP.find(p => p.slug === slug);
    if(curr) {
      setProject(curr);
      const uRes = await authFetch(`/api/admin/projects/${curr.id}/units`);
      setUnits(await uRes.json());
      const cRes = await authFetch(`/api/admin/projects/${curr.id}/colors`);
      setColors(await cRes.json());
    }
  };

  const updateStatus = async (unitId, statusCode) => {
    if(!project) return;
    await authFetch(`/api/admin/units/${unitId}?current_status=${statusCode}`, { method: 'PUT' });
    fetchProjectData();
  };

  if (!token) {
    // Redirect to the unified login page
    window.location.href = '/client';
    return null;
  }

  if(!project) return <div className="p-8 text-center text-gray-400">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <header className="max-w-6xl mx-auto glass rounded-2xl p-6 mb-8 flex justify-between items-center border-b-4 border-purple-500">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{project.name}</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2"><Building2 size={14} /> Satış ve Maket Kontrol Paneli</p>
        </div>
        <button onClick={() => { setToken(null); localStorage.removeItem(`token_${slug}`); }} className="flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800 px-4 py-2 rounded-lg transition-colors">
          <LogOut size={16} /> Çıkış
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2"><Layers size={18} className="text-purple-400"/> Renk Göstergeleri (Durumlar)</h2>
          <div className="flex flex-wrap gap-4">
            {colors.map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-full border border-gray-800 shadow-sm">
                <span className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: c.hex_color }}></span>
                <span className="text-sm font-medium text-gray-300">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map(u => {
            const currentColor = colors.find(c => c.status_code === u.current_status);
            return (
              <div key={u.id} className="glass rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-purple-500/10 hover:shadow-xl border border-gray-800">
                <div className="p-4 border-b border-gray-800 flex justify-between items-start" style={{ borderBottomColor: currentColor?.hex_color + '40' }}>
                  <div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{u.block_name}</div>
                    <div className="text-xl font-bold text-white">{u.unit_label}</div>
                  </div>
                  <span className="w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: currentColor?.hex_color, color: currentColor?.hex_color }}></span>
                </div>
                <div className="p-4 bg-gray-900/50">
                  <p className="text-xs text-gray-400 mb-3">Durumu Güncelle:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {colors.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => updateStatus(u.id, c.status_code)}
                        className={`cursor-pointer text-xs font-medium py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors border ${u.current_status === c.status_code ? 'bg-gray-800 text-white' : 'bg-transparent text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`}
                        style={{ borderColor: u.current_status === c.status_code ? c.hex_color : 'transparent' }}
                      >
                        {u.current_status === c.status_code && <CheckCircle size={12} style={{ color: c.hex_color }}/>}
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  );
}
