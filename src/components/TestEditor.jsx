import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Settings, List, FileQuestion } from 'lucide-react';
import { getTestById, saveTest, getAllEmployees, getArticles } from '../services/db';

export default function TestEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [employees, setEmployees] = useState([]);
    const [articles, setArticles] = useState([]);
    const [test, setTest] = useState({
        id: isNew ? '' : id,
        title: '',
        timeLimit: 600, // 10 minutes in seconds
        passingScore: 1,
        maxAttempts: 1,
        allowedUsers: [], // Empty means everyone
        requiredArticleId: '', // Optional article to read before passing
        shuffleQuestions: false,
        questionsLimit: 0, // 0 = all
        showFeedback: false, // immediate feedback
        questions: []
    });

    const [activeTab, setActiveTab] = useState('settings');

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [employeesData, articlesData] = await Promise.all([
                    getAllEmployees(),
                    getArticles()
                ]);
                setEmployees(employeesData || []);
                setArticles(articlesData || []);

                if (!isNew && id) {
                    const existingTest = await getTestById(id);
                    if (existingTest) {
                        setTest(existingTest);
                    } else {
                        navigate('/admin');
                    }
                }
            } catch (err) {
                console.error('Failed to load test editor data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [id, isNew, navigate]);

    const handleSave = async () => {
        if (!test.title.trim()) {
            alert('Введите название теста');
            return;
        }
        if (test.questions.length === 0) {
            alert('Добавьте хотя бы один вопрос');
            return;
        }
        setIsLoading(true);
        try {
            await saveTest(test);
            navigate('/admin');
        } catch (err) {
            alert('Ошибка при сохранении теста');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const addQuestion = () => {
        const newQuestion = {
            id: Date.now().toString(),
            type: 'single',
            text: '',
            options: ['Вариант 1', 'Вариант 2'],
            correctAnswers: ['Вариант 1']
        };
        setTest(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
        setActiveTab('questions');
    };

    const updateQuestion = (qId, updates) => {
        setTest(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
        }));
    };

    const removeQuestion = (qId) => {
        setTest(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== qId)
        }));
    };

    const updateOption = (qId, optionIndex, newValue) => {
        setTest(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === qId) {
                    const newOptions = [...q.options];
                    const oldVal = newOptions[optionIndex];
                    newOptions[optionIndex] = newValue;

                    let newCorrect = [...q.correctAnswers];
                    if (newCorrect.includes(oldVal)) {
                        newCorrect = newCorrect.map(c => c === oldVal ? newValue : c);
                    }
                    return { ...q, options: newOptions, correctAnswers: newCorrect };
                }
                return q;
            })
        }));
    };

    const addOption = (qId) => {
        setTest(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === qId ? { ...q, options: [...q.options, `Вариант ${q.options.length + 1}`] } : q)
        }));
    };

    const removeOption = (qId, optionIndex) => {
        setTest(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === qId) {
                    const valToRemove = q.options[optionIndex];
                    const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
                    const newCorrect = q.correctAnswers.filter(c => c !== valToRemove);
                    return { ...q, options: newOptions, correctAnswers: newCorrect };
                }
                return q;
            })
        }));
    };

    const toggleCorrectAnswer = (qId, optionValue, type) => {
        setTest(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === qId) {
                    if (type === 'single') {
                        return { ...q, correctAnswers: [optionValue] };
                    } else {
                        const isCorrect = q.correctAnswers.includes(optionValue);
                        return {
                            ...q,
                            correctAnswers: isCorrect
                                ? q.correctAnswers.filter(c => c !== optionValue)
                                : [...q.correctAnswers, optionValue]
                        };
                    }
                }
                return q;
            })
        }));
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-20 text-accent-primary animate-pulse font-bold">Загрузка данных теста...</div>;
    }

    return (
        <div className="flex-col gap-6 max-w-4xl mx-auto">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{isNew ? 'Создание нового теста' : 'Редактирование теста'}</h2>
                </div>
                <button onClick={handleSave} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Save size={16} /> Сохранить
                </button>
            </div>

            <div style={{ marginBottom: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {[
                        { key: 'settings', icon: <Settings size={16} />, label: 'Настройки' },
                        { key: 'questions', icon: <FileQuestion size={16} />, label: `Вопросы (${test.questions.length})` },
                        { key: 'access', icon: <List size={16} />, label: 'Доступ и обучение' }
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

            {activeTab === 'access' && (
                <div className="card max-w-2xl animate-fade-in flex-col gap-6">
                    <div>
                        <h3 className="text-lg">Обучение перед тестированием</h3>
                        <p className="text-sm text-secondary mb-3">
                            Тест будет заблокирован для сотрудника до тех пор, пока он изучит выбранный материал.
                        </p>
                        <div className="form-group mb-0">
                            <label className="form-label">Обязательный учебный материал</label>
                            <select
                                className="form-control bg-accent-primary/10 border-accent-primary/30 text-primary"
                                value={test.requiredArticleId || ''}
                                onChange={(e) => setTest({ ...test, requiredArticleId: e.target.value })}
                            >
                                <option value="">Опционально (не требуется)</option>
                                {articles.map(article => (
                                    <option key={article.id} value={article.id}>{article.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border-color)] pt-6">
                        <h3 className="text-lg">Назначение тестирования</h3>
                        <p className="text-sm text-secondary mb-4">
                            Выберите сотрудников, которым будет доступен этот тест. Оставьте поле пустым, чтобы тест был доступен всем.
                        </p>
                        <div className="flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                            {employees.map(emp => (
                                <label key={emp.id} className="flex items-center gap-3 p-3 border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-accent-primary transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-accent-primary"
                                        checked={(test.allowedUsers || []).includes(emp.id)}
                                        onChange={(e) => {
                                            const current = test.allowedUsers || [];
                                            if (e.target.checked) {
                                                setTest({ ...test, allowedUsers: [...current, emp.id] });
                                            } else {
                                                setTest({ ...test, allowedUsers: current.filter(userId => userId !== emp.id) });
                                            }
                                        }}
                                    />
                                    <span>{emp.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'settings' && (
                <div className="card max-w-2xl animate-fade-in">
                    <div className="form-group">
                        <label className="form-label">Название теста</label>
                        <input
                            type="text"
                            className="form-control"
                            value={test.title}
                            onChange={e => setTest({ ...test, title: e.target.value })}
                            placeholder="Например: Основы кибербезопасности"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Время на прохождение (в минутах)</label>
                            <input
                                type="number"
                                className="form-control"
                                min="1"
                                value={test.timeLimit / 60}
                                onChange={e => setTest({ ...test, timeLimit: parseInt(e.target.value) * 60 })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Попыток (0 = безлимит)</label>
                            <input
                                type="number"
                                className="form-control"
                                min="0"
                                value={test.maxAttempts}
                                onChange={e => setTest({ ...test, maxAttempts: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="form-group col-span-2">
                            <label className="form-label">Проходной балл (количество правильных ответов)</label>
                            <input
                                type="number"
                                className="form-control"
                                min="1"
                                max={test.questionsLimit > 0 ? test.questionsLimit : (test.questions.length || 1)}
                                value={test.passingScore}
                                onChange={e => setTest({ ...test, passingScore: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="form-group col-span-2 pt-4 border-t border-[var(--border-color)]">
                            <h4 className="mb-4 text-base">Дополнительные настройки тестирования</h4>

                            <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-accent-primary"
                                    checked={test.shuffleQuestions || false}
                                    onChange={e => setTest({ ...test, shuffleQuestions: e.target.checked })}
                                />
                                <span>Показывать вопросы в случайном порядке</span>
                            </label>

                            <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-accent-primary"
                                    checked={test.showFeedback || false}
                                    onChange={e => setTest({ ...test, showFeedback: e.target.checked })}
                                />
                                <span>Показывать, правильный ли ответ, сразу после ответа на вопрос</span>
                            </label>

                            <div className="mt-4">
                                <label className="form-label">Количество вопросов в билете (выбираются случайно)</label>
                                <div className="text-xs text-secondary mb-2">Введите 0, если сотрудники должны отвечать на все {test.questions.length} вопросов.</div>
                                <input
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    max={test.questions.length || 0}
                                    value={test.questionsLimit || 0}
                                    onChange={e => setTest({ ...test, questionsLimit: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'questions' && (
                <div className="flex-col gap-6 animate-fade-in">
                    {test.questions.map((q, qIndex) => (
                        <div key={q.id} className="card relative border-l-4 border-l-accent-primary animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
                            <button
                                onClick={() => removeQuestion(q.id)}
                                title="Удалить вопрос"
                                style={{
                                    position: 'absolute', top: '1rem', right: '1rem',
                                    width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer',
                                    transition: 'all 0.2s', zIndex: 10
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="flex flex-col gap-5 pr-10">
                                <div className="flex items-center gap-4">
                                    <span className="bg-accent-primary text-white w-9 h-9 flex items-center justify-center rounded-xl font-bold flex-shrink-0 shadow-sm">
                                        {qIndex + 1}
                                    </span>
                                    <div className="flex-grow flex gap-3">
                                        <input
                                            type="text"
                                            className="form-control flex-grow"
                                            style={{ fontSize: '1.05rem', fontWeight: 600 }}
                                            value={q.text}
                                            onChange={e => updateQuestion(q.id, { text: e.target.value })}
                                            placeholder="Введите текст вопроса..."
                                        />
                                        <select
                                            className="form-control w-auto min-w-[180px]"
                                            value={q.type}
                                            onChange={e => updateQuestion(q.id, {
                                                type: e.target.value,
                                                correctAnswers: e.target.value === 'single' && q.options.length ? [q.options[0]] : []
                                            })}
                                        >
                                            <option value="single">Один вариант</option>
                                            <option value="multiple">Несколько вариантов</option>
                                            <option value="text">Текстовый ввод</option>
                                        </select>
                                    </div>
                                </div>

                                {q.type !== 'text' ? (
                                    <div className="flex-col gap-3 bg-white/40 p-5 rounded-2xl border border-white/60 shadow-inner">
                                        <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 opacity-70">Варианты ответов</div>
                                        <div className="flex-col gap-2">
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-3">
                                                    <div className="relative flex items-center justify-center group/check h-10 w-10 shrink-0">
                                                        <input
                                                            type={q.type === 'single' ? 'radio' : 'checkbox'}
                                                            name={`correct-${q.id}`}
                                                            checked={q.correctAnswers.includes(opt)}
                                                            onChange={() => toggleCorrectAnswer(q.id, opt, q.type)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${q.correctAnswers.includes(opt) ? 'bg-success text-white shadow-md' : 'bg-white border border-slate-200 text-transparent group-hover/check:border-success/50 group-hover/check:text-success/30'}`}>
                                                            <CheckCircle size={18} strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                    
                                                    <input
                                                        type="text"
                                                        className="form-control h-10"
                                                        value={opt}
                                                        onChange={e => updateOption(q.id, optIdx, e.target.value)}
                                                    />
                                                    
                                                    <button 
                                                        onClick={() => removeOption(q.id, optIdx)}
                                                        className="h-10 w-10 flex items-center justify-center rounded-lg bg-danger/5 text-danger border border-danger/10 hover:bg-danger hover:text-white transition-all shrink-0"
                                                        title="Удалить вариант"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => addOption(q.id)} 
                                            className="btn btn-secondary flex items-center justify-center gap-2 mt-2 h-10 w-full bg-white/60 hover:bg-white border-dashed"
                                        >
                                            <Plus size={16} /> Добавить вариант
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-white/40 p-5 rounded-2xl border border-white/60 shadow-inner">
                                        <label className="form-label text-xs font-bold uppercase tracking-widest opacity-70">Правильный ответ</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={q.correctAnswers[0] || ''}
                                            onChange={e => updateQuestion(q.id, { correctAnswers: [e.target.value] })}
                                            placeholder="Введите эталонный ответ для сравнения..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <button onClick={addQuestion} className="btn btn-secondary border-dashed p-4 text-center justify-center text-secondary hover:text-white hover:border-white transition-colors">
                        <Plus size={20} className="mr-2" /> Добавить следующий вопрос
                    </button>
                </div>
            )}
        </div>
    );
}
