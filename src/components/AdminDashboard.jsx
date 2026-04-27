import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, CheckCircle, FileText, BookOpen, Clock, Users, Send, AlertCircle, Eye, EyeOff, X, BarChart2, Download, Link2, Copy, PenLine, KeyRound, ShieldCheck, UserPlus, CalendarClock } from 'lucide-react';
import { getTests, deleteTest, getResults, getAllEmployees, clearResults, getArticles, deleteArticle, getArticleProgress, updateUserDepartment, updateTestStatus, getFullUsersList, createUser, deleteUser, updateUserPassword } from '../services/db';
import { getCurrentUser } from '../services/db';
import { testConnection } from '../services/bitrix';
import { DashboardSkeleton } from './SkeletonLoader';
import CustomSelect from './ui/CustomSelect';

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
    const [departments, setDepartments] = useState([]);
    const [newDeptInput, setNewDeptInput] = useState('');
    const [allUsers, setAllUsers] = useState([]);

    // ── Add-user modal state ──
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ id: '', name: '', password: '', role: 'employee', department: '' });
    const [newUserError, setNewUserError] = useState('');
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);

    // ── Per-row password change state ──
    const [changePwdRow, setChangePwdRow] = useState(null); // userId with open pwd form
    const [changePwdValue, setChangePwdValue] = useState('');
    const [showChangePwd, setShowChangePwd] = useState(false);
    const [isSavingPwd, setIsSavingPwd] = useState(false);

    // ── Delete confirmation ──
    const [deleteConfirmUserId, setDeleteConfirmUserId] = useState(null);

    const currentUser = getCurrentUser();
    const [copiedTestId, setCopiedTestId] = useState(null);
    const [testStatusFilter, setTestStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'

    const copyTestLink = (testId) => {
        const url = `${window.location.origin}/test/${testId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedTestId(testId);
            setTimeout(() => setCopiedTestId(null), 2000);
        });
    };

    // ── User management handlers ──
    const handleCreateUser = async () => {
        setNewUserError('');
        if (!newUser.id.trim()) return setNewUserError('Введите логин');
        if (!newUser.name.trim()) return setNewUserError('Введите имя');
        if (!newUser.password) return setNewUserError('Введите пароль');
        if (newUser.password.length < 4) return setNewUserError('Пароль должен быть не короче 4 символов');

        setIsSavingUser(true);
        try {
            await createUser(newUser);
            setShowAddUser(false);
            setNewUser({ id: '', name: '', password: '', role: 'employee', department: '' });
            setShowNewPwd(false);
            await loadData();
        } catch (err) {
            setNewUserError(err.message || 'Ошибка при создании пользователя');
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await deleteUser(userId);
            setAllUsers(prev => prev.filter(u => u.id !== userId));
            setEmployees(prev => prev.filter(u => u.id !== userId));
            setDeleteConfirmUserId(null);
        } catch (err) {
            alert('Ошибка при удалении пользователя');
        }
    };

    const handleChangePassword = async () => {
        if (!changePwdValue || changePwdValue.length < 4) {
            alert('Пароль должен быть не короче 4 символов');
            return;
        }
        setIsSavingPwd(true);
        try {
            await updateUserPassword(changePwdRow, changePwdValue);
            setChangePwdRow(null);
            setChangePwdValue('');
        } catch (err) {
            alert('Ошибка при смене пароля');
        } finally {
            setIsSavingPwd(false);
        }
    };

    const handleToggleStatus = async (test) => {
        const next = (test.status || 'published') === 'draft' ? 'published' : 'draft';
        try {
            await updateTestStatus(test.id, next);
            setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: next } : t));
        } catch (err) {
            alert('Не удалось изменить статус теста');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [testsData, articlesData, resultsData, progressData, employeesData, usersData] = await Promise.all([
                getTests(),
                getArticles(),
                getResults(),
                getArticleProgress(),
                getAllEmployees(),
                getFullUsersList(),
            ]);

            setTests(testsData || []);
            setArticles(articlesData || []);
            setResults(resultsData || []);
            setArticleProgress(progressData || []);
            setEmployees(employeesData || []);
            setAllUsers(usersData || []);
            // Derive department list from actual Supabase data
            const existingDepts = [...new Set((employeesData || []).map(e => e.department).filter(Boolean))];
            setDepartments(prev => [...new Set([...existingDepts, ...prev])]);
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
    const handleDeptChange = async (userId, dept) => {
        try {
            await updateUserDepartment(userId, dept);
            setEmployees(prev => prev.map(e => e.id === userId ? { ...e, department: dept } : e));
        } catch (err) { alert('Ошибка обновления отдела'); }
    };

    const handleAddDepartment = () => {
        const name = newDeptInput.trim();
        if (!name) return;
        setDepartments(prev => prev.includes(name) ? prev : [...prev, name]);
        setNewDeptInput('');
    };

    // ── Question analytics ──
    const getQuestionAnalytics = (testId) => {
        const test = tests.find(t => t.id === testId);
        if (!test?.questions) return [];
        // Only count completed attempts (those with saved userAnswers)
        const testResults = results.filter(r => r.testId === testId && r.userAnswers);
        return test.questions.map(q => {
            const qIdStr = String(q.id); // JSON keys are always strings after DB round-trip
            const appearances = testResults.filter(r => {
                const ids = r.answeredQuestionIds;
                if (Array.isArray(ids) && ids.length > 0) {
                    // IDs may be stored as numbers or strings — compare both
                    return ids.some(id => String(id) === qIdStr);
                }
                // Fallback for legacy results without answeredQuestionIds:
                // consider question as shown if user submitted any answer for it
                return r.userAnswers[qIdStr] !== undefined || r.userAnswers[q.id] !== undefined;
            });
            const correct = appearances.filter(r =>
                isAnswerCorrect(q, r.userAnswers?.[qIdStr] ?? r.userAnswers?.[q.id])
            );
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
        // userAnswers keys are strings after JSON round-trip; support both string and number lookup
        const getAnswer = (ua, qId) => ua?.[String(qId)] ?? ua?.[qId] ?? [];
        const correctCount = questions
            ? questions.filter(q => isAnswerCorrect(q, getAnswer(selectedResult.userAnswers, q.id))).length
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
                                        const userAns = getAnswer(selectedResult.userAnswers, q.id);
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
                        <div className="flex items-center justify-between gap-3 mb-4 ml-1 flex-wrap">
                            <div className="flex items-center gap-3">
                                <BookOpen size={20} className="text-accent-primary" />
                                <h3 className="m-0">Список тестов</h3>
                            </div>
                            {/* Status filter chips */}
                            <div style={{ display: 'flex', gap: '0.375rem', padding: '0.25rem', background: 'rgba(255,255,255,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.8)' }}>
                                {[
                                    { key: 'all', label: 'Все' },
                                    { key: 'published', label: 'Опубликованные' },
                                    { key: 'draft', label: 'Черновики' },
                                ].map(f => (
                                    <button key={f.key} onClick={() => setTestStatusFilter(f.key)} style={{ padding: '0.3rem 0.75rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', fontFamily: 'inherit', background: testStatusFilter === f.key ? 'white' : 'transparent', color: testStatusFilter === f.key ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: testStatusFilter === f.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {(() => {
                            const visibleTests = tests.filter(t => {
                                const s = t.status || 'published';
                                if (testStatusFilter === 'all') return true;
                                return s === testStatusFilter;
                            });
                            return visibleTests.length === 0 ? (
                            <div className="bento-card text-secondary p-8 text-center border-dashed">
                                {tests.length === 0 ? 'У вас еще нет созданных тестов. Нажмите "Создать тест" чтобы начать.' : 'Нет тестов с таким статусом.'}
                            </div>
                            ) : (
                            <div className="bento-grid">
                                {visibleTests.map((test, index) => {
                                    const isDraft = (test.status || 'published') === 'draft';
                                    return (
                                    <div key={test.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`} style={{ opacity: isDraft ? 0.85 : 1 }}>
                                        <div className="flex-col gap-1.5 grow">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="font-bold text-primary text-lg leading-tight">{test.title}</div>
                                                {/* Status badge */}
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, background: isDraft ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: isDraft ? '#d97706' : 'var(--accent-primary)', border: `1px solid ${isDraft ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                                    {isDraft ? <PenLine size={10} /> : <CheckCircle size={10} />}
                                                    {isDraft ? 'Черновик' : 'Опубликован'}
                                                </span>
                                            </div>

                                            <div className="text-secondary flex flex-wrap gap-2 mt-auto">
                                                <span className="badge badge-primary bg-slate-100 text-slate-600 border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>{test.questions?.length || 0} вопр.</span>
                                                <span className="badge badge-primary bg-slate-100 text-slate-600 border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>{test.timeLimit / 60} мин.</span>
                                                <span className="badge badge-primary bg-success/10 text-success border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>Балл: {test.passingScore}</span>
                                                {test.deadline && (() => {
                                                    const dl = new Date(test.deadline);
                                                    const expired = dl < new Date();
                                                    return (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, background: expired ? 'rgba(100,116,139,0.1)' : 'rgba(245,158,11,0.1)', color: expired ? '#64748b' : '#d97706', border: `1px solid ${expired ? 'rgba(100,116,139,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                                                            <CalendarClock size={10} />
                                                            {expired ? 'Срок истёк' : `До ${dl.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <Link to={`/admin/test/${test.id}`} className="btn btn-secondary flex-grow text-sm py-2 px-3 hover:text-accent-primary hover:border-accent-primary transition-all flex items-center justify-center gap-2">
                                                <Edit size={16} /> <span>Изменить</span>
                                            </Link>

                                            {/* Publish / Unpublish toggle */}
                                            <button
                                                onClick={() => handleToggleStatus(test)}
                                                title={isDraft ? 'Опубликовать тест' : 'Вернуть в черновики'}
                                                style={{
                                                    width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isDraft ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)',
                                                    color: isDraft ? 'var(--accent-primary)' : '#d97706',
                                                    border: `1px solid ${isDraft ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                                    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = isDraft ? 'var(--accent-primary)' : '#f59e0b'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = isDraft ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)'; e.currentTarget.style.color = isDraft ? 'var(--accent-primary)' : '#d97706'; e.currentTarget.style.borderColor = isDraft ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'; }}
                                            >
                                                {isDraft ? <Send size={15} style={{ pointerEvents: 'none' }} /> : <PenLine size={15} style={{ pointerEvents: 'none' }} />}
                                            </button>

                                            {test.isPublic && (
                                                <button
                                                    onClick={() => copyTestLink(test.id)}
                                                    title="Скопировать ссылку на тест"
                                                    style={{
                                                        width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: copiedTestId === test.id ? 'var(--accent-primary)' : 'rgba(16,185,129,0.07)',
                                                        color: copiedTestId === test.id ? 'white' : 'var(--accent-primary)',
                                                        border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer',
                                                        transition: 'all 0.2s', flexShrink: 0,
                                                    }}
                                                    onMouseEnter={e => { if (copiedTestId !== test.id) { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; }}}
                                                    onMouseLeave={e => { if (copiedTestId !== test.id) { e.currentTarget.style.background = 'rgba(16,185,129,0.07)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}}
                                                >
                                                    {copiedTestId === test.id ? <Copy size={15} style={{ pointerEvents: 'none' }} /> : <Link2 size={15} style={{ pointerEvents: 'none' }} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteTest(test.id)}
                                                style={{
                                                    width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(239,68,68,0.05)', color: '#ef4444',
                                                    border: '1px solid rgba(239,68,68,0.1)', cursor: 'pointer',
                                                    transition: 'all 0.2s', position: 'relative', zIndex: 50, pointerEvents: 'auto'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                                                title="Удалить тест"
                                            >
                                                <Trash2 size={16} style={{ pointerEvents: 'none' }} />
                                            </button>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                            );
                        })()}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CustomSelect
                                    style={{ minWidth: '200px', maxWidth: '260px' }}
                                    value={analyticsTestId}
                                    onChange={v => setAnalyticsTestId(v)}
                                    placeholder="— Выберите тест —"
                                    options={tests.map(t => ({ value: t.id, label: t.title }))}
                                />
                                {analyticsTestId && (
                                    <button
                                        onClick={() => setAnalyticsTestId('')}
                                        title="Сбросить выбор"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '2.25rem', height: '2.25rem', flexShrink: 0,
                                            background: 'white', border: '1px solid #e2e8f0',
                                            borderRadius: '0.625rem', cursor: 'pointer',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {!analyticsTestId ? (
                            <div className="text-secondary p-6 text-center border border-dashed border-[var(--border-color)] rounded-xl">Выберите тест выше</div>
                        ) : (() => {
                            const analytics = getQuestionAnalytics(analyticsTestId);
                            // Count only completed attempts (those with userAnswers saved) to match analytics data
                            const testResultsCount = results.filter(r => r.testId === analyticsTestId && r.userAnswers).length;
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
                    <div className="flex-col gap-5 w-full lg:col-span-2 animate-fade-in">

                        {/* ── User Management ── */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <Users size={20} className="text-accent-primary" />
                                    <h3 className="m-0">Пользователи</h3>
                                </div>
                                <button
                                    onClick={() => { setShowAddUser(true); setNewUserError(''); }}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}
                                >
                                    <UserPlus size={15} /> Добавить
                                </button>
                            </div>

                            <div className="flex-col gap-2">
                                {allUsers.length === 0 && <div className="py-6 text-center text-secondary">Нет пользователей</div>}
                                {allUsers.map(u => {
                                    const isMe = u.id === currentUser?.id;
                                    const isPwdOpen = changePwdRow === u.id;
                                    const isDeleteOpen = deleteConfirmUserId === u.id;
                                    return (
                                        <div key={u.id} style={{ borderRadius: '0.875rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                            {/* Main row */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'white', flexWrap: 'wrap' }}>
                                                {/* Avatar */}
                                                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: u.role === 'admin' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '0.875rem', color: u.role === 'admin' ? '#6366f1' : 'var(--accent-primary)' }}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Name + login */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {u.name}
                                                        {isMe && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '0.375rem', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)' }}>вы</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontFamily: 'monospace' }}>@{u.id}</span>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.4rem', borderRadius: '0.375rem', fontSize: '0.65rem', fontWeight: 700, background: u.role === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.08)', color: u.role === 'admin' ? '#6366f1' : 'var(--accent-primary)' }}>
                                                            {u.role === 'admin' ? <ShieldCheck size={9} /> : <Users size={9} />}
                                                            {u.role === 'admin' ? 'Админ' : 'Сотрудник'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                                                    {/* Change password */}
                                                    <button
                                                        onClick={() => { setChangePwdRow(isPwdOpen ? null : u.id); setChangePwdValue(''); setShowChangePwd(false); setDeleteConfirmUserId(null); }}
                                                        title="Сменить пароль"
                                                        style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: isPwdOpen ? 'rgba(99,102,241,0.4)' : '#e2e8f0', background: isPwdOpen ? 'rgba(99,102,241,0.08)' : 'white', color: isPwdOpen ? '#6366f1' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                        onMouseEnter={e => { if (!isPwdOpen) { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}}
                                                        onMouseLeave={e => { if (!isPwdOpen) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}}
                                                    >
                                                        <KeyRound size={14} />
                                                    </button>
                                                    {/* Delete */}
                                                    {!isMe && (
                                                        <button
                                                            onClick={() => { setDeleteConfirmUserId(isDeleteOpen ? null : u.id); setChangePwdRow(null); }}
                                                            title="Удалить пользователя"
                                                            style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: isDeleteOpen ? 'rgba(239,68,68,0.4)' : '#e2e8f0', background: isDeleteOpen ? 'rgba(239,68,68,0.08)' : 'white', color: isDeleteOpen ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                            onMouseEnter={e => { if (!isDeleteOpen) { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}}
                                                            onMouseLeave={e => { if (!isDeleteOpen) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Change password inline panel */}
                                            {isPwdOpen && (
                                                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', background: 'rgba(99,102,241,0.03)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                                                        <input
                                                            type={showChangePwd ? 'text' : 'password'}
                                                            className="form-control"
                                                            style={{ borderRadius: '0.625rem', padding: '0.4rem 2.5rem 0.4rem 0.75rem', fontSize: '0.875rem' }}
                                                            placeholder="Новый пароль..."
                                                            value={changePwdValue}
                                                            onChange={e => setChangePwdValue(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                                                            autoFocus
                                                        />
                                                        <button type="button" onClick={() => setShowChangePwd(p => !p)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '0.25rem' }}>
                                                            {showChangePwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>
                                                    </div>
                                                    <button onClick={handleChangePassword} disabled={isSavingPwd} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', borderRadius: '0.625rem', fontSize: '0.8rem' }}>
                                                        {isSavingPwd ? '...' : 'Сохранить'}
                                                    </button>
                                                    <button onClick={() => setChangePwdRow(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.8rem' }}>
                                                        Отмена
                                                    </button>
                                                </div>
                                            )}

                                            {/* Delete confirmation inline panel */}
                                            {isDeleteOpen && (
                                                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #fecaca', background: 'rgba(239,68,68,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                    <span style={{ flex: 1, fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Удалить «{u.name}»? Это действие нельзя отменить.</span>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="btn" style={{ padding: '0.35rem 0.85rem', borderRadius: '0.625rem', fontSize: '0.8rem', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Удалить</button>
                                                    <button onClick={() => setDeleteConfirmUserId(null)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.8rem' }}>Отмена</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Department Management ── */}
                        <div className="card">
                            <div className="flex items-center gap-3 mb-2">
                                <Users size={20} className="text-accent-primary" />
                                <h3 className="m-0">Отделы</h3>
                            </div>
                            <p className="text-sm text-secondary mb-4">Назначьте сотрудников по отделам — это позволит быстро выбирать аудиторию при назначении тестов.</p>

                            {/* Add new department */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ borderRadius: '0.75rem', flex: 1 }}
                                    placeholder="Название нового отдела..."
                                    value={newDeptInput}
                                    onChange={e => setNewDeptInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddDepartment()}
                                />
                                <button onClick={handleAddDepartment} className="btn btn-primary" style={{ borderRadius: '0.75rem', padding: '0 1rem', whiteSpace: 'nowrap' }}>
                                    <Plus size={15} style={{ marginRight: '0.3rem' }} /> Добавить
                                </button>
                            </div>

                            {departments.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                                    {departments.map(d => (
                                        <span key={d} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '2rem', background: 'rgba(16,185,129,0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(16,185,129,0.2)' }}>{d}</span>
                                    ))}
                                </div>
                            )}

                            <div className="flex-col gap-2">
                                {employees.length === 0 && <div className="py-8 text-center text-secondary">Нет сотрудников.</div>}
                                {employees.map(emp => {
                                    const opts = [...new Set([...departments, emp.department].filter(Boolean))];
                                    return (
                                        <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', gap: '1rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{emp.name}</div>
                                            <CustomSelect
                                                size="sm"
                                                style={{ minWidth: '160px', maxWidth: '220px' }}
                                                value={emp.department || ''}
                                                onChange={v => handleDeptChange(emp.id, v)}
                                                placeholder="— Без отдела —"
                                                options={[
                                                    { value: '', label: '— Без отдела —' },
                                                    ...opts.map(d => ({ value: d, label: d }))
                                                ]}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* ── Add User Modal ── */}
        {showAddUser && (
            <div
                onClick={() => { setShowAddUser(false); setNewUserError(''); }}
                style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.15s ease' }}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', maxWidth: '440px', width: '100%', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Управление пользователями</div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>Новый пользователь</h3>
                        </div>
                        <button
                            onClick={() => { setShowAddUser(false); setNewUserError(''); }}
                            style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <X size={14} style={{ pointerEvents: 'none' }} />
                        </button>
                    </div>

                    {/* Full name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Имя и фамилия</label>
                        <input
                            type="text"
                            className="form-control"
                            style={{ borderRadius: '0.75rem' }}
                            placeholder="Иван Иванов"
                            value={newUser.name}
                            onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleCreateUser()}
                            autoFocus
                        />
                    </div>

                    {/* Login */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Логин</label>
                        <input
                            type="text"
                            className="form-control"
                            style={{ borderRadius: '0.75rem', fontFamily: 'monospace' }}
                            placeholder="ivanov"
                            value={newUser.id}
                            onChange={e => setNewUser(p => ({ ...p, id: e.target.value.replace(/\s/g, '') }))}
                            onKeyDown={e => e.key === 'Enter' && handleCreateUser()}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Пароль</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNewPwd ? 'text' : 'password'}
                                className="form-control"
                                style={{ borderRadius: '0.75rem', paddingRight: '2.75rem' }}
                                placeholder="Минимум 4 символа"
                                value={newUser.password}
                                onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleCreateUser()}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPwd(p => !p)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '0.25rem' }}
                            >
                                {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Role */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Роль</label>
                        <CustomSelect
                            value={newUser.role}
                            onChange={v => setNewUser(p => ({ ...p, role: v }))}
                            options={[
                                { value: 'employee', label: 'Сотрудник' },
                                { value: 'admin', label: 'Администратор' },
                            ]}
                        />
                    </div>

                    {/* Department (only for employees) */}
                    {newUser.role === 'employee' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Отдел <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>(необязательно)</span></label>
                            <CustomSelect
                                value={newUser.department}
                                onChange={v => setNewUser(p => ({ ...p, department: v }))}
                                placeholder="— Без отдела —"
                                options={[
                                    { value: '', label: '— Без отдела —' },
                                    ...departments.map(d => ({ value: d, label: d })),
                                ]}
                            />
                        </div>
                    )}

                    {/* Error */}
                    {newUserError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '0.625rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            {newUserError}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                        <button
                            onClick={() => { setShowAddUser(false); setNewUserError(''); }}
                            className="btn btn-secondary"
                            style={{ flex: 1, borderRadius: '0.875rem', padding: '0.625rem' }}
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleCreateUser}
                            disabled={isSavingUser}
                            className="btn btn-primary"
                            style={{ flex: 1, borderRadius: '0.875rem', padding: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                            <UserPlus size={15} style={{ pointerEvents: 'none' }} />
                            {isSavingUser ? 'Создание...' : 'Создать'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Result detail modal */}
        <ResultDetailModal />
        </>
    );
}
