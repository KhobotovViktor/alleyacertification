import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle, Clock, AlertTriangle, FileText, BookOpen } from 'lucide-react';
import { 
    getTests, 
    getCurrentUser, 
    getTestAttemptsCount, 
    getUserResults, 
    getArticles, 
    getArticleProgress 
} from '../services/db';

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
        return <div className="flex items-center justify-center p-20 text-accent-primary animate-pulse font-bold">Секунду, работаем с облаком...</div>;
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Мой Профиль</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Пройдите тесты и изучите обучающие материалы</p>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {[
                        { key: 'tests', icon: <Play size={16} />, label: 'Тесты' },
                        { key: 'results', icon: <CheckCircle size={16} />, label: 'Результаты' },
                        { key: 'articles', icon: <BookOpen size={16} />, label: 'Учебные материалы' },
                        { key: 'trainingStats', icon: <Clock size={16} />, label: 'Статистика обучения' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1.25rem', borderRadius: '0.75rem',
                                border: 'none', fontSize: '0.8125rem', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s',
                                background: activeTab === tab.key ? 'white' : 'transparent',
                                color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'tests' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {tests.map((test, index) => {
                        const isBlocked = test.maxAttempts > 0 && test.attemptsCount >= test.maxAttempts;
                        const hasPassed = test.bestResult?.passed;

                        return (
                            <div key={test.id} className={`card flex-col h-full relative overflow-hidden group animate-fade-in stagger-${(index % 5) + 1}`}>
                                {hasPassed && (
                                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                                        <div className="absolute transform rotate-45 bg-success text-white font-bold py-1 right-[-35px] top-[15px] w-[120px] text-center text-xs shadow-md">
                                            СДАН
                                        </div>
                                    </div>
                                )}

                                <h3 className="text-lg font-bold text-primary mb-2 pr-10">{test.title}</h3>

                                <div className="flex-col gap-2 mt-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <Clock size={16} className="text-accent-primary" />
                                        <span>Время: {test.timeLimit / 60} мин</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <CheckCircle size={16} className="text-success" />
                                        <span>Проходной балл: {test.passingScore}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <AlertTriangle size={16} className={isBlocked && !hasPassed ? 'text-danger' : 'text-warning'} />
                                        <span>Попыток: {test.attemptsCount} / {test.maxAttempts === 0 ? '∞' : test.maxAttempts}</span>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    {!test.articleCompleted ? (
                                        <Link to={`/article/${test.requiredArticleId}`} className="btn w-full btn-secondary warning overflow-hidden text-ellipsis whitespace-nowrap text-xs flex justify-center items-center gap-1 bg-warning/10 text-warning border-warning/30 hover:bg-warning/20">
                                            <AlertTriangle size={14} /> Требуется изучение: {test.requiredArticle?.title || 'Материал'}
                                        </Link>
                                    ) : isBlocked ? (
                                        <button className="btn w-full btn-secondary" disabled>
                                            Лимит попыток исчерпан
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { window.location.href = `/test/${test.id}`; }}
                                            className="btn btn-primary w-full flex justify-center gap-2 relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                            <Play size={18} className="relative z-10" /> <span className="relative z-10">{hasPassed ? 'Пройти снова' : 'Начать тест'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {tests.length === 0 && (
                        <div className="col-span-full p-8 text-center text-secondary border border-dashed border-[var(--border-color)] rounded-xl">
                            В данный момент нет доступных тестов для прохождения.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'articles' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
                    {articles.map((article, index) => (
                        <div key={article.id} className={`card flex-col h-full relative overflow-hidden group border-l-4 border-l-accent-primary animate-fade-in stagger-${(index % 5) + 1}`}>
                            <h3 className="text-lg font-bold text-primary mb-2 pr-2">{article.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-secondary mt-2 mb-6">
                                <FileText size={16} />
                                <span>Материал доступен для чтения</span>
                            </div>
                            <div className="mt-auto">
                                <Link to={`/article/${article.id}`} className="btn btn-secondary w-full flex justify-center gap-2">
                                    <BookOpen size={18} /> Читать
                                </Link>
                            </div>
                        </div>
                    ))}
                    {articles.length === 0 && (
                        <div className="col-span-full p-6 text-center text-secondary border border-dashed border-[var(--border-color)] rounded-xl">
                            Нет доступных обучающих материалов.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'results' && (
                <div className="card animate-fade-in overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-color)]">
                                <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary">Тест</th>
                                <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary">Баллы</th>
                                <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary">Дата</th>
                                <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((res, idx) => {
                                const testName = tests.find(t => t.id === res.testId)?.title || 'Тест удален';
                                return (
                                    <tr key={res.id} className="border-t border-[var(--border-color)] hover:bg-accent-primary/5 transition-colors">
                                        <td className="py-4 px-4 font-medium text-center">{testName}</td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="font-bold">{res.score}</span> / {res.total}
                                            <span className="ml-2 text-xs text-secondary">({Math.round((res.score / res.total) * 100)}%)</span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-secondary text-center">{formatDate(res.date)}</td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`badge ${res.passed ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex' }}>
                                                {res.passed ? 'Сдано' : 'Не сдано'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {results.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-secondary">Вы еще не проходили тесты.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'trainingStats' && (
                <div className="card animate-fade-in">
                    <div className="flex-col gap-4">
                        {articles.map(article => {
                            const isCompleted = tests.find(t => t.requiredArticleId === article.id)?.articleCompleted;
                            return (
                                <div key={article.id} className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                                            {isCompleted ? <CheckCircle size={20} /> : <BookOpen size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-bold">{article.title}</div>
                                            <div className="text-xs text-secondary uppercase tracking-tighter mt-0.5">
                                                {isCompleted ? 'Материал изучен' : 'В процессе изучения'}
                                            </div>
                                        </div>
                                    </div>
                                    <Link to={`/article/${article.id}`} className="btn btn-secondary py-1.5 px-3 text-xs">
                                        Открыть
                                    </Link>
                                </div>
                            );
                        })}
                        {articles.length === 0 && (
                            <div className="py-8 text-center text-secondary">Нет доступных материалов для отслеживания.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
