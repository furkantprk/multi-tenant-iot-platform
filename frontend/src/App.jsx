import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminProject from './pages/AdminProject';
import AdminLogin from './pages/AdminLogin';
import ClientPanel from './pages/ClientPanel';
import ClientLogin from './pages/ClientLogin';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
        <div className="flex-grow">
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admin/project/:slug" element={<AdminProject />} />
            <Route path="/client" element={<ClientLogin />} />
            <Route path="/client/:slug" element={<ClientPanel />} />
          </Routes>
        </div>
        <footer className="text-center py-6 text-sm text-gray-500 border-t border-gray-800">
          © {new Date().getFullYear()} Tüm Hakları Saklıdır. | Developed by <a href="https://github.com/furkan" target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors font-semibold">Furkan</a>
        </footer>
      </div>
    </Router>
  );
}

export default App;
