import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, Edit, Play, Save, CheckCircle, FileText, BookOpen, Clock, Users } from 'lucide-react';
import { getTests, deleteTest, getResults, getAllEmployees, clearResults, getArticles, deleteArticle, getArticleProgress } from '../services/db';

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
        return <div className="flex items-center justify-center p-20 text-accent-primary animate-pulse font-bold">Загрузка данных из облака...</div>;
    }

    return (
        <div className="flex-col gap-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Панель Администратора</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Управление тестами, обучающими материалами и просмотр результатов</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link to="/admin/article/new" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                        <Plus size={16} /> Добавить материал
                    </Link>
                    <Link to="/admin/test/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <Plus size={16} /> Создать тест
                    </Link>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {[
                        { key: 'tests', icon: <BookOpen size={16} />, label: 'Тесты' },
                        { key: 'results', icon: <CheckCircle size={16} />, label: 'Результаты' },
                        { key: 'articles', icon: <FileText size={16} />, label: 'Учебные материалы' },
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

            <div className="grid md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>

                {/* Tests List */}
                {activeTab === 'tests' && (
                    <div className="card w-full lg:col-span-2">
                        <h3 className="flex items-center gap-2 mb-4">
                            <BookOpen size={20} /> Список тестов
                        </h3>
                        {tests.length === 0 ? (
                            <div className="text-secondary p-4 text-center border border-dashed border-[var(--border-color)] rounded-lg">
                                У вас еще нет созданных тестов. Нажмите "Создать тест" чтобы начать.
                            </div>
                        ) : (
                            <div className="flex-col gap-3">
                                {tests.map((test, index) => (
                                    <div key={test.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--border-color)] hover:shadow-md transition-all animate-fade-in stagger-${(index % 5) + 1} hover:-translate-y-1`}>
                                        <div>
                                            <div className="font-medium text-primary">{test.title}</div>
                                            <div className="text-xs text-secondary flex gap-2 mt-1">
                                                <span>{test.questions?.length || 0} вопросов</span> •
                                                <span>{test.timeLimit / 60} мин</span> •
                                                <span>{test.passingScore} проходной</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link to={`/admin/test/${test.id}`} className="btn btn-secondary px-3 py-1.5 text-sm hover:text-accent-primary hover:border-accent-primary transition-all flex items-center gap-2">
                                                <Edit size={16} /> Редактировать
                                            </Link>
                                            <button onClick={() => handleDeleteTest(test.id)} className="btn btn-danger px-3 py-1.5 text-sm hover:bg-danger/10 transition-all flex items-center gap-2">
                                                <Trash2 size={16} /> Удалить
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
                    <div className="card w-full lg:col-span-2">
                        <h3 className="flex items-center gap-2 mb-4">
                            <FileText size={20} /> Обучающие материалы
                        </h3>
                        {articles.length === 0 ? (
                            <div className="text-secondary p-4 text-center border border-dashed border-[var(--border-color)] rounded-lg">
                                У вас еще нет обучающих материалов. Нажмите "Добавить материал" чтобы начать.
                            </div>
                        ) : (
                            <div className="flex-col gap-3">
                                {articles.map((article, index) => (
                                    <div key={article.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--border-color)] hover:shadow-md transition-all animate-fade-in stagger-${(index % 5) + 1} hover:-translate-y-1`}>
                                        <div>
                                            <div className="font-medium text-primary">{article.title}</div>
                                            <div className="text-xs text-secondary flex gap-2 mt-1">
                                                <span>Создан: {new Date(article.createdAt || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link to={`/admin/article/${article.id}`} className="btn btn-secondary px-3 py-1.5 text-sm hover:text-accent-primary hover:border-accent-primary transition-all flex items-center gap-2">
                                                <Edit size={16} /> Редактировать
                                            </Link>
                                            <button onClick={() => handleDeleteArticle(article.id)} className="btn btn-danger px-3 py-1.5 text-sm hover:bg-danger/10 transition-all flex items-center gap-2">
                                                <Trash2 size={16} /> Удалить
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl flex items-center gap-2 m-0"><Clock size={20} className="text-accent-primary" /> Прогресс изучения материалов</h2>
                        </div>
                        {articleProgress.length === 0 ? (
                            <p className="text-secondary p-4 text-center border border-dashed border-[var(--border-color)] rounded-lg">Пока нет данных об изучении материалов сотрудниками.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                                            <th className="p-4 font-semibold text-secondary">Сотрудник</th>
                                            <th className="p-4 font-semibold text-secondary">Учебный материал</th>
                                            <th className="p-4 font-semibold text-secondary">Потрачено минут</th>
                                            <th className="p-4 font-semibold text-secondary">Дата завершения</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {[...articleProgress].sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()).map(prog => (
                                            <tr key={prog.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                                <td className="p-4 font-medium">{getEmpName(prog.userId)}</td>
                                                <td className="p-4">{getArticleTitle(prog.articleId)}</td>
                                                <td className="p-4">{Math.round((prog.timeSpentSeconds || 0) / 60)} мин.</td>
                                                <td className="p-4 text-secondary">{new Date(prog.lastReadAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
