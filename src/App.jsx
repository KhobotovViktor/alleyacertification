import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, BookOpen, ShieldCheck } from 'lucide-react';
import { getCurrentUser, logout } from './services/db';


// Pages
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TestEditor from './components/TestEditor';
import ArticleEditor from './components/ArticleEditor';
import EmployeeDashboard from './components/EmployeeDashboard';
import TestRunner from './components/TestRunner';
import ArticleViewer from './components/ArticleViewer';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location.pathname]);

  // Mouse Tracking Glow Effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const el = e.target.closest('.bento-card, .btn');
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <Outlet />;

  return (
    <>
      <header className="app-header">
        <div className="app-header-island">
          <Link to="/" className="logo flex items-center gap-2" style={{ minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.6rem', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #10b981 100%)', color: 'white', boxShadow: '0 4px 10px rgba(16,185,129,0.3)', flexShrink: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <span className="font-semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Тестирование сотрудников &laquo;Аллея Мебели&raquo;
            </span>
          </Link>
          <div className="user-controls" style={{ flexShrink: 0 }}>
            <div className="user-info">
              <div className="user-avatar">{user.name.charAt(0)}</div>
              <span className="mobile-hide">{user.name}</span>
            </div>
            <button className="btn btn-secondary flex items-center gap-2" onClick={handleLogout} style={{ padding: '0.5rem' }}>
              <LogOut size={16} /><span className="logout-text mobile-hide">Выйти</span>
            </button>
          </div>
        </div>
      </header>
      <main className="container p-6 animate-fade-in">
        <Outlet />
      </main>
    </>
  );
};

const ProtectedRoute = ({ allowedRoles }) => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const IndexRoute = () => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'employee') return <Navigate to="/employee" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<IndexRoute />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/test/new" element={<TestEditor />} />
            <Route path="/admin/test/:id" element={<TestEditor />} />
            <Route path="/admin/article/new" element={<ArticleEditor />} />
            <Route path="/admin/article/:id" element={<ArticleEditor />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
            <Route path="/employee" element={<EmployeeDashboard />} />
          </Route>

          <Route path="/test/:id" element={<TestRunner />} />
          <Route path="/article/:id" element={<ArticleViewer />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
