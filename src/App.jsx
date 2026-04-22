import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, ShieldCheck } from 'lucide-react';
import { getCurrentUser, logout } from './services/db';

// Pages — lazy loaded for route-based code splitting
const Login = lazy(() => import('./components/Login'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TestEditor = lazy(() => import('./components/TestEditor'));
const ArticleEditor = lazy(() => import('./components/ArticleEditor'));
const EmployeeDashboard = lazy(() => import('./components/EmployeeDashboard'));
const TestRunner = lazy(() => import('./components/TestRunner'));
const ArticleViewer = lazy(() => import('./components/ArticleViewer'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{ width: '2rem', height: '2rem', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  </div>
);

const Layout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());

  // Sync user state when login/logout fires (db.js dispatches 'user-session-change')
  useEffect(() => {
    const handler = () => setUser(getCurrentUser());
    window.addEventListener('user-session-change', handler);
    return () => window.removeEventListener('user-session-change', handler);
  }, []);

  // Mouse Tracking Glow Effect (throttled via requestAnimationFrame)
  useEffect(() => {
    let rafId = null;
    const handleMouseMove = (e) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const el = e.target.closest('.bento-card, .btn');
        if (el) {
          const rect = el.getBoundingClientRect();
          el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
          el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        }
        rafId = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
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
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ width: '2.5rem', height: 'auto', borderRadius: '0.4rem', flexShrink: 0 }} 
            />
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
      <main className="container py-6">
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
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Pages with global layout (Header + Sidebar effects) */}
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
