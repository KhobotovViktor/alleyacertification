import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, CheckCircle, FileText, BookOpen, Clock, Users, Send, AlertCircle, Eye, X, BarChart2, Download } from 'lucide-react';
import { getTests, deleteTest, getResults, getAllEmployees, clearResults, getArticles, deleteArticle, getArticleProgress, updateUserDepartment } from '../services/db';
import { testConnection } from '../services/bitrix';
import { DashboardSkeleton } from './SkeletonLoader';

export default function AdminDashboard() {
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [results, setResults] = useState([]);
    const [articleProgress, setArticleProgress] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [activeTab, setActiveTab] = useState('tests');
    const [isLoading, setIsLoading] = useState(true);
    const [bitrixTestStatus, setBitrixTestStatus] = useState('idle'); // idle, loading, success, error
    const [clearConfirm, setClearConfirm] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [analyticsTestId, setAnalyticsTestId] = useState('');

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
        if (confirm('Вы уверены, что хотите удалить этот тест?')) {
            try {
                await deleteTest(id);
                await loadData();
            } catch (err) {
                console.error('Failed to delete test:', err);
                alert(`Ошибка при удалении теста: ${err.message}`);
            }
        }
    };

    const handleDeleteArticle = async (id) => {
        if (confirm('Вы уверены, что хотите удалить этот материал?')) {
            try {
                await deleteArticle(id);
                await loadData();
            } catch (err) {
                console.error('Failed to delete article:', err);
                alert(`Ошибка при удалении: ${err.message}`);
            }
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

    // Returns the questions that were shown in a specific result attempt
    const getQuestionsForResult = (result) => {
        const test = tests.find(t => t.id === result.testId);
        if (!test || !Array.isArray(test.questions)) return null;
        if (result.answeredQuestionIds && result.answeredQuestionIds.length > 0) {
            const idSet = new Set(result.answeredQuestionIds);
            return test.questions.filter(q => idSet.has(q.id));
        }
        return test.questions;
    };

    // Check if a single question answer is correct (mirrors TestRunner logic)
    const isAnswerCorrect = (question, userAns) => {
        if (!userAns || userAns.length === 0) return false;
        const correctAns = question.correctAnswers || [];
        if (question.type === 'text') {
            const uVal = userAns[0]?.toString().trim().toLowerCase() || '';
            const cVal = correctAns[0]?.toString().trim().toLowerCase() || '';
            const synonyms = (question.synonyms || []).map(s => s.trim().toLowerCase());
            return (uVal === cVal && uVal !== '') || synonyms.includes(uVal);
        }
        return userAns.length === correctAns.length && userAns.every(v => correctAns.includes(v));
    };

    // ── CSV export ──
    const exportResultsCSV = () => {
        const headers = ['Сотрудник', 'Тест', 'Дата', 'Баллы', 'Итого', 'Процент', 'Статус'];
        const rows = results.map(r => [
            getEmpName(r.userId),
            getTestName(r.testId),
            new Date(r.date).toLocaleString('ru-RU'),
            r.score,
            r.total,
            Math.round((r.score / r.total) * 100) + '%',
            r.passed ? 'Сдано' : 'Не сдано',
        ]);
        const csv = [headers, ...rows]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `results_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Department management ──
    const DEPARTMENTS = ['Продажи', 'Склад', 'Доставка', 'Администрация', 'Сервис'];
    const handleDeptChange = async (userId, dept) => {
        try {
            await updateUserDepartment(userId, dept);
            setEmployees(prev => prev.map(e => e.id === userId ? { ...e, department: dept } : e));
        } catch (err) { alert('Ошибка обновления отдела'); }
    };

    // ── Question analytics ──
    const getQuestionAnalytics = (testId) => {
        const test = tests.find(t => t.id === testId);
        if (!test?.questions) return [];
        const testResults = results.filter(r => r.testId === testId && r.userAnswers);
        return test.questions.map(q => {
            const appearances = testResults.filter(r => (r.answeredQuestionIds || []).includes(q.id));
            const correct = appearances.filter(r => isAnswerCorrect(q, r.userAnswers?.[q.id]));
            const rate = appearances.length > 0 ? Math.round((correct.length / appearances.length) * 100) : null;
            return { question: q, total: appearances.length, correct: correct.length, rate };
        });
    };

    const handleTestBitrix = async () => {
        setBitrixTestStatus('loading');
        try {
            await testConnection();
            setBitrixTestStatus('success');
            setTimeout(() => setBitrixTestStatus('idle'), 3000);
        } catch (err) {
            console.error('Bitrix test failed:', err);
            setBitrixTestStatus('error');
            alert(`Ошибка теста: ${err.message}`);
            setTimeout(() => setBitrixTestStatus('idle'), 5000);
        }
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    // ---- Result Detail Modal ----
    const ResultDetailModal = () => {
        if (!selectedResult) return null;

        const questions = getQuestionsForResult(selectedResult);
        const hasAnswers = selectedResult.userAnswers && Object.keys(selectedResult.userAnswers).length > 0;
        const correctCount = questions
            ? questions.filter(q => isAnswerCorrect(q, selectedResult.userAnswers?.[q.id])).length
            : selectedResult.score;

        return (
            <div
                onClick={() => setSelectedResult(null)}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                    animation: 'fadeIn 0.15s ease',
                }}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'white', borderRadius: '1.5rem',
                        width: '100%', maxWidth: '680px',
                        maxHeight: '88vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Modal header */}
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                        padding: '1.5rem 1.75rem 1.25rem',
                        borderBottom: '1px solid #e2e8f0',
                        flexShrink: 0,
                    }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                Детальный разбор
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {getEmpName(selectedResult.userId)}
                            </h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {getTestName(selectedResult.testId)} • {new Date(selectedResult.date).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                            {/* Score chip */}
                            <div style={{
                                padding: '0.4rem 0.9rem', borderRadius: '2rem', fontWeight: 700,
                                fontSize: '0.85rem',
                                background: selectedResult.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: selectedResult.passed ? 'var(--success)' : 'var(--danger)',
                                border: `1px solid ${selectedResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>
                                {selectedResult.score} / {selectedResult.total} баллов
                            </div>
                            <button
                                onClick={() => setSelectedResult(null)}
                                style={{
                                    width: '2rem', height: '2rem', borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0', background: '#f8fafc',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-secondary)', transition: 'all 0.15s',
                                    flexShrink: 0,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            >
                                <X size={14} style={{ pointerEvents: 'none' }} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <div style={{ overflowY: 'auto', padding: '1.25rem 1.75rem 1.75rem', flex: 1 }} className="custom-scrollbar">
                        {!questions ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <AlertCircle size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                                <div>Тест был удалён — вопросы недоступны</div>
                            </div>
                        ) : !hasAnswers ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <AlertCircle size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                                <div>Подробные ответы не сохранены</div>
                                <div style={{ fontSize: '0.78rem', marginTop: '0.5rem', opacity: 0.6 }}>Детали доступны для прохождений после обновления системы</div>
                            </div>
                        ) : (
                            <>
                                {/* Summary bar */}
                                <div style={{
                                    display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16,185,129,0.08)', padding: '0.35rem 0.75rem', borderRadius: '2rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <CheckCircle size={13} /> {correctCount} правильно
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)', background: 'rgba(239,68,68,0.08)', padding: '0.35rem 0.75rem', borderRadius: '2rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <AlertCircle size={13} /> {questions.length - correctCount} ошибок
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
                                        {questions.length} вопросов
                                    </div>
                                </div>

                                {/* Questions list */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    {questions.map((q, idx) => {
                                        const userAns = selectedResult.userAnswers?.[q.id] || [];
                                        const correct = isAnswerCorrect(q, userAns);
                                        const correctAns = q.correctAnswers || [];

                                        return (
                                            <div
                                                key={q.id}
                                                style={{
                                                    borderRadius: '1rem',
                                                    border: `1.5px solid ${correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                                    background: correct ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {/* Question header */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                                    padding: '0.875rem 1rem',
                                                    borderBottom: `1px solid ${correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                                                    background: correct ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                                                }}>
                                                    <div style={{
                                                        width: '1.5rem', height: '1.5rem', borderRadius: '50%', flexShrink: 0,
                                                        background: correct ? 'var(--success)' : 'var(--danger)',
                                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.7rem', fontWeight: 800, marginTop: '0.1rem',
                                                    }}>
                                                        {correct ? <CheckCircle size={12} /> : <X size={12} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: correct ? 'var(--success)' : 'var(--danger)', marginBottom: '0.2rem' }}>
                                                            Вопрос {idx + 1}
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.45, fontWeight: 500 }}>
                                                            {q.text}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Answers */}
                                                <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {q.type === 'text' ? (
                                                        <>
                                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', flexShrink: 0 }}>Ответил:</span>
                                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: correct ? 'var(--success)' : 'var(--danger)', wordBreak: 'break-word' }}>
                                                                    {userAns[0] || <em style={{ opacity: 0.5 }}>нет ответа</em>}
                                                                </span>
                                                            </div>
                                                            {!correct && (
                                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', flexShrink: 0 }}>Верно:</span>
                                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)', wordBreak: 'break-word' }}>{correctAns[0]}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        q.options.map((opt, oIdx) => {
                                                            const wasChosen = userAns.includes(opt);
                                                            const isRight = correctAns.includes(opt);
                                                            let chipStyle = { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' };
                                                            if (wasChosen && isRight) chipStyle = { background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1.5px solid rgba(16,185,129,0.35)' };
                                                            else if (wasChosen && !isRight) chipStyle = { background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1.5px solid rgba(239,68,68,0.3)' };
                                                            else if (!wasChosen && isRight) chipStyle = { background: 'rgba(16,185,129,0.07)', color: 'var(--success)', border: '1.5px dashed rgba(16,185,129,0.4)' };

                                                            return (
                                                                <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.85rem', fontWeight: wasChosen || isRight ? 600 : 400, ...chipStyle }}>
                                                                    {wasChosen && isRight && <CheckCircle size={13} style={{ flexShrink: 0 }} />}
                                                                    {wasChosen && !isRight && <X size={13} style={{ flexShrink: 0 }} />}
                                                                    {!wasChosen && isRight && <span style={{ fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>✓ верно</span>}
                                                                    {opt}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
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

                {/* Diagnostic Action: Test Bitrix */}
                <div 
                    onClick={bitrixTestStatus === 'idle' ? handleTestBitrix : null} 
                    className={`bento-card group transition-all cursor-pointer ${bitrixTestStatus === 'error' ? 'bg-red-50' : (bitrixTestStatus === 'success' ? 'bg-emerald-50' : 'hover:shadow-md')}`}
                    style={{ border: bitrixTestStatus === 'success' ? '2px solid #10b981' : (bitrixTestStatus === 'error' ? '2px solid #ef4444' : '1px solid var(--border-color)') }}
                >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-all ${bitrixTestStatus === 'loading' ? 'animate-spin' : ''} ${bitrixTestStatus === 'success' ? 'bg-emerald-500 text-white' : (bitrixTestStatus === 'error' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600')}`}>
                        {bitrixTestStatus === 'success' ? <CheckCircle size={18} /> : (bitrixTestStatus === 'error' ? <AlertCircle size={18} /> : <Send size={18} />)}
                    </div>
                    <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">
                        {bitrixTestStatus === 'loading' ? 'Проверка...' : (bitrixTestStatus === 'success' ? 'Отправлено!' : (bitrixTestStatus === 'error' ? 'Ошибка' : 'Тест Bitrix24'))}
                    </span>
                    <p className="text-[11px] text-secondary opacity-60 mt-1">Отправить пробное уведомление</p>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {[
                        { key: 'tests', icon: <BookOpen size={16} />, label: 'Тесты' },
                        { key: 'results', icon: <CheckCircle size={16} />, label: 'Результаты' },
                        { key: 'analytics', icon: <BarChart2 size={16} />, label: 'Аналитика' },
                        { key: 'articles', icon: <FileText size={16} />, label: 'Материалы' },
                        { key: 'trainingStats', icon: <Clock size={16} />, label: 'Обучение' },
                        { key: 'employees', icon: <Users size={16} />, label: 'Сотрудники' }
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
                                                    transition: 'all 0.2s',
                                                    position: 'relative',
                                                    zIndex: 50,
                                                    pointerEvents: 'auto'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                                                title="Удалить тест"
                                            >
                                                <Trash2 size={16} style={{ pointerEvents: 'none' }} />
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
                                                    transition: 'all 0.2s',
                                                    position: 'relative',
                                                    zIndex: 50,
                                                    pointerEvents: 'auto'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                                                title="Удалить материал"
                                            >
                                                <Trash2 size={16} style={{ pointerEvents: 'none' }} />
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
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h3 className="flex items-center gap-2 m-0">
                                <Users size={20} /> Последние результаты тестирования
                            </h3>
                            {results.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={exportResultsCSV}
                                        className="btn btn-secondary text-xs py-1 px-3 flex items-center gap-1.5"
                                    >
                                        <Download size={13} /> Скачать CSV
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (clearConfirm) {
                                                setClearConfirm(false);
                                                await clearResults();
                                                await loadData();
                                            } else {
                                                setClearConfirm(true);
                                                setTimeout(() => setClearConfirm(false), 3000);
                                            }
                                        }}
                                        className={`btn ${clearConfirm ? 'btn-danger' : 'btn-secondary'} text-xs py-1 px-3 transition-colors`}
                                    >
                                        {clearConfirm ? 'Точно очистить?' : 'Очистить историю'}
                                    </button>
                                </div>
                            )}
                        </div>
                        {results.length === 0 ? (
                            <div className="text-secondary p-4 text-center border border-dashed border-[var(--border-color)] rounded-lg">
                                Пока нет ни одного результата прохождения.
                            </div>
                        ) : (
                            <div className="flex-col gap-3">
                                {results.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50).map((result, index) => (
                                    <div key={result.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--border-color)] hover:shadow-md transition-all animate-fade-in stagger-${(index % 5) + 1}`} style={{ gap: '0.75rem' }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div className="font-medium text-primary">{getEmpName(result.userId)}</div>
                                            <div className="text-xs text-secondary mt-1">{getTestName(result.testId)} • {new Date(result.date).toLocaleString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                            <div className={`badge ${result.passed ? 'bg-success/10 text-success border-success/30' : 'bg-danger/10 text-danger border-danger/30'}`}>
                                                {result.score} / {result.total}
                                            </div>
                                            <button
                                                onClick={() => setSelectedResult(result)}
                                                title="Посмотреть ответы"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                    padding: '0.4rem 0.75rem', borderRadius: '0.625rem',
                                                    border: '1px solid #e2e8f0', background: '#f8fafc',
                                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                    transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <Eye size={13} style={{ pointerEvents: 'none' }} />
                                                <span className="mobile-hide">Детали</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Analytics ── */}
                {activeTab === 'analytics' && (
                    <div className="card w-full lg:col-span-2 animate-fade-in">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h3 className="flex items-center gap-2 m-0"><BarChart2 size={20} className="text-accent-primary" /> Аналитика по вопросам</h3>
                            <select className="form-control" style={{ maxWidth: '260px', borderRadius: '0.75rem', padding: '0.4rem 0.75rem' }}
                                value={analyticsTestId}
                                onChange={e => setAnalyticsTestId(e.target.value)}>
                                <option value="">— Выберите тест —</option>
                                {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                        </div>
                        {!analyticsTestId ? (
                            <div className="text-secondary p-6 text-center border border-dashed border-[var(--border-color)] rounded-xl">Выберите тест выше</div>
                        ) : (() => {
                            const analytics = getQuestionAnalytics(analyticsTestId);
                            const testResultsCount = results.filter(r => r.testId === analyticsTestId).length;
                            return (
                                <div className="flex-col gap-3">
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Всего попыток: <strong>{testResultsCount}</strong>
                                    </div>
                                    {analytics.map((item, idx) => (
                                        <div key={item.question.id} style={{ padding: '1rem', background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Вопрос {idx + 1}</div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.question.text}</div>
                                                </div>
                                                {item.rate !== null ? (
                                                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.rate >= 70 ? 'var(--success)' : item.rate >= 40 ? '#f59e0b' : 'var(--danger)' }}>{item.rate}%</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.correct}/{item.total}</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ flexShrink: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', background: '#f1f5f9', borderRadius: '0.5rem' }}>нет данных</div>
                                                )}
                                            </div>
                                            {item.rate !== null && (
                                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${item.rate}%`, background: item.rate >= 70 ? 'var(--success)' : item.rate >= 40 ? '#f59e0b' : 'var(--danger)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
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

                {/* ── Employees ── */}
                {activeTab === 'employees' && (
                    <div className="card w-full lg:col-span-2 animate-fade-in">
                        <div className="flex items-center gap-3 mb-2">
                            <Users size={20} className="text-accent-primary" />
                            <h3 className="m-0">Сотрудники и отделы</h3>
                        </div>
                        <p className="text-sm text-secondary mb-4">Назначьте сотрудников по отделам — это позволит быстро выбирать аудиторию при назначении тестов.</p>
                        <div className="flex-col gap-2">
                            {employees.length === 0 && (
                                <div className="py-8 text-center text-secondary">Нет сотрудников.</div>
                            )}
                            {employees.map(emp => (
                                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', gap: '1rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{emp.name}</div>
                                    <select
                                        value={emp.department || ''}
                                        onChange={e => handleDeptChange(emp.id, e.target.value)}
                                        style={{ padding: '0.35rem 0.75rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <option value="">— Без отдела —</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* Result detail modal */}
        <ResultDetailModal />
        </>
    );
}
