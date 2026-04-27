import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Copy, UserPlus, UserMinus, ArrowLeft, Trophy, Users } from 'lucide-react';
import { getUserProfile, getCurrentUser, toggleFollow, getFollowData } from '../services/db';

// ── Badge definitions ────────────────────────────────────────────────────────
const BADGES = [
    { id: 'first_step', icon: '🎯', label: 'Первый шаг',   desc: 'Первый сданный тест',          check: (r)      => r.some(x => x.passed) },
    { id: 'perfect',    icon: '⭐', label: 'Отличник',     desc: '100% правильных ответов',      check: (r)      => r.some(x => x.total > 0 && x.score === x.total) },
    { id: 'streak_3',   icon: '🔥', label: 'Три в ряд',    desc: '3 теста сданы подряд',         check: (r)      => streak(r) >= 3 },
    { id: 'streak_5',   icon: '🏆', label: 'Пятёрка!',     desc: '5 тестов сданы подряд',        check: (r)      => streak(r) >= 5 },
    { id: 'veteran',    icon: '🛡️', label: 'Ветеран',      desc: '10+ сданных тестов',           check: (r)      => r.filter(x => x.passed).length >= 10 },
    { id: 'author',     icon: '✍️', label: 'Автор',        desc: 'Создал публичный тест',        check: (r, tc)  => tc > 0 },
    { id: 'top',        icon: '👑', label: 'Топ-результат', desc: 'Средний балл выше 90%',       check: (r)      => r.length >= 3 && avgPct(r) >= 90 },
];

const streak = (r) => {
    const s = [...r].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cur = 0;
    for (let i = s.length - 1; i >= 0; i--) { if (s[i].passed) cur++; else break; }
    return cur;
};
const avgPct = (r) => r.length ? Math.round(r.reduce((acc, x) => acc + x.score / x.total, 0) / r.length * 100) : 0;

const AVATAR_GRADS = [
    'linear-gradient(135deg,#10b981,#06b6d4)',
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#ec4899,#f97316)',
    'linear-gradient(135deg,#06b6d4,#6366f1)',
];

export default function ProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [followData, setFollowData] = useState({ followerCount: 0, isFollowing: false });
    const [followLoading, setFollowLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => { loadProfile(); }, [userId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [pd, fd] = await Promise.all([
                getUserProfile(userId),
                getFollowData(userId, currentUser?.id || null),
            ]);
            if (!pd) { navigate('/'); return; }
            setProfile(pd);
            setFollowData(fd);
        } catch (err) {
            console.error('Profile load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser || currentUser.id === userId || followLoading) return;
        const was = followData.isFollowing;
        setFollowLoading(true);
        setFollowData(p => ({ isFollowing: !p.isFollowing, followerCount: p.followerCount + (p.isFollowing ? -1 : 1) }));
        try { await toggleFollow(currentUser.id, userId); }
        catch { setFollowData(p => ({ isFollowing: was, followerCount: p.followerCount + (was ? 1 : -1) })); }
        finally { setFollowLoading(false); }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true); setTimeout(() => setCopied(false), 2000);
        });
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-4 flex-col gap-6">
                {[180, 100, 160].map((h, i) => (
                    <div key={i} className="bento-card animate-pulse" style={{ height: h, background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)' }} />
                ))}
            </div>
        );
    }
    if (!profile) return null;

    const { user, results, createdTests } = profile;
    const passed = results.filter(r => r.passed);
    const best = results.length ? Math.max(...results.map(r => r.total > 0 ? Math.round(r.score / r.total * 100) : 0)) : 0;
    const avg = avgPct(results);
    const cur = streak(results);
    const avatarBg = AVATAR_GRADS[(user.name?.charCodeAt(0) || 0) % AVATAR_GRADS.length];
    const isOwn = currentUser?.id === userId;
    const earnedBadges = BADGES.filter(b => b.check(results, createdTests.length));

    const stats = [
        { label: 'Сдано тестов',    value: passed.length,                   color: '#10b981' },
        { label: 'Средний балл',     value: results.length ? `${avg}%` : '—', color: '#6366f1' },
        { label: 'Лучший результат', value: results.length ? `${best}%` : '—', color: '#f59e0b' },
        { label: 'Серия побед',      value: cur > 0 ? `${cur} 🔥` : '—',    color: '#ef4444' },
        { label: 'Создано тестов',   value: createdTests.length,             color: '#8b5cf6' },
        { label: 'Подписчики',       value: followData.followerCount,        color: '#06b6d4' },
    ];

    return (
        <div className="max-w-3xl mx-auto p-4 flex-col gap-6 animate-fade-in">

            {/* Back button */}
            {currentUser && (
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content', padding: '0.45rem 0.9rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white', color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                    <ArrowLeft size={15} /> Назад
                </button>
            )}

            {/* ── Header card ── */}
            <div className="bento-card" style={{ padding: '1.5rem 1.75rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.8rem', color: 'white', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                        {(user.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ margin: 0, fontSize: '1.45rem', lineHeight: 1.2 }}>{user.name}</h2>
                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            {user.role === 'admin' ? '👑 Администратор' : '👤 Сотрудник'}
                            {user.department && <> · <span style={{ fontWeight: 600 }}>{user.department}</span></>}
                        </p>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
                            {!isOwn && currentUser && (
                                <button
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: `1.5px solid ${followData.isFollowing ? 'rgba(16,185,129,0.3)' : '#e2e8f0'}`, background: followData.isFollowing ? 'rgba(16,185,129,0.08)' : 'white', color: followData.isFollowing ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: followLoading ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                                >
                                    {followData.isFollowing ? <><UserMinus size={15}/> Отписаться</> : <><UserPlus size={15}/> Следить</>}
                                </button>
                            )}
                            <button
                                onClick={copyLink}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: copied ? 'rgba(16,185,129,0.07)' : 'white', color: copied ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                            >
                                <Copy size={14}/> {copied ? 'Скопировано!' : 'Поделиться'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {stats.map(s => (
                    <div key={s.label} className="bento-card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.65rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.3rem', lineHeight: 1.3 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Badges ── */}
            {earnedBadges.length > 0 && (
                <div>
                    <h3 style={{ margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={18} style={{ color: '#f59e0b' }}/> Достижения
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {earnedBadges.map(b => (
                            <div key={b.id} title={b.desc} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.85rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.9)', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                <span style={{ fontSize: '1rem' }}>{b.icon}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Created tests ── */}
            {createdTests.length > 0 && (
                <div>
                    <h3 style={{ margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>📝</span> Тесты автора
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
                        {createdTests.map(test => (
                            <div key={test.id} className="bento-card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>{test.title}</div>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                                        {test.questions?.length || 0} вопр.
                                    </span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                                        {test.timeLimit / 60} мин.
                                    </span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.08)', color: 'var(--accent-primary)' }}>
                                        Балл: {test.passingScore}
                                    </span>
                                </div>
                                <Link
                                    to={`/test/${test.id}`}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '0.75rem', padding: '0.55rem', fontSize: '0.85rem', marginTop: 'auto', textDecoration: 'none' }}
                                >
                                    <Play size={13}/> Пройти тест
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {results.length === 0 && createdTests.length === 0 && (
                <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderStyle: 'dashed' }}>
                    <Users size={36} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 0.75rem' }}/>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>Активности пока нет</p>
                </div>
            )}
        </div>
    );
}
