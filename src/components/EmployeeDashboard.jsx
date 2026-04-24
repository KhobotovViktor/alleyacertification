import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Play, CheckCircle, Clock, AlertTriangle, FileText, BookOpen,
    Trophy, Star, Flame, Target, TrendingUp, Crown, Shield, Lock, Users
} from 'lucide-react';
import {
    getTestsSummary, getCurrentUser, getUserResults,
    getArticles, getArticleProgress, getDepartmentLeaderboard
} from '../services/db';
import { DashboardSkeleton } from './SkeletonLoader';

// ── Achievement definitions ──────────────────────────────────────────────────
const ACHIEVEMENTS = [
    {
        id: 'first_step',
        title: 'Первый шаг',
        desc: 'Пройдено первое тестирование',
        icon: <Play size={22} />,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.12)',
        border: 'rgba(16,185,129,0.25)',
        glow: '0 0 18px rgba(16,185,129,0.22)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1.5"/>
                <path d="M20 15 L34 24 L20 33 Z" fill="#10b981"/>
            </svg>
        ),
    },
    {
        id: 'perfect',
        title: 'Отличник',
        desc: '100% правильных ответов',
        icon: <Star size={22} />,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.3)',
        glow: '0 0 18px rgba(245,158,11,0.28)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1.5"/>
                <path d="M24 11 L27 20 H36 L29 26 L32 35 L24 29 L16 35 L19 26 L12 20 H21 Z" fill="#f59e0b"/>
            </svg>
        ),
    },
    {
        id: 'streak_3',
        title: 'Три в ряд',
        desc: '3 теста сданы подряд',
        icon: <Flame size={22} />,
        color: '#f97316',
        bg: 'rgba(249,115,22,0.12)',
        border: 'rgba(249,115,22,0.25)',
        glow: '0 0 18px rgba(249,115,22,0.22)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(249,115,22,0.12)" stroke="#f97316" strokeWidth="1.5"/>
                <path d="M24 36 C18 36 14 31 14 26 C14 21 18 17 20 14 C20 18 22 20 24 20 C22 17 23 13 26 11 C27 16 30 18 30 24 C30 21 28 20 27 20 C29 22 30 25 30 28 C30 33 27 36 24 36Z" fill="#f97316"/>
            </svg>
        ),
    },
    {
        id: 'streak_5',
        title: 'Пятёрка!',
        desc: '5 тестов сданы подряд',
        icon: <Trophy size={22} />,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.25)',
        glow: '0 0 18px rgba(239,68,68,0.2)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5"/>
                <path d="M16 14 H32 L29 26 C29 29 26.5 31 24 31 C21.5 31 19 29 19 26 Z" fill="#ef4444"/>
                <path d="M14 14 L16 14 L15 20 C14 22 12 22 12 20 Z" fill="#ef4444" opacity="0.6"/>
                <path d="M34 14 L32 14 L33 20 C34 22 36 22 36 20 Z" fill="#ef4444" opacity="0.6"/>
                <rect x="20" y="31" width="8" height="3" rx="1" fill="#ef4444" opacity="0.7"/>
                <rect x="17" y="34" width="14" height="2.5" rx="1.25" fill="#ef4444"/>
            </svg>
        ),
    },
    {
        id: 'sharpshooter',
        title: 'Снайпер',
        desc: '90%+ в трёх разных тестах',
        icon: <Target size={22} />,
        color: '#8b5cf6',
        bg: 'rgba(139,92,246,0.1)',
        border: 'rgba(139,92,246,0.25)',
        glow: '0 0 18px rgba(139,92,246,0.22)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" strokeWidth="1.5"/>
                <circle cx="24" cy="24" r="11" stroke="#8b5cf6" strokeWidth="1.5" fill="none"/>
                <circle cx="24" cy="24" r="6" stroke="#8b5cf6" strokeWidth="1.5" fill="none"/>
                <circle cx="24" cy="24" r="2.5" fill="#8b5cf6"/>
                <line x1="24" y1="13" x2="24" y2="10" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="24" y1="35" x2="24" y2="38" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="13" y1="24" x2="10" y2="24" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="35" y1="24" x2="38" y2="24" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        ),
    },
    {
        id: 'persistent',
        title: 'Настойчивый',
        desc: 'Сдал тест с повторной попытки',
        icon: <TrendingUp size={22} />,
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.1)',
        border: 'rgba(59,130,246,0.25)',
        glow: '0 0 18px rgba(59,130,246,0.2)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="1.5"/>
                <polyline points="12,30 19,22 24,27 36,15" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <polyline points="30,15 36,15 36,21" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
        ),
    },
    {
        id: 'all_tests',
        title: 'Всезнайка',
        desc: 'Сдал все доступные тесты',
        icon: <Crown size={22} />,
        color: '#ec4899',
        bg: 'rgba(236,72,153,0.1)',
        border: 'rgba(236,72,153,0.25)',
        glow: '0 0 18px rgba(236,72,153,0.22)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(236,72,153,0.1)" stroke="#ec4899" strokeWidth="1.5"/>
                <path d="M13 33 L13 22 L19 28 L24 14 L29 28 L35 22 L35 33 Z" fill="#ec4899" fillOpacity="0.85"/>
                <rect x="13" y="33" width="22" height="2.5" rx="1.25" fill="#ec4899"/>
            </svg>
        ),
    },
    {
        id: 'veteran',
        title: 'Ветеран',
        desc: '10 пройденных тестирований',
        icon: <Shield size={22} />,
        color: '#64748b',
        bg: 'rgba(100,116,139,0.1)',
        border: 'rgba(100,116,139,0.22)',
        glow: '0 0 14px rgba(100,116,139,0.18)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(100,116,139,0.1)" stroke="#64748b" strokeWidth="1.5"/>
                <path d="M24 12 L34 16 L34 25 C34 30.5 29.5 35 24 37 C18.5 35 14 30.5 14 25 L14 16 Z" fill="#64748b" fillOpacity="0.2" stroke="#64748b" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M19 24 L22.5 27.5 L29 21" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
];

// ── Compute earned achievements ──────────────────────────────────────────────
const computeAchievements = (results, availableTestCount) => {
    if (!results.length) return [];
    const sorted = [...results].sort((a, b) => new Date(a.date) - new Date(b.date));
    const earned = new Set();

    earned.add('first_step');

    if (results.some(r => r.total > 0 && r.score === r.total)) earned.add('perfect');

    let streak = 0, maxStreak = 0;
    for (const r of sorted) {
        if (r.passed) { streak++; maxStreak = Math.max(maxStreak, streak); }
        else streak = 0;
    }
    if (maxStreak >= 3) earned.add('streak_3');
    if (maxStreak >= 5) earned.add('streak_5');

    const highScoreTests = new Set(
        results.filter(r => r.total > 0 && r.score / r.total >= 0.9).map(r => r.testId)
    );
    if (highScoreTests.size >= 3) earned.add('sharpshooter');

    const byTest = {};
    for (const r of sorted) {
        (byTest[r.testId] = byTest[r.testId] || []).push(r);
    }
    const persistent = Object.values(byTest).some(attempts => {
        let hadFail = false;
        for (const a of attempts) {
            if (!a.passed) hadFail = true;
            else if (hadFail) return true;
        }
        return false;
    });
    if (persistent) earned.add('persistent');

    const passedTestIds = new Set(sorted.filter(r => r.passed).map(r => r.testId));
    if (availableTestCount > 0 && passedTestIds.size >= availableTestCount) earned.add('all_tests');

    if (results.length >= 10) earned.add('veteran');

    return [...earned];
};

// ── SVG Progress Chart ───────────────────────────────────────────────────────
const ProgressChart = ({ results }) => {
    const sorted = [...results]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-20);

    if (sorted.length < 2) {
        return (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', opacity: 0.65 }}>
                {sorted.length === 0
                    ? 'Пройдите первый тест — здесь появится ваш прогресс'
                    : 'Нужно минимум 2 попытки для отображения графика'}
            </div>
        );
    }

    const PL = 46, PT = 14, PB = 140, W = 580, H = 172;
    const chartW = W - PL - 22;
    const chartH = PB - PT;
    const n = sorted.length;

    const pts = sorted.map((r, i) => {
        const pct = r.total > 0 ? Math.round(r.score / r.total * 100) : 0;
        return {
            x: PL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW),
            y: PT + (1 - pct / 100) * chartH,
            pct,
            passed: r.passed,
            date: new Date(r.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        };
    });

    const polyPts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPts = `${PL},${PB} ${polyPts} ${pts[n - 1].x.toFixed(1)},${PB}`;
    const y70 = PT + 0.3 * chartH;
    const xLabels = [...new Set([0, Math.round((n - 1) / 2), n - 1])];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
            <defs>
                <linearGradient id="progAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28"/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01"/>
                </linearGradient>
            </defs>

            {/* Grid + Y labels */}
            {[0, 25, 50, 75, 100].map(pct => {
                const y = PT + (1 - pct / 100) * chartH;
                return (
                    <g key={pct}>
                        <line x1={PL} y1={y} x2={PL + chartW} y2={y} stroke="#f1f5f9" strokeWidth="1"/>
                        <text x={PL - 7} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{pct}%</text>
                    </g>
                );
            })}

            {/* Threshold at 70% */}
            <line x1={PL} y1={y70} x2={PL + chartW} y2={y70} stroke="#10b981" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.45"/>
            <text x={PL + 5} y={y70 - 4} fontSize="8" fill="#10b981" opacity="0.6">порог</text>

            {/* X axis */}
            <line x1={PL} y1={PB} x2={PL + chartW} y2={PB} stroke="#e2e8f0" strokeWidth="1"/>

            {/* Area fill */}
            <polygon points={areaPts} fill="url(#progAreaGrad)"/>

            {/* Line */}
            <polyline points={polyPts} fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>

            {/* Data points */}
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill={p.passed ? '#10b981' : '#ef4444'} stroke="white" strokeWidth="2"/>
                    <title>{p.date}: {p.pct}% ({p.passed ? 'Сдано' : 'Не сдано'})</title>
                </g>
            ))}

            {/* X labels */}
            {xLabels.map(i => (
                <text key={i} x={pts[i].x} y={H - 5} textAnchor="middle" fontSize="9" fill="#94a3b8">{pts[i].date}</text>
            ))}
        </svg>
    );
};

// ── Main component ───────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [results, setResults] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tests');
    const user = getCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user?.id]);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [allTests, allArticles, userRes, userArticleProgress, deptBoard] = await Promise.all([
                getTestsSummary(),
                getArticles(),
                getUserResults(user.id),
                getArticleProgress(user.id),
                user.department ? getDepartmentLeaderboard(user.department) : Promise.resolve([]),
            ]);

            const filteredTests = allTests.filter(t =>
                (t.status || 'published') !== 'draft' &&
                (!t.allowedUsers || t.allowedUsers.length === 0 || t.allowedUsers.includes(user.id))
            );
            const filteredArticles = allArticles.filter(a =>
                !a.allowedUsers || a.allowedUsers.length === 0 || a.allowedUsers.includes(user.id)
            );

            const testsWithStats = filteredTests.map(t => {
                const testResults = userRes.filter(r => r.testId === t.id);
                return {
                    ...t,
                    attemptsCount: testResults.length,
                    bestResult: testResults.sort((a, b) => b.score - a.score)[0] || null,
                    articleCompleted: !t.requiredArticleId || userArticleProgress.some(p => p.articleId === t.requiredArticleId),
                    requiredArticle: t.requiredArticleId ? allArticles.find(a => a.id === t.requiredArticleId) : null,
                };
            });

            setTests(testsWithStats);
            setArticles(filteredArticles);
            setResults(userRes);
            setLeaderboard(deptBoard || []);
        } catch (err) {
            console.error('Failed to load employee dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <DashboardSkeleton />;

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    // ── Derived stats ──
    const earnedAchievements = computeAchievements(results, tests.length);

    const sortedByDate = [...results].sort((a, b) => new Date(a.date) - new Date(b.date));
    let currentStreak = 0;
    for (let i = sortedByDate.length - 1; i >= 0; i--) {
        if (sortedByDate[i].passed) currentStreak++;
        else break;
    }
    const bestPct = results.length > 0
        ? Math.max(...results.map(r => r.total > 0 ? Math.round(r.score / r.total * 100) : 0))
        : 0;

    const myRank = leaderboard.findIndex(u => u.id === user.id) + 1;

    const tabs = [
        { key: 'tests',         icon: <Play size={16} />,      label: 'Тесты' },
        { key: 'results',       icon: <CheckCircle size={16} />, label: 'Результаты' },
        { key: 'articles',      icon: <BookOpen size={16} />,   label: 'Материалы' },
        { key: 'trainingStats', icon: <Clock size={16} />,      label: 'Статистика' },
        { key: 'progress',      icon: <Trophy size={16} />,     label: 'Прогресс' },
    ];

    return (
        <div className="flex-col gap-6">

            {/* ── Bento header ── */}
            <div className="bento-grid mb-8">
                <div className="bento-card bento-card-large bg-gradient-to-br from-white to-slate-50">
                    <div className="flex-col justify-center h-full">
                        <div className="flex items-center gap-4 mb-2">
                            <div>
                                <h2 className="m-0 leading-tight">Привет, {user.name}!</h2>
                                <p className="m-0 text-secondary opacity-70 mt-0.5">{user.role === 'admin' ? 'Администратор' : 'Сотрудник'}</p>
                            </div>
                        </div>
                        <p className="m-0 text-sm text-secondary opacity-80">Готов к сегодняшним достижениям? Твой прогресс выглядит отлично.</p>
                    </div>
                </div>

                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle size={18}/></div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Тесты сданы</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{results.filter(r => r.passed).length}</div>
                    <p className="text-[11px] text-secondary opacity-60 m-0 mt-1">Верных ответов выше порога</p>
                </div>

                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Clock size={18}/></div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Средний балл</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">
                        {results.length > 0
                            ? Math.round(results.reduce((acc, r) => acc + r.score / r.total, 0) / results.length * 100)
                            : 0}%
                    </div>
                    <p className="text-[11px] text-secondary opacity-60 m-0 mt-1">Отношение верных к общему числу</p>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', borderRadius: '0.75rem',
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                background: activeTab === tab.key ? 'white' : 'transparent',
                                color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {tab.icon}
                            <span className="mobile-text-sm">{tab.label}</span>
                            {tab.key === 'progress' && earnedAchievements.length > 0 && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 4px',
                                    background: activeTab === 'progress' ? 'var(--accent-primary)' : 'rgba(16,185,129,0.12)',
                                    color: activeTab === 'progress' ? 'white' : 'var(--accent-primary)',
                                    fontSize: '0.65rem', fontWeight: 800,
                                }}>
                                    {earnedAchievements.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tests ── */}
            {activeTab === 'tests' && (
                <div className="bento-grid">
                    {tests.map((test, index) => {
                        const isBlocked = test.maxAttempts > 0 && test.attemptsCount >= test.maxAttempts;
                        const hasPassed = test.bestResult?.passed;
                        return (
                            <div key={test.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`}>
                                <div className="flex-col gap-1 mb-4 pr-6">
                                    <h3 className="text-lg font-bold text-primary leading-tight">{test.title}</h3>
                                </div>
                                <div className="flex-col gap-2.5 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-accent-primary"><Clock size={14}/></div>
                                        <span>{test.timeLimit / 60} мин</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-success"><CheckCircle size={14}/></div>
                                        <span className="mobile-text-sm">Порог: {test.passingScore} балла</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <div className={`w-6 h-6 rounded bg-slate-50 flex items-center justify-center ${isBlocked && !hasPassed ? 'text-danger' : 'text-warning'}`}><AlertTriangle size={14}/></div>
                                        <span className="mobile-text-sm">Попытки: {test.attemptsCount} / {test.maxAttempts === 0 ? '∞' : test.maxAttempts}</span>
                                    </div>
                                </div>
                                <div className="mt-auto flex-col gap-2">
                                    {hasPassed && (
                                        <div className="btn w-full btn-secondary text-sm bg-success/5 text-success border-success/10 flex justify-center items-center gap-2 pointer-events-none" style={{ padding: '0.875rem' }}>
                                            <CheckCircle size={18}/><span className="font-bold">Тест успешно сдан</span>
                                        </div>
                                    )}
                                    {!test.articleCompleted ? (
                                        <Link to={`/article/${test.requiredArticleId}`} className="btn w-full btn-secondary warning overflow-hidden text-ellipsis whitespace-nowrap text-xs flex justify-center items-center gap-1 bg-warning/10 text-warning border-warning/30 hover:bg-warning/20" style={{ padding: '0.875rem' }}>
                                            <AlertTriangle size={14}/><span className="truncate">Изучить: {test.requiredArticle?.title || 'Материал'}</span>
                                        </Link>
                                    ) : isBlocked ? (
                                        <button className="btn w-full btn-secondary text-sm opacity-50" disabled style={{ padding: '0.875rem' }}>Попытки исчерпаны</button>
                                    ) : (
                                        <button onClick={() => navigate(`/test/${test.id}`)} className="btn btn-primary w-full flex justify-center gap-2 relative overflow-hidden group" style={{ padding: '0.875rem' }}>
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"/>
                                            <Play size={18} className="relative z-10"/>
                                            <span className="relative z-10 font-bold">{hasPassed ? 'Пройти снова' : 'Начать тест'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {tests.length === 0 && (
                        <div className="bento-card col-span-full p-8 text-center text-secondary border-dashed">Нет доступных тестов.</div>
                    )}
                </div>
            )}

            {/* ── Articles ── */}
            {activeTab === 'articles' && (
                <div className="bento-grid">
                    {articles.map((article, index) => (
                        <div key={article.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1} border-l-4 border-l-accent-primary`}>
                            <h3 className="text-lg font-bold text-primary mb-4 leading-tight">{article.title}</h3>
                            <div className="flex items-center gap-2 text-secondary px-3 py-1 bg-slate-50 w-fit rounded-lg text-[10px] font-bold uppercase tracking-wider opacity-60 mb-6">
                                <FileText size={12}/><span>Материал</span>
                            </div>
                            <div className="mt-auto">
                                <Link to={`/article/${article.id}`} className="btn btn-secondary w-full flex justify-center gap-2 font-bold py-3">
                                    <BookOpen size={18}/> Читать
                                </Link>
                            </div>
                        </div>
                    ))}
                    {articles.length === 0 && (
                        <div className="bento-card col-span-full p-8 text-center text-secondary border-dashed">Нет обучающих материалов.</div>
                    )}
                </div>
            )}

            {/* ── Results ── */}
            {activeTab === 'results' && (
                <div className="animate-fade-in">
                    <div className="scroll-hint">Листайте таблицу вправо →</div>
                    <div className="card table-container p-0 overflow-hidden">
                        <table className="w-full min-w-[500px]">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-white/30">
                                    <th className="text-center py-4 px-3 font-black uppercase tracking-[0.1em] text-secondary">Тест</th>
                                    <th className="text-center py-4 px-3 font-black uppercase tracking-[0.1em] text-secondary">Баллы</th>
                                    <th className="text-center py-4 px-3 font-black uppercase tracking-[0.1em] text-secondary">Дата</th>
                                    <th className="text-center py-4 px-3 font-black uppercase tracking-[0.1em] text-secondary">Статус</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {results.map(res => {
                                    const testName = tests.find(t => t.id === res.testId)?.title || 'Тест удалён';
                                    return (
                                        <tr key={res.id} className="hover:bg-accent-primary/5 transition-colors">
                                            <td className="py-4 px-3 font-medium text-center text-sm">{testName}</td>
                                            <td className="py-4 px-3 text-center">
                                                <span className="font-bold">{res.score}</span><span className="opacity-40"> / {res.total}</span>
                                            </td>
                                            <td className="py-4 px-3 text-[11px] text-secondary text-center">{formatDate(res.date)}</td>
                                            <td className="py-4 px-3 text-center">
                                                <span className={`badge ${res.passed ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex' }}>
                                                    {res.passed ? 'Сдано' : 'Не сдано'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {results.length === 0 && (
                                    <tr><td colSpan="4" className="py-12 text-center text-secondary font-medium italic">Вы ещё не проходили тесты.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Training Stats ── */}
            {activeTab === 'trainingStats' && (
                <div className="card animate-fade-in" style={{ padding: '1rem' }}>
                    <div className="flex-col gap-2">
                        {articles.map(article => {
                            const isCompleted = tests.find(t => t.requiredArticleId === article.id)?.articleCompleted;
                            return (
                                <div key={article.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-[var(--border-color)] gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'}`}>
                                            {isCompleted ? <CheckCircle size={16}/> : <BookOpen size={16}/>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate">{article.title}</div>
                                            <div className="text-[10px] font-bold text-secondary uppercase opacity-50">{isCompleted ? 'Изучен' : 'В процессе'}</div>
                                        </div>
                                    </div>
                                    <Link to={`/article/${article.id}`} className="btn btn-secondary py-1 px-3 text-xs shrink-0 font-bold">Открыть</Link>
                                </div>
                            );
                        })}
                        {articles.length === 0 && <div className="py-8 text-center text-secondary font-medium">Нет данных.</div>}
                    </div>
                </div>
            )}

            {/* ── Progress (NEW) ── */}
            {activeTab === 'progress' && (
                <div className="flex-col gap-6 animate-fade-in">

                    {/* ── Achievements ── */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div>
                                <h3 className="m-0 flex items-center gap-2">
                                    <Trophy size={18} className="text-accent-primary"/> Достижения
                                </h3>
                                <p className="text-xs text-secondary m-0 mt-1 opacity-70">
                                    Получено: {earnedAchievements.length} из {ACHIEVEMENTS.length}
                                </p>
                            </div>
                            {/* Progress bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: '90px', height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(earnedAchievements.length / ACHIEVEMENTS.length) * 100}%`,
                                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                                        borderRadius: '3px', transition: 'width 0.6s ease',
                                    }}/>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                    {Math.round(earnedAchievements.length / ACHIEVEMENTS.length * 100)}%
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: '0.875rem' }}>
                            {ACHIEVEMENTS.map(a => {
                                const unlocked = earnedAchievements.includes(a.id);
                                return (
                                    <div
                                        key={a.id}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            padding: '1.1rem 0.75rem 0.9rem', borderRadius: '1rem', textAlign: 'center',
                                            background: unlocked ? a.bg : '#f8fafc',
                                            border: `1.5px solid ${unlocked ? a.border : '#e8ecf0'}`,
                                            boxShadow: unlocked ? a.glow : 'none',
                                            opacity: unlocked ? 1 : 0.5,
                                            transition: 'all 0.3s',
                                        }}
                                    >
                                        {/* SVG icon or lock */}
                                        <div style={{
                                            width: 56, height: 56, borderRadius: '50%',
                                            background: unlocked ? 'white' : '#f1f5f9',
                                            border: `2px solid ${unlocked ? a.border : '#e2e8f0'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: '0.625rem', flexShrink: 0,
                                            boxShadow: unlocked ? `0 2px 8px ${a.bg}` : 'none',
                                            transition: 'all 0.3s',
                                        }}>
                                            {unlocked
                                                ? a.svg
                                                : <Lock size={18} style={{ color: '#cbd5e1' }}/>
                                            }
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '0.25rem', lineHeight: 1.25 }}>
                                            {a.title}
                                        </div>
                                        <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', lineHeight: 1.35, opacity: unlocked ? 0.75 : 0.55 }}>
                                            {a.desc}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Progress chart ── */}
                    <div className="card">
                        <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
                            <div>
                                <h3 className="m-0 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-accent-primary"/> График прогресса
                                </h3>
                                <p className="text-xs text-secondary m-0 mt-1 opacity-65">
                                    Последние {Math.min(results.length, 20)} попыток · зелёный = сдано, красный = не сдано
                                </p>
                            </div>
                            {results.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '2rem', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', fontSize: '0.75rem', fontWeight: 700, color: '#f97316' }}>
                                        <Flame size={12}/> Серия: {currentStreak}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '2rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                                        <Star size={12}/> Рекорд: {bestPct}%
                                    </div>
                                </div>
                            )}
                        </div>
                        <ProgressChart results={results}/>
                    </div>

                    {/* ── Department leaderboard ── */}
                    {user.department ? (
                        leaderboard.length > 1 ? (
                            <div className="card">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                    <div>
                                        <h3 className="m-0 flex items-center gap-2">
                                            <Users size={18} className="text-accent-primary"/> Рейтинг отдела
                                        </h3>
                                        <p className="text-xs text-secondary m-0 mt-1 opacity-70">
                                            {user.department} · {leaderboard.length} участников
                                        </p>
                                    </div>
                                    {myRank > 0 && (
                                        <div style={{ padding: '0.3rem 0.85rem', borderRadius: '2rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                            Ваше место: #{myRank}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {leaderboard.map((entry, i) => {
                                        const pos = i + 1;
                                        const isMe = entry.id === user.id;
                                        const maxPassed = leaderboard[0]?.passedCount || 1;
                                        const barWidth = maxPassed > 0 ? (entry.passedCount / maxPassed) * 100 : 0;
                                        const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null;

                                        return (
                                            <div
                                                key={entry.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                    padding: '0.75rem 1rem', borderRadius: '0.875rem',
                                                    background: isMe ? 'rgba(16,185,129,0.05)' : 'white',
                                                    border: `1.5px solid ${isMe ? 'rgba(16,185,129,0.22)' : '#f1f5f9'}`,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {/* Rank */}
                                                <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                                                    {medal
                                                        ? <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{medal}</span>
                                                        : <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>#{pos}</span>
                                                    }
                                                </div>

                                                {/* Avatar */}
                                                <div style={{
                                                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                                    background: isMe ? 'rgba(16,185,129,0.12)' : '#f1f5f9',
                                                    color: isMe ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '0.875rem',
                                                }}>
                                                    {entry.name.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Name + progress bar */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                                        <span style={{ fontWeight: isMe ? 700 : 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {entry.name}
                                                        </span>
                                                        {isMe && (
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '0.35rem', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-primary)', flexShrink: 0 }}>вы</span>
                                                        )}
                                                    </div>
                                                    <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${barWidth}%`, background: isMe ? 'var(--accent-primary)' : '#94a3b8', borderRadius: '2px', transition: 'width 0.7s ease' }}/>
                                                    </div>
                                                </div>

                                                {/* Passed count */}
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isMe ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{entry.passedCount}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.65 }}>сдано</div>
                                                </div>

                                                {/* Avg % */}
                                                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 40 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: entry.avgPct >= 80 ? 'var(--success)' : entry.avgPct >= 55 ? '#f59e0b' : 'var(--text-secondary)' }}>
                                                        {entry.totalAttempts > 0 ? `${entry.avgPct}%` : '—'}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.65 }}>средний</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="card">
                                <h3 className="m-0 mb-2 flex items-center gap-2"><Users size={18} className="text-accent-primary"/> Рейтинг отдела</h3>
                                <div className="py-6 text-center text-secondary text-sm" style={{ opacity: 0.65 }}>
                                    В вашем отделе пока только вы. Рейтинг появится, когда добавят коллег.
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="card">
                            <h3 className="m-0 mb-2 flex items-center gap-2"><Users size={18} className="text-accent-primary"/> Рейтинг отдела</h3>
                            <div className="py-6 text-center text-secondary text-sm" style={{ opacity: 0.65 }}>
                                Вы не состоите в отделе. Обратитесь к администратору, чтобы получить доступ к рейтингу.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
