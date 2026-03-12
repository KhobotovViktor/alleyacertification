import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ChevronDown } from 'lucide-react';
import { getAllUsers, login, getCurrentUser } from '../services/db';

export default function Login() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Redirect if already logged in
        const user = getCurrentUser();
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/employee');
            return;
        }

        const fetchUsers = async () => {
            try {
                const allUsers = await getAllUsers();
                setUsers(allUsers || []);
            } catch (err) {
                setError('Ошибка загрузки пользователей. Проверьте подключение.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [navigate]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setPassword('');
        setError('');
        setIsOpen(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(selectedUser.id, password);
            if (user) {
                if (user.role === 'admin') navigate('/admin');
                else navigate('/employee');
            } else {
                setError('Неверный пароль');
            }
        } catch (err) {
            setError('Ошибка авторизации. Проверьте подключение.');
        }
    };

    return (
        <div className="flex items-center justify-center w-full relative overflow-hidden min-h-screen bg-[var(--bg-primary)]">
            {/* Ambient Background glows for the whole page */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-[var(--accent-primary)] mix-blend-multiply opacity-[0.05] rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vh] bg-[#3b82f6] mix-blend-multiply opacity-[0.05] rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

            <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '3rem 1.5rem', gap: '2rem' }}>

                {/* Top: Logo and Branding */}
                <div className="animate-fade-in stagger-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                    <img src="/logo.png" alt="Аллея Мебели" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '1rem' }} />
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.02em', margin: 0 }}>
                        Тестирование сотрудников<br />«Аллея Мебели»
                    </h1>
                </div>

                {/* Right Side: Login Panel */}
                <div className="animate-fade-in stagger-2" style={{ width: '100%', maxWidth: '28rem' }}>
                    <div className="glass-panel" style={{ width: '100%', padding: '2rem 2.5rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'visible' }}>

                        {/* Decorative subtle top glow inside the card */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-30"></div>


                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Вход в систему</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Выберите свой профиль для продолжения</p>
                        </div>

                        <div style={{ marginBottom: '1rem', position: 'relative', zIndex: 20 }}>
                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className="form-control"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderRadius: '1rem', border: '2px solid transparent', background: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.04)' }}
                            >
                                <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: selectedUser ? 'var(--text-primary)' : '#94a3b8' }}>
                                    {isLoading ? 'Загрузка профилей...' : (selectedUser ? selectedUser.name : 'Выберите аккаунт...')}
                                </span>
                                <ChevronDown size={18} style={{ color: '#94a3b8', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                            </button>

                            {isOpen && !isLoading && (
                                <div className="custom-scrollbar animate-fade-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', maxHeight: '280px', overflowY: 'auto', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '0.5rem', boxShadow: '0 12px 24px -6px rgba(0,0,0,0.08)', zIndex: 30 }}>
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.15s', fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <span>{user.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                                                {user.role === 'admin' ? 'Администратор' : 'Сотрудник'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedUser && (
                            <form onSubmit={handleLogin} className="animate-fade-in relative z-10" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="form-group mb-0 relative">
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            className="form-control w-full p-4 pl-5 rounded-2xl border-2 border-transparent bg-white/70 hover:bg-white focus:bg-white focus:border-[var(--accent-primary)] shadow-sm outline-none transition-all placeholder-slate-400 font-medium tracking-widest text-lg"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div style={{ height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {error ? (
                                        <div className="text-danger text-sm animate-fade-in flex items-center justify-center gap-1 font-medium text-center">
                                            <ShieldCheck size={14} /> {error}
                                        </div>
                                    ) : (
                                        <div style={{ height: '1.25rem' }}></div>
                                    )}
                                </div>

                                <button type="submit" className="btn btn-primary w-full py-4 text-lg tracking-wide font-bold rounded-2xl shadow-lg hover:shadow-[0_10px_25px_rgba(3,152,0,0.3)] hover:-translate-y-1 transition-all">
                                    Продолжить
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
