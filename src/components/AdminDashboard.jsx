import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit, CheckCircle, FileText, BookOpen, Clock, Users, Send, AlertCircle, Eye, X, Download, BarChart2, BookMarked } from 'lucide-react';
import { getTests, deleteTest, getResults, getAllUsers, clearResults, getArticles, deleteArticle, getArticleProgress, getQuestionBank, saveQuestionBankItem, deleteQuestionBankItem, updateUserDepartment } from '../services/db';
import { testConnection } from '../services/bitrix';
import { DashboardSkeleton } from './SkeletonLoader';

export default function AdminDashboard() {
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [results, setResults] = useState([]);
    const [articleProgress, setArticleProgress] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [questionBank, setQuestionBank] = useState([]);
    const [activeTab, setActiveTab] = useState('tests');
    const [isLoading, setIsLoading] = useState(true);
    const [bitrixTestStatus, setBitrixTestStatus] = useState('idle');
    const [clearConfirm, setClearConfirm] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    // Bank editor state
    const [bankEditing, setBankEditing] = useState(null); // null | {} | {id,...}
    // Analytics state
    const [analyticsTestId, setAnalyticsTestId] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [testsData, articlesData, resultsData, progressData, usersData, bankData] = await Promise.all([
                getTests(), getArticles(), getResults(), getArticleProgress(), getAllUsers(), getQuestionBank()
            ]);
            setTests(testsData || []);
            setArticles(articlesData || []);
            setResults(resultsData || []);
            setArticleProgress(progressData || []);
            setEmployees((usersData || []).filter(u => u.role === 'employee'));
            setQuestionBank(bankData || []);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTest = async (id) => {
        if (!confirm('Удалить тест?')) return;
        try { await deleteTest(id); await loadData(); }
        catch (err) { console.error(err); alert(`Ошибка: ${err.message}`); }
    };

    const handleDeleteArticle = async (id) => {
        if (!confirm('Удалить материал?')) return;
        try { await deleteArticle(id); await loadData(); }
        catch (err) { console.error(err); alert(`Ошибка: ${err.message}`); }
    };

    const getEmpName = (id) => employees.find(e => e.id === id)?.name || 'Удалённый пользователь';
    const getTestName = (id) => tests.find(t => t.id === id)?.title || 'Удалённый тест';
    const getArticleTitle = (id) => articles.find(a => a.id === id)?.title || 'Удалённый материал';

    const getEmployeeArticleProgress = (employeeId, articleId) =>
        articleProgress.find(p => p.userId === employeeId && p.articleId === articleId);

    const getQuestionsForResult = (result) => {
        const test = tests.find(t => t.id === result.testId);
        if (!test || !Array.isArray(test.questions)) return null;
        if (result.answeredQuestionIds?.length > 0) {
            const idSet = new Set(result.answeredQuestionIds);
            return test.questions.filter(q => idSet.has(q.id));
        }
        return test.questions;
    };

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

    const handleTestBitrix = async () => {
        setBitrixTestStatus('loading');
        try {
            await testConnection();
            setBitrixTestStatus('success');
            setTimeout(() => setBitrixTestStatus('idle'), 3000);
        } catch (err) {
            console.error('Bitrix test failed:', err);
            setBitrixTestStatus('error');
            setTimeout(() => setBitrixTestStatus('idle'), 5000);
        }
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
            r.passed ? 'Сдано' : 'Не сдано'
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

    // ── Bank editor ──
    const bankEmpty = { text: '', type: 'single', options: ['Вариант 1', 'Вариант 2'], correctAnswers: ['Вариант 1'], synonyms: [], category: '' };

    const handleSaveBankItem = async () => {
        if (!bankEditing?.text?.trim()) { alert('Введите текст вопроса'); return; }
        try {
            await saveQuestionBankItem(bankEditing);
            setBankEditing(null);
            await loadData();
        } catch (err) { alert('Ошибка сохранения'); console.error(err); }
    };

    const handleDeleteBankItem = async (id) => {
        if (!confirm('Удалить вопрос из банка?')) return;
        try { await deleteQuestionBankItem(id); await loadData(); }
        catch (err) { alert('Ошибка удаления'); }
    };

    // ── Department management ──
    const DEPARTMENTS = ['Продажи', 'Склад', 'Доставка', 'Администрация', 'Сервис'];
    const handleDeptChange = async (userId, dept) => {
        try {
            await updateUserDepartment(userId, dept);
            setEmployees(prev => prev.map(e => e.id === userId ? { ...e, department: dept } : e));
        } catch (err) { alert('Ошибка обновления отдела'); }
    };

    if (isLoading) return <DashboardSkeleton />;

    // ── Result Detail Modal ──
    const ResultDetailModal = () => {
        if (!selectedResult) return null;
        const questions = getQuestionsForResult(selectedResult);
        const hasAnswers = selectedResult.userAnswers && Object.keys(selectedResult.userAnswers).length > 0;
        const correctCount = questions
            ? questions.filter(q => isAnswerCorrect(q, selectedResult.userAnswers?.[q.id])).length
            : selectedResult.score;

        return (
            <div onClick={() => setSelectedResult(null)}
                style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.15s ease' }}>
                <div onClick={e => e.stopPropagation()}
                    style={{ background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '680px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Детальный разбор</div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getEmpName(selectedResult.userId)}</h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {getTestName(selectedResult.testId)} • {new Date(selectedResult.date).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                            <div style={{ padding: '0.4rem 0.9rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.85rem', background: selectedResult.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selectedResult.passed ? 'var(--success)' : 'var(--danger)', border: `1px solid ${selectedResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                {selectedResult.score} / {selectedResult.total} баллов
                            </div>
                            <button onClick={() => setSelectedResult(null)}
                                style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    <div style={{ overflowY: 'auto', padding: '1.25rem 1.75rem 1.75rem', flex: 1 }} className="custom-scrollbar">
                        {!questions ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}><AlertCircle size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} /><div>Тест удалён</div></div>
                        ) : !hasAnswers ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <AlertCircle size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                                <div>Подробные ответы не сохранены</div>
                                <div style={{ fontSize: '0.78rem', marginTop: '0.5rem', opacity: 0.6 }}>Доступны для прохождений после обновления</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16,185,129,0.08)', padding: '0.35rem 0.75rem', borderRadius: '2rem', border: '1px solid rgba(16,185,129,0.2)' }}><CheckCircle size={13} /> {correctCount} правильно</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)', background: 'rgba(239,68,68,0.08)', padding: '0.35rem 0.75rem', borderRadius: '2rem', border: '1px solid rgba(239,68,68,0.2)' }}><AlertCircle size={13} /> {questions.length - correctCount} ошибок</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>{questions.length} вопросов</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    {questions.map((q, idx) => {
                                        const userAns = selectedResult.userAnswers?.[q.id] || [];
                                        const correct = isAnswerCorrect(q, userAns);
                                        const correctAns = q.correctAnswers || [];
                                        return (
                                            <div key={q.id} style={{ borderRadius: '1rem', border: `1.5px solid ${correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, background: correct ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)', overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', borderBottom: `1px solid ${correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`, background: correct ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
                                                    <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', flexShrink: 0, background: correct ? 'var(--success)' : 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginTop: '0.1rem' }}>
                                                        {correct ? <CheckCircle size={12} /> : <X size={12} />}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: correct ? 'var(--success)' : 'var(--danger)', marginBottom: '0.2rem' }}>Вопрос {idx + 1}</div>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.45, fontWeight: 500 }}>{q.text}</div>
                                                    </div>
                                                </div>
                                                <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {q.type === 'text' ? (
                                                        <>
                                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', flexShrink: 0 }}>Ответил:</span>
                                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: correct ? 'var(--success)' : 'var(--danger)', wordBreak: 'break-word' }}>{userAns[0] || <em style={{ opacity: 0.5 }}>нет ответа</em>}</span>
                                                            </div>
                                                            {!correct && <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', flexShrink: 0 }}>Верно:</span>
                                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)', wordBreak: 'break-word' }}>{correctAns[0]}{q.synonyms?.length > 0 ? ` (или: ${q.synonyms.join(', ')})` : ''}</span>
                                                            </div>}
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

    // ── Bank Item Editor Modal ──
    const BankItemModal = () => {
        if (!bankEditing) return null;
        const q = bankEditing;
        const setQ = (upd) => setBankEditing(prev => ({ ...prev, ...upd }));
        return (
            <div onClick={() => setBankEditing(null)}
                style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div onClick={e => e.stopPropagation()}
                    style={{ background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{q.id ? 'Редактировать вопрос' : 'Новый вопрос в банк'}</h3>
                        <button onClick={() => setBankEditing(null)} style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }} className="custom-scrollbar flex-col gap-4">
                        <div className="form-group">
                            <label className="form-label">Текст вопроса</label>
                            <input type="text" className="form-control" value={q.text} onChange={e => setQ({ text: e.target.value })} placeholder="Вопрос..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Категория</label>
                            <input type="text" className="form-control" value={q.category || ''} onChange={e => setQ({ category: e.target.value })} placeholder="Обслуживание клиентов, Склад..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Тип</label>
                            <select className="form-control" value={q.type} onChange={e => setQ({ type: e.target.value, correctAnswers: [] })}>
                                <option value="single">Один правильный</option>
                                <option value="multiple">Несколько ответов</option>
                                <option value="text">Текстовый ответ</option>
                            </select>
                        </div>
                        {q.type !== 'text' ? (
                            <div className="form-group flex-col gap-2">
                                <label className="form-label">Варианты (✓ — правильный)</label>
                                {(q.options || []).map((opt, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input type={q.type === 'single' ? 'radio' : 'checkbox'} name={`bank-correct`}
                                            checked={(q.correctAnswers || []).includes(opt)}
                                            onChange={() => {
                                                if (q.type === 'single') setQ({ correctAnswers: [opt] });
                                                else {
                                                    const ca = q.correctAnswers || [];
                                                    setQ({ correctAnswers: ca.includes(opt) ? ca.filter(c => c !== opt) : [...ca, opt] });
                                                }
                                            }}
                                            className="w-4 h-4 accent-accent-primary flex-shrink-0" />
                                        <input type="text" className="form-control flex-1" value={opt}
                                            onChange={e => {
                                                const opts = [...(q.options || [])];
                                                const oldVal = opts[idx]; opts[idx] = e.target.value;
                                                const ca = (q.correctAnswers || []).map(c => c === oldVal ? e.target.value : c);
                                                setQ({ options: opts, correctAnswers: ca });
                                            }} />
                                        <button onClick={() => setQ({ options: (q.options || []).filter((_, i) => i !== idx), correctAnswers: (q.correctAnswers || []).filter(c => c !== opt) })}
                                            style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => setQ({ options: [...(q.options || []), `Вариант ${(q.options?.length || 0) + 1}`] })}
                                    className="btn btn-secondary text-sm" style={{ borderRadius: '0.625rem', padding: '0.4rem 0.75rem' }}>
                                    <Plus size={14} style={{ marginRight: '0.25rem' }} /> Добавить вариант
                                </button>
                            </div>
                        ) : (
                            <div className="form-group flex-col gap-2">
                                <label className="form-label">Правильный ответ</label>
                                <input type="text" className="form-control" value={(q.correctAnswers || [])[0] || ''} onChange={e => setQ({ correctAnswers: [e.target.value] })} />
                                <label className="form-label">Синонимы (через запятую)</label>
                                <input type="text" className="form-control" value={(q.synonyms || []).join(', ')} onChange={e => setQ({ synonyms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="диван, кресла, диваны..." />
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => setBankEditing(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem' }}>Отмена</button>
                        <button onClick={handleSaveBankItem} className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem' }}>Сохранить</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
        <div className="flex-col gap-6">
            {/* Bento Header */}
            <div className="bento-grid mb-8">
                <div className="bento-card bento-card-large bg-gradient-to-br from-white to-slate-50">
                    <div className="flex-col justify-center h-full">
                        <h2 className="m-0">Панель Администратора</h2>
                        <p className="m-0 text-secondary opacity-70 mt-1">Управляйте тестами и следите за прогрессом.</p>
                    </div>
                </div>
                <Link to="/admin/test/new" className="bento-card group hover:shadow-glow transition-all" style={{ border: '2px solid rgba(16,185,129,0.1)', background: 'rgba(16,185,129,0.03)' }}>
                    <div className="bg-accent-primary text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                    <div className="font-bold text-lg text-primary">Создать тест</div>
                    <p className="text-xs text-secondary mt-1">Добавить новый опрос</p>
                </Link>
                <Link to="/admin/article/new" className="bento-card group hover:shadow-md transition-all" style={{ border: '2px solid rgba(59,130,246,0.1)', background: 'rgba(59,130,246,0.03)' }}>
                    <div className="bg-blue-500 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                    <div className="font-bold text-lg text-primary">Материал</div>
                    <p className="text-xs text-secondary mt-1">Обучающие статьи</p>
                </Link>
                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5"><div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><BookOpen size={18} /></div><span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Всего тестов</span></div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{tests.length}</div>
                    <div className="text-[11px] text-secondary opacity-60">{tests.filter(t => t.status === 'draft').length} черновиков</div>
                </div>
                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5"><div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center"><Users size={18} /></div><span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Сотрудники</span></div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{employees.length}</div>
                    <div className="text-[11px] text-secondary opacity-60">Зарегистрировано в базе</div>
                </div>
                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5"><div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle size={18} /></div><span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Пройдено</span></div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{results.length}</div>
                    <div className="text-[11px] text-secondary opacity-60">Всего попыток</div>
                </div>
                <div onClick={bitrixTestStatus === 'idle' ? handleTestBitrix : null}
                    className={`bento-card group transition-all cursor-pointer ${bitrixTestStatus === 'error' ? 'bg-red-50' : bitrixTestStatus === 'success' ? 'bg-emerald-50' : 'hover:shadow-md'}`}
                    style={{ border: bitrixTestStatus === 'success' ? '2px solid #10b981' : bitrixTestStatus === 'error' ? '2px solid #ef4444' : '1px solid var(--border-color)' }}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${bitrixTestStatus === 'loading' ? 'animate-spin' : ''} ${bitrixTestStatus === 'success' ? 'bg-emerald-500 text-white' : bitrixTestStatus === 'error' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {bitrixTestStatus === 'success' ? <CheckCircle size={18} /> : bitrixTestStatus === 'error' ? <AlertCircle size={18} /> : <Send size={18} />}
                    </div>
                    <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">
                        {bitrixTestStatus === 'loading' ? 'Проверка...' : bitrixTestStatus === 'success' ? 'Отправлено!' : bitrixTestStatus === 'error' ? 'Ошибка' : 'Тест Bitrix24'}
                    </span>
                    <p className="text-[11px] text-secondary opacity-60 mt-1">Пробное уведомление</p>
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {[
                        { key: 'tests', icon: <BookOpen size={16} />, label: 'Тесты' },
                        { key: 'results', icon: <CheckCircle size={16} />, label: 'Результаты' },
                        { key: 'analytics', icon: <BarChart2 size={16} />, label: 'Аналитика' },
                        { key: 'articles', icon: <FileText size={16} />, label: 'Материалы' },
                        { key: 'trainingStats', icon: <Clock size={16} />, label: 'Обучение' },
                        { key: 'questionBank', icon: <BookMarked size={16} />, label: 'Банк вопросов' },
                        { key: 'employees', icon: <Users size={16} />, label: 'Сотрудники' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === tab.key ? 'white' : 'transparent', color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)', boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                            {tab.icon} <span className="mobile-text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>

                {/* ── Tests ── */}
                {activeTab === 'tests' && (
                    <div className="w-full lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4 ml-1"><BookOpen size={20} className="text-accent-primary" /><h3 className="m-0">Список тестов</h3></div>
                        {tests.length === 0 ? (
                            <div className="bento-card text-secondary p-8 text-center border-dashed">Нет тестов. Нажмите «Создать тест».</div>
                        ) : (
                            <div className="bento-grid">
                                {tests.map((test, index) => (
                                    <div key={test.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`}>
                                        <div className="flex-col gap-1.5 grow">
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <div className="font-bold text-primary text-lg leading-tight flex-1">{test.title}</div>
                                                {test.status === 'draft' && <span style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, background: '#f59e0b', color: 'white', padding: '0.15rem 0.45rem', borderRadius: '0.375rem', textTransform: 'uppercase' }}>Черновик</span>}
                                            </div>
                                            <div className="text-secondary flex flex-wrap gap-2 mt-auto">
                                                <span className="badge badge-primary bg-slate-100 text-slate-600 border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>{test.questions?.length || 0} вопр.</span>
                                                <span className="badge badge-primary bg-slate-100 text-slate-600 border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>{test.timeLimit / 60} мин.</span>
                                                <span className="badge badge-primary bg-success/10 text-success border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>Балл: {test.passingScore}</span>
                                                {test.deadline && <span className="badge bg-orange-100 text-orange-700 border-none" style={{ padding: '0.2rem 0.5rem', textTransform: 'none' }}>📅 {new Date(test.deadline).toLocaleDateString('ru-RU')}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <Link to={`/admin/test/${test.id}`} className="btn btn-secondary flex-grow text-sm py-2 px-3 hover:text-accent-primary hover:border-accent-primary transition-all flex items-center justify-center gap-2">
                                                <Edit size={16} /> <span>Изменить</span>
                                            </Link>
                                            <button onClick={() => handleDeleteTest(test.id)}
                                                style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                                                title="Удалить тест">
                                                <Trash2 size={16} style={{ pointerEvents: 'none' }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Articles ── */}
                {activeTab === 'articles' && (
                    <div className="w-full lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4 ml-1"><FileText size={20} className="text-accent-primary" /><h3 className="m-0">Обучающие материалы</h3></div>
                        {articles.length === 0 ? (
                            <div className="bento-card text-secondary p-8 text-center border-dashed">Нет материалов.</div>
                        ) : (
                            <div className="bento-grid">
                                {articles.map((article, index) => (
                                    <div key={article.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`}>
                                        <div className="flex-col gap-1.5 grow">
                                            <div className="font-bold text-primary text-lg leading-tight mb-2">{article.title}</div>
                                            <div className="text-xs text-secondary opacity-60">Создан: {new Date(article.createdAt || Date.now()).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <Link to={`/admin/article/${article.id}`} className="btn btn-secondary flex-grow text-sm py-2 px-3 hover:text-accent-primary hover:border-accent-primary transition-all flex items-center justify-center gap-2">
                                                <Edit size={16} /> <span>Изменить</span>
                                            </Link>
                                            <button onClick={() => handleDeleteArticle(article.id)}
                                                style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                                                title="Удалить материал">
                                                <Trash2 size={16} style={{ pointerEvents: 'none' }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Results ── */}
                {activeTab === 'results' && (
                    <div className="card w-full lg:col-span-2">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h3 className="flex items-center gap-2 m-0"><Users size={20} /> Результаты тестирования</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {results.length > 0 && (
                                    <button onClick={exportResultsCSV}
                                        className="btn btn-secondary text-xs py-1 px-3 flex items-center gap-1.5">
                                        <Download size={13} /> Скачать CSV
                                    </button>
                                )}
                                {results.length > 0 && (
                                    <button onClick={async () => {
                                        if (clearConfirm) { setClearConfirm(false); await clearResults(); await loadData(); }
                                        else { setClearConfirm(true); setTimeout(() => setClearConfirm(false), 3000); }
                                    }} className={`btn ${clearConfirm ? 'btn-danger' : 'btn-secondary'} text-xs py-1 px-3 transition-colors`}>
                                        {clearConfirm ? 'Точно очистить?' : 'Очистить историю'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {results.length === 0 ? (
                            <div className="text-secondary p-4 text-center border border-dashed border-[var(--border-color)] rounded-lg">Нет результатов.</div>
                        ) : (
                            <div className="flex-col gap-3">
                                {results.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50).map((result, index) => (
                                    <div key={result.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--border-color)] hover:shadow-md transition-all animate-fade-in stagger-${(index % 5) + 1}`} style={{ gap: '0.75rem' }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div className="font-medium text-primary">{getEmpName(result.userId)}</div>
                                            <div className="text-xs text-secondary mt-1">{getTestName(result.testId)} • {new Date(result.date).toLocaleString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                            <div className={`badge ${result.passed ? 'bg-success/10 text-success border-success/30' : 'bg-danger/10 text-danger border-danger/30'}`}>{result.score} / {result.total}</div>
                                            <button onClick={() => setSelectedResult(result)} title="Посмотреть ответы"
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', background: '#f8fafc', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                                <Eye size={13} /><span className="mobile-hide">Детали</span>
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
                                {tests.filter(t => t.status !== 'draft').map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
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

                {/* ── Training Stats ── */}
                {activeTab === 'trainingStats' && (
                    <div className="card flex-col gap-4 animate-fade-in w-full lg:col-span-2">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-xl flex items-center gap-2 m-0"><Clock size={20} className="text-accent-primary" /> Прогресс обучения</h2>
                        </div>
                        {articleProgress.length === 0 ? (
                            <p className="text-secondary p-4 text-center border border-dashed border-[var(--border-color)] rounded-lg">Нет данных.</p>
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
                                            {[...articleProgress].sort((a, b) => new Date(b.lastReadAt) - new Date(a.lastReadAt)).map(prog => (
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

                {/* ── Question Bank ── */}
                {activeTab === 'questionBank' && (
                    <div className="card w-full lg:col-span-2 animate-fade-in">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h3 className="flex items-center gap-2 m-0"><BookMarked size={20} className="text-accent-primary" /> Банк вопросов</h3>
                            <button onClick={() => setBankEditing({ ...bankEmpty })} className="btn btn-primary text-sm flex items-center gap-1.5" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                                <Plus size={15} /> Новый вопрос
                            </button>
                        </div>
                        {questionBank.length === 0 ? (
                            <div className="text-secondary p-8 text-center border border-dashed border-[var(--border-color)] rounded-xl">
                                Банк вопросов пуст. Добавьте вопросы, чтобы переиспользовать их в разных тестах.
                            </div>
                        ) : (
                            <div className="flex-col gap-3">
                                {questionBank.map(q => (
                                    <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', gap: '1rem' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{q.text}</div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '0.375rem', color: 'var(--text-secondary)' }}>
                                                    {q.type === 'single' ? 'Один ответ' : q.type === 'multiple' ? 'Несколько' : 'Текст'}
                                                </span>
                                                {q.category && <span style={{ fontSize: '0.7rem', background: 'rgba(59,130,246,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.375rem', color: '#3b82f6' }}>{q.category}</span>}
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{(q.correctAnswers || []).join(', ')}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                            <button onClick={() => setBankEditing({ ...q })}
                                                style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                                <Edit size={13} />
                                            </button>
                                            <button onClick={() => handleDeleteBankItem(q.id)}
                                                style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#ef4444'; }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Employees ── */}
                {activeTab === 'employees' && (
                    <div className="card w-full lg:col-span-2 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <Users size={20} className="text-accent-primary" />
                            <h3 className="m-0">Сотрудники и отделы</h3>
                        </div>
                        <p className="text-sm text-secondary mb-4">Назначьте сотрудников по отделам — это позволит быстро выбирать аудиторию для тестов.</p>
                        <div className="flex-col gap-2">
                            {employees.map(emp => (
                                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', gap: '1rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{emp.name}</div>
                                    <select value={emp.department || ''}
                                        onChange={e => handleDeptChange(emp.id, e.target.value)}
                                        style={{ padding: '0.35rem 0.75rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <option value="">— Без отдела —</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            ))}
                            {employees.length === 0 && <div className="py-8 text-center text-secondary">Нет сотрудников.</div>}
                        </div>
                    </div>
                )}

            </div>
        </div>

        <ResultDetailModal />
        <BankItemModal />
        </>
    );
}
