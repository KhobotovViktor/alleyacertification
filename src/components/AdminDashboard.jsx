import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, Edit, Play, Save, CheckCircle, FileText, BookOpen, Clock, Users } from 'lucide-react';
import { getTests, deleteTest, getResults, getAllEmployees, clearResults, getArticles, deleteArticle, getArticleProgress } from '../services/db';
import { DashboardSkeleton } from './SkeletonLoader';

export default function AdminDashboard() {
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [results, setResults] = useState([]);
    const [articleProgress, setArticleProgress] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [activeTab, setActiveTab] = useState('tests');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [testsData, articlesData, resultsData, progressData, employeesData] = await Promise.all([
                getTests(),
                getArticles(),
                getResults(),
                getArticleProgress(),
                getAllEmployees()
            ]);
            
            setTests(testsData || []);
            setArticles(articlesData || []);
            setResults(resultsData || []);
            setArticleProgress(progressData || []);
            setEmployees(employeesData || []);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTest = async (id) => {
        if (confirm('Удалить этот тест?')) {
            await deleteTest(id);
            await loadData();
        }
    };

    const handleDeleteArticle = async (id) => {
        if (confirm('Удалить этот материал?')) {
            await deleteArticle(id);
            await loadData();
        }
    };

    const getEmpName = (id) => employees.find(e => e.id === id)?.name || 'Удаленный пользователь';
    const getTestName = (id) => tests.find(t => t.id === id)?.title || 'Удаленный тест';
    const getArticleTitle = (id) => articles.find(a => a.id === id)?.title || 'Удаленный материал';

    const getEmployeeArticleProgress = (employeeId, articleId) => {
        return articleProgress.find(p => p.userId === employeeId && p.articleId === articleId);
    };

    const getEmployeeTestResults = (employeeId, testId) => {
        return results.filter(r => r.userId === employeeId && r.testId === testId);
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="flex-col gap-6">
            {/* Bento Header Section */}
            <div className="bento-grid mb-8">
                {/* Brand & Welcome Card */}
                <div className="bento-card bento-card-large bg-gradient-to-br from-white to-slate-50">
                    <div className="flex-col justify-center h-full">
                        <h2 className="m-0">Панель Администратора</h2>
                        <p className="m-0 text-secondary opacity-70 mt-1">Добро пожаловать, {employees.find(e => e.role === 'admin')?.name || 'Админ'}. Управляйте тестами и следите за прогрессом.</p>
                    </div>
                </div>

                {/* Quick Action: Create Test */}
                <Link to="/admin/test/new" className="bento-card group hover:shadow-glow transition-all" style={{ border: '2px solid rgba(16, 185, 129, 0.1)', background: 'rgba(16, 185, 129, 0.03)' }}>
                    <div className="bg-accent-primary text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <div className="font-bold text-lg text-primary">Создать тест</div>
                    <p className="text-xs text-secondary mt-1">Добавить новый опрос для аттестации</p>
                </Link>

                {/* Quick Action: Add Material */}
                <Link to="/admin/article/new" className="bento-card group hover:shadow-md transition-all" style={{ border: '2px solid rgba(59, 130, 246, 0.1)', background: 'rgba(59, 130, 246, 0.03)' }}>
                    <div className="bg-blue-500 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <div className="font-bold text-lg text-primary">Материал</div>
                    <p className="text-xs text-secondary mt-1">Обучающие статьи и регламенты</p>
                </Link>

                {/* Stat: Total Tests */}
                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Всего тестов</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{tests.length}</div>
                    <div className="text-[11px] text-secondary opacity-60">Активных опросов в системе</div>
                </div>

                {/* Stat: Employees */}
                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Users size={18} />
                        </div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Сотрудники</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{employees.filter(e => e.role === 'employee').length}</div>
                    <div className="text-[11px] text-secondary opacity-60">Зарегистрировано в базе</div>
                </div>

                {/* Stat: Results */}
                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle size={18} />
                        </div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Пройдено</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{results.length}</div>
                    <div className="text-[11px] text-secondary opacity-60">Всего попыток тестирования</div>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {[
                        { key: 'tests', icon: <BookOpen size={16} />, label: 'Тесты' },
                        { key: 'results', icon: <CheckCircle size={16} />, label: 'Результаты' },
                        { key: 'articles', icon: <FileText size={16} />, label: 'Материалы' },
                        { key: 'trainingStats', icon: <Clock size={16} />, label: 'Обучение' }
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

            <div className="grid md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>

                {/* Tests List */}
                {activeTab === 'tests' && (
                    <div className="w-full lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4 ml-1">
                            <BookOpen size={20} className="text-accent-primary" />
                            <h3 className="m-0">Список тестов</h3>
                        </div>
                        {tests.length === 0 ? (
                            <div className="bento-card text-secondary p-8 text-center border-dashed">
                                У вас еще нет созданных тестов. Нажмите "Создать тест" чтобы начать.
                            </div>
                        ) : (
                            <div className="bento-grid">
                                {tests.map((test, index) => (
                                    <div key={test.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`}>
                                        <div className="flex-col gap-1.5 grow">
                                            <div className="font-bold text-primary text-lg leading-tight mb-2">{test.title}</div>
                                            
                                            <div className="text-secondary flex flex-wrap gap-2 mt-auto">
                                                <span className="badge badge-primary bg-slate-100 text-slate-600 border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>{test.questions?.length || 0} вопр.</span>
                                                <span className="badge badge-primary bg-slate-100 text-slate-600 border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>{test.timeLimit / 60} мин.</span>
                                                <span className="badge badge-primary bg-success/10 text-success border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>Балл: {test.passingScore}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <Link to={`/admin/test/${test.id}`} className="btn btn-secondary flex-grow text-sm py-2 px-3 hover:text-accent-primary hover:border-accent-primary transition-all flex items-center justify-center gap-2">
                                                <Edit size={16} /> <span>Изменить</span>
                                            </Link>
                                            <button 
                                                onClick={() => handleDeleteTest(test.id)} 
                                                style={{
                                                    width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                                                title="Удалить тест"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Articles List */}
                {activeTab === 'articles' && (
                    <div className="w-full lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4 ml-1">
                            <FileText size={20} className="text-accent-primary" />
                            <h3 className="m-0">Обучающие материалы</h3>
                        </div>
                        {articles.length === 0 ? (
                            <div className="bento-card text-secondary p-8 text-center border-dashed">
                                У вас еще нет обучающих материалов. Нажмите "Добавить материал" чтобы начать.
                            </div>
                        ) : (
                            <div className="bento-grid">
                                {articles.map((article, index) => (
                                    <div key={article.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`}>
                                        <div className="flex-col gap-1.5 grow">
                                            <div className="font-bold text-primary text-lg leading-tight mb-2">{article.title}</div>
                                            <div className="text-xs text-secondary opacity-60">
                                                Создан: {new Date(article.createdAt || Date.now()).toLocaleDateString()}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <Link to={`/admin/article/${article.id}`} className="btn btn-secondary flex-grow text-sm py-2 px-3 hover:text-accent-primary hover:border-accent-primary transition-all flex items-center justify-center gap-2">
                                                <Edit size={16} /> <span>Изменить</span>
                                            </Link>
                                            <button 
                                                onClick={() => handleDeleteArticle(article.id)} 
                                                style={{
                                                    width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                                                title="Удалить материал"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Results List */}
                {activeTab === 'results' && (
                    <div className="card w-full lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center gap-2 m-0">
                                <Users size={20} /> Последние результаты тестирования
                            </h3>
                            {results.length > 0 && (
                                <button
                                    onClick={async (e) => {
                                        if (e.currentTarget.textContent === 'Точно очистить?') {
                                            await clearResults();
                                            await loadData();
                                        } else {
                                            const btn = e.currentTarget;
                                            const originalText = btn.textContent;
                                            btn.textContent = 'Точно очистить?';
                                            btn.classList.add('btn-danger');
                                            btn.classList.remove('btn-secondary');
                                            setTimeout(() => {
                                                if (btn) {
                                                    btn.textContent = originalText;
                                                    btn.classList.add('btn-secondary');
                                                    btn.classList.remove('btn-danger');
                                                }
                                            }, 3000);
                                        }
                                    }}
                                    className="btn btn-secondary text-xs py-1 px-3 transition-colors"
                                >
                                    Очистить историю
                                </button>
                            )}
                        </div>
                        {results.length === 0 ? (
                            <div className="text-secondary p-4 text-center border border-dashed border-[var(--border-color)] rounded-lg">
                                Пока нет ни одного результата прохождения.
                            </div>
                        ) : (
                            <div className="flex-col gap-3">
                                {results.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50).map((result, index) => (
                                    <div key={result.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--border-color)] hover:shadow-md transition-all animate-fade-in stagger-${(index % 5) + 1} hover:-translate-y-1`}>
                                        <div>
                                            <div className="font-medium text-primary">{getEmpName(result.userId)}</div>
                                            <div className="text-xs text-secondary mt-1">{getTestName(result.testId)} • {new Date(result.date).toLocaleString()}</div>
                                        </div>
                                        <div className={`badge ${result.passed ? 'bg-success/10 text-success border-success/30' : 'bg-danger/10 text-danger border-danger/30'}`}>
                                            {result.score} / {result.total} баллов
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Training Stats List */}
                {activeTab === 'trainingStats' && (
                    <div className="card flex-col gap-4 animate-fade-in w-full lg:col-span-2">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-xl flex items-center gap-2 m-0"><Clock size={20} className="text-accent-primary" /> Прогресс обучения</h2>
                        </div>
                        {articleProgress.length === 0 ? (
                            <p className="text-secondary p-4 text-center border border-dashed border-[var(--border-color)] rounded-lg">Пока нет данных об изучении материалов.</p>
                        ) : (
                            <>
                                <div className="scroll-hint">Листайте таблицу вправо →</div>
                                <div className="table-container">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                                                <th className="p-4 font-semibold text-secondary">Сотрудник</th>
                                                <th className="p-4 font-semibold text-secondary">Материал</th>
                                                <th className="p-4 font-semibold text-secondary">Время</th>
                                                <th className="p-4 font-semibold text-secondary">Завершено</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]">
                                            {[...articleProgress].sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()).map(prog => (
                                                <tr key={prog.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                                    <td className="p-4 font-medium">{getEmpName(prog.userId)}</td>
                                                    <td className="p-4">{getArticleTitle(prog.articleId)}</td>
                                                    <td className="p-4">{Math.round((prog.timeSpentSeconds || 0) / 60)} мин.</td>
                                                    <td className="p-4 text-secondary">{new Date(prog.lastReadAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
