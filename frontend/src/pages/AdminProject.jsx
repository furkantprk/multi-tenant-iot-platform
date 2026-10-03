import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, Plus, Box, Layers, Play, Check, Trash2, Key, Users, LogOut } from 'lucide-react';

export default function AdminProject() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('adminToken');
    if(!token) {
      navigate('/admin/login');
      return Promise.reject('No token');
    }
    return fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}` }
    });
  };

  const [project, setProject] = useState(null);
  const [units, setUnits] = useState([]);
  const [colors, setColors] = useState([]);
  
  // Forms
  const [blockName, setBlockName] = useState('');
  const [floors, setFloors] = useState('');
  const [floorData, setFloorData] = useState([]);
  
  const [singleBlock, setSingleBlock] = useState('');
  const [singleFloor, setSingleFloor] = useState('');
  const [singleLabel, setSingleLabel] = useState('');

  // Calibration
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentLedIndex, setCurrentLedIndex] = useState(0);

  // Client User
  const [users, setUsers] = useState([]);
  const [cUser, setCUser] = useState('');
  const [cPass, setCPass] = useState('');

  // MAC Address
  const [macAddress, setMacAddress] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [slug]);

  const fetchProjectData = async () => {
    try {
      const pRes = await authFetch('/api/admin/projects');
      const allP = await pRes.json();
      const curr = allP.find(p => p.slug === slug);
      if (curr) {
        setProject(curr);
        await reloadUnitsAndColors(curr.id);
        setIsCalibrating(curr.calibration_active);
        setCurrentLedIndex(curr.calibration_led_index || 0);
        setMacAddress(curr.mac_address || '');
        
        
        const userRes = await authFetch(`/api/admin/projects/${curr.id}/users`, { headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` } });
        const userData = await userRes.json();
        setUsers(userData);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const reloadUnitsAndColors = async (pid, tokenParam) => {
    const token = tokenParam || localStorage.getItem('adminToken');
    const uRes = await authFetch(`/api/admin/projects/${pid}/units`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setUnits(await uRes.json());
    const cRes = await authFetch(`/api/admin/projects/${pid}/colors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setColors(await cRes.json());
  };

  const handleFloorsChange = (e) => {
    const val = e.target.value;
    setFloors(val);
    const num = parseInt(val) || 0;
    const newData = [];
    for (let i = 0; i < num; i++) {
      newData.push({ floor_no: i, units_count: '' });
    }
    setFloorData(newData);
  };

  const handleFloorDataChange = (index, val) => {
    const newData = [...floorData];
    newData[index].units_count = parseInt(val) || '';
    setFloorData(newData);
  };

  const generateBlocks = async () => {
    if(!blockName || !floors || floorData.some(f => f.units_count === '')) return alert("Tüm alanları doldurun.");
    
    await authFetch(`/api/admin/projects/${project.id}/generate_units_custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        block_names: blockName,
        floors_data: floorData.map(f => ({ floor_no: f.floor_no, units_count: parseInt(f.units_count) || 0 }))
      })
    });
    
    setBlockName('');
    setFloors('');
    setFloorData([]);
    reloadUnitsAndColors(project.id);
  };

  const addSingleUnit = async () => {
    if(!singleBlock || !singleLabel) return alert("Blok ve etiket gerekli.");
    await authFetch(`/api/admin/projects/${project.id}/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_name: singleBlock, floor_no: parseInt(singleFloor), unit_label: singleLabel })
    });
    setSingleLabel('');
    reloadUnitsAndColors(project.id);
  };

  const deleteUnit = async (uid) => {
    if(!confirm("Emin misiniz?")) return;
    await authFetch(`/api/admin/units/${uid}`, { method: 'DELETE' });
    reloadUnitsAndColors(project.id);
  };

  const deleteAllUnits = async () => {
    if(!confirm("Projedeki TÜM etiketleri ve birimleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) return;
    await authFetch(`/api/admin/projects/${project.id}/units`, { method: 'DELETE' });
    reloadUnitsAndColors(project.id);
  };

  const deleteBlock = async (blockName) => {
    if(!confirm(`"${blockName}" bloğundaki TÜM etiketleri silmek istediğinize emin misiniz?`)) return;
    await authFetch(`/api/admin/projects/${project.id}/units/block/${encodeURIComponent(blockName)}`, { method: 'DELETE' });
    reloadUnitsAndColors(project.id);
  };

  const updateUnitLabel = async (uid, label) => {
    await authFetch(`/api/admin/units/${uid}?unit_label=${encodeURIComponent(label)}`, { method: 'PUT' });
    reloadUnitsAndColors(project.id);
  };

  const toggleCalibration = async () => {
    const res = await authFetch(`/api/admin/projects/${project.id}/calibration/toggle`, { method: 'POST' });
    const data = await res.json();
    setIsCalibrating(data.calibration_active);
  };

  const mapLed = async (uid) => {
    if(!isCalibrating) return alert("Kalibrasyonu başlatın!");
    const unit = units.find(u => u.id === uid);
    if(unit && unit.physical_led_index !== null) return alert("Bu alan zaten eşleştirilmiş! Değiştirmek isterseniz 'Son İşlemi Geri Al' butonunu kullanın.");

    await authFetch(`/api/admin/projects/${project.id}/calibration/map?unit_id=${uid}&led_index=${currentLedIndex}`, { method: 'POST' });
    setCurrentLedIndex(prev => prev + 1);
    reloadUnitsAndColors(project.id);
  };

  const undoCalibration = async () => {
    if(!isCalibrating || currentLedIndex <= 0) return;
    const res = await authFetch(`/api/admin/projects/${project.id}/calibration/undo`, { method: 'POST' });
    if(res.ok) {
      setCurrentLedIndex(prev => prev - 1);
      reloadUnitsAndColors(project.id);
    }
  };

  const addColorRow = () => {
    let max = -1;
    colors.forEach(c => { if(c.status_code > max) max = c.status_code; });
    setColors([...colors, { status_code: max + 1, hex_color: '#ffffff', label: 'Yeni Durum' }]);
  };

  const updateColorRow = (idx, field, value) => {
    const newC = [...colors];
    newC[idx][field] = value;
    setColors(newC);
  };

  const removeColorRow = (idx) => {
    const newC = [...colors];
    newC.splice(idx, 1);
    setColors(newC);
  };

  const saveColors = async () => {
    await authFetch(`/api/admin/projects/${project.id}/colors`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(colors)
    });
    alert("Renkler kaydedildi.");
  };

  const saveClientUser = async () => {
    if(!cUser || !cPass) return alert("Bilgileri girin");
    const res = await authFetch(`/api/admin/projects/${project.id}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cUser, password: cPass, role: 'client', project_id: project.id })
    });
    if(res.ok) {
      setCUser('');
      setCPass('');
      const userRes = await authFetch(`/api/admin/projects/${project.id}/users`, { headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` } });
      setUsers(await userRes.json());
      alert("Müşteri hesabı eklendi!");
    } else {
      alert("Hata: Kullanıcı adı zaten mevcut olabilir.");
    }
  };

  const deleteClientUser = async (userId) => {
    if(!confirm("Kullanıcıyı silmek istediğinize emin misiniz?")) return;
    const res = await authFetch(`/api/admin/projects/${project.id}/users/${userId}`, { method: 'DELETE' });
    if(res.ok) {
      const userRes = await authFetch(`/api/admin/projects/${project.id}/users`, { headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` } });
      setUsers(await userRes.json());
    }
  };

  const updateMacAddress = async () => {
    const res = await authFetch(`/api/admin/projects/${project.id}/mac_address?mac_address=${encodeURIComponent(macAddress)}`, {
      method: 'PUT'
    });
    if(res.ok) {
      alert("MAC Adresi başarıyla güncellendi!");
      fetchProjectData();
    }
  };

  const groupedUnits = units.reduce((acc, unit) => {
    if (!acc[unit.block_name]) acc[unit.block_name] = [];
    acc[unit.block_name].push(unit);
    return acc;
  }, {});

  if(!project) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div className="container mx-auto p-8 max-w-6xl pb-24">
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link to="/" className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-2">← Tüm Projelere Dön</Link>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            {project.name} Yönetimi
          </h1>
          <div className="mt-2 text-sm text-gray-400 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="ESP MAC Adresi (Örn: A1:B2:C3:D4)" value={macAddress} onChange={e=>setMacAddress(e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-1 outline-none font-mono text-sm uppercase" />
              <button onClick={updateMacAddress} className="bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-white text-xs">MAC Kaydet</button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <button 
            onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }}
            className="flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800 px-4 py-2 rounded-lg transition-colors border border-gray-700 hover:border-gray-500"
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
          <a href={`/client/${project.slug}`} target="_blank" className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-white text-sm font-medium">Müşteri Panelini Aç →</a>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Hızlı Üretim */}
        <div className="glass rounded-2xl p-6 shadow-xl border-t-4 border-blue-500">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Box size={20}/> Blok Bazlı Hızlı Üret</h3>
          <div className="space-y-4 mt-4">
            <input type="text" placeholder="Blok Adı (A Blok)" value={blockName} onChange={e=>setBlockName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none" />
            <div>
              <input type="number" placeholder="Toplam Kat Sayısı" value={floors} onChange={handleFloorsChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none mb-2" />
              {floorData.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                  {floorData.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 w-1/3 text-right">{i}. Kat Birim Sayısı:</span>
                      <input type="number" placeholder="Örn: 4" value={f.units_count} onChange={e => handleFloorDataChange(i, e.target.value)} className="w-2/3 bg-gray-900 border border-gray-700 rounded p-2 outline-none" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={generateBlocks} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded text-white font-medium">Bloku Üret</button>
          </div>
        </div>

        {/* Tekil Ekleme */}
        <div className="glass rounded-2xl p-6 shadow-xl border-t-4 border-pink-500">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Plus size={20}/> Tekil Özel Alan Ekle</h3>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <input type="text" placeholder="Blok/Bölge" value={singleBlock} onChange={e=>setSingleBlock(e.target.value)} className="w-1/2 bg-gray-900 border border-gray-700 rounded p-2 outline-none" />
              <input type="number" placeholder="Kat" value={singleFloor} onChange={e=>setSingleFloor(parseInt(e.target.value))} className="w-1/2 bg-gray-900 border border-gray-700 rounded p-2 outline-none" />
            </div>
            <input type="text" placeholder="Etiket (Havuz vs)" value={singleLabel} onChange={e=>setSingleLabel(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none" />
            <button onClick={addSingleUnit} className="w-full bg-pink-600 hover:bg-pink-500 py-2 rounded text-white font-medium">Alanı Ekle</button>
          </div>
        </div>
      </div>

      {/* Etiket Yönetimi */}
      <div className="glass rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Settings size={24} /> Mimari Etiketleri Özelleştir
          </h2>
          {units.length > 0 && (
            <button onClick={deleteAllUnits} className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              <Trash2 size={16} /> Tümünü Sil
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto pr-2 space-y-6">
          {Object.entries(groupedUnits).map(([block, blockUnits]) => (
            <div key={block} className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-700 pb-1">
                <h3 className="text-lg font-medium text-purple-400">{block}</h3>
                <button onClick={() => deleteBlock(block)} className="text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-0.5 rounded transition-colors border border-orange-500/20">
                  Bloğu Sil
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {blockUnits.map(u => (
                  <div key={u.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-gray-500 flex flex-col relative group transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-gray-400 text-xs font-medium">{u.block_name}</span>
                      <button onClick={() => deleteUnit(u.id)} className="text-red-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity" title="Bölümü Sil">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input type="text" className="bg-transparent border-b border-gray-600 outline-none text-white focus:border-blue-400 w-full text-sm pb-1" defaultValue={u.unit_label} onBlur={(e) => { if(e.target.value !== u.unit_label) updateUnitLabel(u.id, e.target.value) }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kalibrasyon */}
      <div className="glass rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none"></div>
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Play size={24}/> Görsel Kalibrasyon</h2>
          <div className="flex items-center gap-3">
            {isCalibrating && currentLedIndex > 0 && (
              <button onClick={undoCalibration} className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-medium text-white flex items-center gap-2">
                Son İşlemi Geri Al
              </button>
            )}
            <button onClick={toggleCalibration} className={`px-4 py-2 rounded font-medium ${isCalibrating ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}>
              {isCalibrating ? "Kalibrasyonu Bitir" : "Kalibrasyonu Başlat"}
            </button>
          </div>
        </div>
        {isCalibrating && (
          <div className="mb-4 text-blue-400 bg-blue-900/20 p-3 rounded-lg border border-blue-900">
            Şu an yanan Maket LED Sırası: <b className="text-white bg-blue-600 px-2 py-1 rounded">#{currentLedIndex}</b> Lütfen aşağıdan bu LED'in yandığı daireyi seçin.
          </div>
        )}
        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6">
          {Object.entries(groupedUnits).map(([block, blockUnits]) => (
            <div key={block} className="space-y-3">
              <h3 className="text-lg font-medium text-yellow-500 border-b border-gray-700 pb-1">{block}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {blockUnits.map(u => (
                  <div key={u.id} onClick={() => mapLed(u.id)} className={`p-3 rounded-lg border cursor-pointer transition-all ${u.physical_led_index !== null ? 'bg-green-900/20 border-green-700 hover:bg-green-900/40' : 'bg-gray-800 border-gray-700 hover:border-blue-500'}`}>
                    <div className="text-xs text-gray-500">{u.block_name}</div>
                    <div className="font-semibold">{u.unit_label}</div>
                    <div className={`text-xs mt-1 font-medium ${u.physical_led_index !== null ? 'text-green-400' : 'text-gray-500'}`}>
                      {u.physical_led_index !== null ? `✓ LED: ${u.physical_led_index}` : 'Eşleştirilmedi'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Renkler */}
        <div className="glass rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 flex justify-between items-center">
            <span className="flex items-center gap-2"><Layers size={20}/> Renk Yönetimi</span>
            <button onClick={addColorRow} className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-white">+ Durum Ekle</button>
          </h2>
          <div className="space-y-3 mb-4">
            {colors.map((c, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-900 p-2 rounded-lg border border-gray-800">
                <input type="color" value={c.hex_color} onChange={(e) => updateColorRow(idx, 'hex_color', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                <input type="text" value={c.label} onChange={(e) => updateColorRow(idx, 'label', e.target.value)} className="bg-transparent text-white border-b border-gray-700 p-1 flex-1 outline-none focus:border-blue-500" />
                <button onClick={() => removeColorRow(idx)} className="text-red-500 hover:text-red-400 font-bold p-2"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
          <button onClick={saveColors} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded text-white font-medium">Tüm Renkleri Kaydet</button>
        </div>

        {/* Kullanıcı */}
        <div className="glass rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2"><Users size={20}/> Müşteri (Satış) Erişimi</h2>
          <div className="space-y-3 mb-6">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-gray-900 p-2 rounded-lg border border-gray-800">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{u.username}</span>
                  <span className="text-xs text-gray-500 font-mono">Şifre: {u.password}</span>
                </div>
                <button onClick={() => deleteClientUser(u.id)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={16}/></button>
              </div>
            ))}
            {users.length === 0 && <div className="text-sm text-gray-500 italic">Henüz tanımlı bir kullanıcı yok.</div>}
          </div>

          <h3 className="text-sm font-medium text-gray-400 mb-2">Yeni Kullanıcı Ekle</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Kullanıcı Adı" value={cUser} onChange={e=>setCUser(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none focus:border-purple-500" />
            <input type="text" placeholder="Şifre" value={cPass} onChange={e=>setCPass(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none focus:border-purple-500" />
            <button onClick={saveClientUser} className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded text-white font-medium">Kullanıcıyı Ekle</button>
          </div>
        </div>
      </div>
    </div>
  );
}
