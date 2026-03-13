import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle, Clock, AlertTriangle, FileText, BookOpen, Users } from 'lucide-react';
import { 
    getTests, 
    getCurrentUser, 
    getTestAttemptsCount, 
    getUserResults, 
    getArticles, 
    getArticleProgress 
} from '../services/db';
import { DashboardSkeleton } from './SkeletonLoader';

export default function EmployeeDashboard() {
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const user = getCurrentUser();

    useEffect(() => {
        if (user) {
            loadDashboardData();
        }
    }, [user?.id]);

    const [activeTab, setActiveTab] = useState('tests');

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [allTests, allArticles, userRes, articleProg] = await Promise.all([
                getTests(),
                getArticles(),
                getUserResults(user.id),
                getArticleProgress()
            ]);

            const filteredTests = allTests.filter(t => !t.allowedUsers || t.allowedUsers.length === 0 || t.allowedUsers.includes(user.id));
            const filteredArticles = allArticles.filter(a => !a.allowedUsers || a.allowedUsers.length === 0 || a.allowedUsers.includes(user.id));
            const userArticleProgress = articleProg.filter(p => p.userId === user.id);

            // Fetch attempt counts in parallel for filtered tests
            const testsWithStatsPromises = filteredTests.map(async (t) => {
                const attemptsCount = await getTestAttemptsCount(user.id, t.id);
                
                // Identify if required article is completed from pre-fetched articleProg
                const isArticleCompleted = !t.requiredArticleId || userArticleProgress.some(p => p.articleId === t.requiredArticleId);

                return {
                    ...t,
                    attemptsCount,
                    bestResult: userRes.filter(r => r.testId === t.id).sort((a, b) => b.score - a.score)[0] || null,
                    articleCompleted: isArticleCompleted,
                    requiredArticle: t.requiredArticleId ? allArticles.find(a => a.id === t.requiredArticleId) : null
                };
            });

            const testsWithStats = await Promise.all(testsWithStatsPromises);

            setTests(testsWithStats);
            setArticles(filteredArticles);
            setResults(userRes);
        } catch (err) {
            console.error('Failed to load employee dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex-col gap-6">
            {/* Bento Header Section */}
            <div className="bento-grid mb-8">
                {/* Welcome Card */}
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

                {/* Stat: Tests Passed */}
                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle size={18} />
                        </div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Тесты сданы</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{results.filter(r => r.passed).length}</div>
                    <p className="text-[11px] text-secondary opacity-60 m-0 mt-1">Верных ответов выше порога</p>
                </div>

                {/* Stat: Average Score */}
                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Clock size={18} />
                        </div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Средний балл</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">
                        {results.length > 0 
                            ? Math.round(results.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / results.length * 100) 
                            : 0}%
                    </div>
                    <p className="text-[11px] text-secondary opacity-60 m-0 mt-1">Отношение верных к общему числу</p>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {[
                        { key: 'tests', icon: <Play size={16} />, label: 'Тесты' },
                        { key: 'results', icon: <CheckCircle size={16} />, label: 'Результаты' },
                        { key: 'articles', icon: <BookOpen size={16} />, label: 'Материалы' },
                        { key: 'trainingStats', icon: <Clock size={16} />, label: 'Статистика' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', borderRadius: '0.75rem',
                                border: 'none',
                                cursor: 'pointer', transition: 'all 0.2s',
                                background: activeTab === tab.key ? 'white' : 'transparent',
                                color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {tab.icon} <span className="mobile-text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

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
                                        <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-accent-primary">
                                            <Clock size={14} />
                                        </div>
                                        <span>{test.timeLimit / 60} мин</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-success">
                                            <CheckCircle size={14} />
                                        </div>
                                        <span className="mobile-text-sm">Порог: {test.passingScore} балла</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <div className={`w-6 h-6 rounded bg-slate-50 flex items-center justify-center ${isBlocked && !hasPassed ? 'text-danger' : 'text-warning'}`}>
                                            <AlertTriangle size={14} />
                                        </div>
                                        <span className="mobile-text-sm">Попытки: {test.attemptsCount} / {test.maxAttempts === 0 ? '∞' : test.maxAttempts}</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex-col gap-2">
                                    {hasPassed && (
                                        <div className="btn w-full btn-secondary text-sm bg-success/5 text-success border-success/10 flex justify-center items-center gap-2 pointer-events-none" style={{ padding: '0.875rem' }}>
                                            <CheckCircle size={18} /> <span className="font-bold">Тест успешно сдан</span>
                                        </div>
                                    )}
                                    {!test.articleCompleted ? (
                                        <Link to={`/article/${test.requiredArticleId}`} className="btn w-full btn-secondary warning overflow-hidden text-ellipsis whitespace-nowrap text-xs flex justify-center items-center gap-1 bg-warning/10 text-warning border-warning/30 hover:bg-warning/20" style={{ padding: '0.875rem' }}>
                                            <AlertTriangle size={14} /> <span className="truncate">Изучить: {test.requiredArticle?.title || 'Материал'}</span>
                                        </Link>
                                    ) : isBlocked ? (
                                        <button className="btn w-full btn-secondary text-sm opacity-50" disabled style={{ padding: '0.875rem' }}>
                                            Попытки исчерпаны
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { window.location.href = `/test/${test.id}`; }}
                                            className="btn btn-primary w-full flex justify-center gap-2 relative overflow-hidden group"
                                            style={{ padding: '0.875rem' }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                            <Play size={18} className="relative z-10" /> <span className="relative z-10 font-bold">{hasPassed ? 'Пройти снова' : 'Начать тест'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {tests.length === 0 && (
                        <div className="bento-card col-span-full p-8 text-center text-secondary border-dashed">
                            Нет доступных тестов.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'articles' && (
                <div className="bento-grid">
                    {articles.map((article, index) => (
                        <div key={article.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1} border-l-4 border-l-accent-primary`}>
                            <h3 className="text-lg font-bold text-primary mb-4 leading-tight">{article.title}</h3>
                            <div className="flex items-center gap-2 text-secondary px-3 py-1 bg-slate-50 w-fit rounded-lg text-[10px] font-bold uppercase tracking-wider opacity-60 mb-6">
                                <FileText size={12} />
                                <span>Материал</span>
                            </div>
                            <div className="mt-auto">
                                <Link to={`/article/${article.id}`} className="btn btn-secondary w-full flex justify-center gap-2 font-bold py-3">
                                    <BookOpen size={18} /> Читать
                                </Link>
                            </div>
                        </div>
                    ))}
                    {articles.length === 0 && (
                        <div className="bento-card col-span-full p-8 text-center text-secondary border-dashed">
                            Нет обучающих материалов.
                        </div>
                    )}
                </div>
            )}

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
                                {results.map((res, idx) => {
                                    const testName = tests.find(t => t.id === res.testId)?.title || 'Тест удален';
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
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-secondary font-medium italic">Вы еще не проходили тесты.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'trainingStats' && (
                <div className="card animate-fade-in" style={{ padding: '1rem' }}>
                    <div className="flex-col gap-2">
                        {articles.map(article => {
                            const isCompleted = tests.find(t => t.requiredArticleId === article.id)?.articleCompleted;
                            return (
                                <div key={article.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-[var(--border-color)] gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'}`}>
                                            {isCompleted ? <CheckCircle size={16} /> : <BookOpen size={16} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate">{article.title}</div>
                                            <div className="text-[10px] font-bold text-secondary uppercase opacity-50">
                                                {isCompleted ? 'Изучен' : 'В процессе'}
                                            </div>
                                        </div>
                                    </div>
                                    <Link to={`/article/${article.id}`} className="btn btn-secondary py-1 px-3 text-xs shrink-0 font-bold">
                                        Открыть
                                    </Link>
                                </div>
                            );
                        })}
                        {articles.length === 0 && (
                            <div className="py-8 text-center text-secondary font-medium">Нет данных.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
