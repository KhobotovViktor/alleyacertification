import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, ArrowRight, ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { getTestById, saveResult, getCurrentUser, getTestAttemptsCount } from '../services/db';

export default function TestRunner() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getCurrentUser();
    const timerRef = useRef(null);


    const [test, setTest] = useState(null);
    const [activeQuestions, setActiveQuestions] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [resultId, setResultId] = useState(null);
    const [showQuestionFeedback, setShowQuestionFeedback] = useState(false);

    console.log("RENDER TestRunner", {
        hasTest: !!test,
        questionsCount: activeQuestions.length,
        timeLeft,
        isFinished
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initTest = async () => {
            if (user && id) {
                setIsLoading(true);
                try {
                    const dbTest = await getTestById(id);
                    if (!dbTest) {
                        navigate('/employee');
                        return;
                    }

                    const attempts = await getTestAttemptsCount(user.id, dbTest.id);
                    if (dbTest.maxAttempts > 0 && attempts >= dbTest.maxAttempts) {
                        alert('Лимит попыток исчерпан!');
                        navigate('/employee');
                        return;
                    }

                    let questionsToUse = [...dbTest.questions];
                    if (dbTest.shuffleQuestions) {
                        questionsToUse.sort(() => Math.random() - 0.5);
                    }
                    if (dbTest.questionsLimit > 0 && dbTest.questionsLimit < questionsToUse.length) {
                        questionsToUse = questionsToUse.slice(0, dbTest.questionsLimit);
                    }

                    setTest(dbTest);
                    setActiveQuestions(questionsToUse);
                    setTimeLeft(dbTest.timeLimit);
                } catch (err) {
                    console.error('Failed to initialize test:', err);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        initTest();
    }, [id, user?.id, navigate]);

    useEffect(() => {
        console.log("--- EFFECT 2 RUNNING (Timer) ---", { hasTest: !!test, isFinished, timeLeft });
        if (test && !isFinished && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [test, isFinished, timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        console.log("--- EFFECT 3 RUNNING (Auto-submit) ---", { timeLeft, hasTest: !!test, isFinished });
        if (test && !isFinished && timeLeft === 0) {
            handleSubmit(true);
        }
    }, [timeLeft, test, isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAnswerChange = (qId, type, value, checked) => {
        if (showQuestionFeedback) return; // disable change if feedback is shown
        setAnswers(prev => {
            const current = prev[qId];
            if (type === 'single' || type === 'text') {
                return { ...prev, [qId]: [value] };
            } else if (type === 'multiple') {
                const currArr = current || [];
                if (checked) {
                    return { ...prev, [qId]: [...currArr, value] };
                } else {
                    return { ...prev, [qId]: currArr.filter(v => v !== value) };
                }
            }
            return prev;
        });
    };

    const evaluateScore = () => {
        if (!test) return { score: 0, passed: false };

        let score = 0;
        activeQuestions.forEach(q => {
            const userAns = answers[q.id] || [];
            const correctAns = q.correctAnswers || [];

            if (q.type === 'text') {
                const uVal = userAns[0]?.toString().trim().toLowerCase() || '';
                const cVal = correctAns[0]?.toString().trim().toLowerCase() || '';
                if (uVal === cVal && uVal !== '') score++;
            } else {
                // Must match exactly: same length and all elements present
                if (userAns.length === correctAns.length && userAns.every(v => correctAns.includes(v))) {
                    score++;
                }
            }
        });

        return {
            score,
            passed: score >= test.passingScore
        };
    };

    const handleSubmit = async (isTimeout = false) => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        setIsLoading(true);
        const { score, passed } = evaluateScore();
        try {
            await saveResult({
                userId: user.id,
                testId: test.id,
                score,
                total: activeQuestions.length,
                passed,
                // answers, // Not storing full answers in this simple schema for now to avoid complexity
                // timeSpent: test.timeLimit - timeLeft
            });
            setIsFinished(true);
        } catch (err) {
            alert('Ошибка при сохранении результата');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <div className="p-20 text-center text-accent-primary animate-pulse font-bold text-xl">Секунду, работаем с облаком...</div>;
    if (!test) return <div className="p-8 text-center text-danger">Тест не найден.</div>;

    if (isFinished) {
        const { score, passed } = evaluateScore();
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="card w-full max-w-lg text-center animate-fade-in flex-col gap-4">
                    <div className="mb-4">
                        {passed ? (
                            <CheckCircle size={64} className="text-success mx-auto mb-4" />
                        ) : (
                            <AlertCircle size={64} className="text-danger mx-auto mb-4" />
                        )}
                        <h2 className="mb-2">Тест завершен</h2>
                        <p className="text-secondary">{test.title}</p>
                    </div>

                    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="p-3 border-r border-[var(--border-color)]">
                                <div className="text-xs text-secondary mb-1 uppercase tracking-wider">Ваш результат</div>
                                <div className={`text-3xl font-bold ${passed ? 'text-success' : 'text-danger'}`}>
                                    {score} / {activeQuestions.length}
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="text-xs text-secondary mb-1 uppercase tracking-wider">Проходной балл</div>
                                <div className="text-3xl font-bold text-primary">
                                    {test.passingScore}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                            <div className={`badge ${passed ? 'badge-success' : 'badge-danger'} text-sm py-1 px-3`}>
                                {passed ? 'Тест успешно сдан' : 'К сожалению, вы не набрали нужное количество баллов'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button onClick={() => navigate('/employee')} className="btn btn-primary w-full">
                            Вернуться на главную
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = activeQuestions[currentQuestionIndex];
    if (!currentQuestion) return <div className="p-8 text-center text-danger">Вопросы документа не найдены. Обратитесь к администратору.</div>;

    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === activeQuestions.length - 1;
    const progressPercent = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

    // Check if current question is correctly answered (used for immediate feedback)
    let isCurrentCorrect = false;
    const userAns = answers[currentQuestion.id] || [];
    const correctAns = currentQuestion.correctAnswers || [];
    if (currentQuestion.type === 'text') {
        const uVal = userAns[0]?.toString().trim().toLowerCase() || '';
        const cVal = correctAns[0]?.toString().trim().toLowerCase() || '';
        if (uVal === cVal && uVal !== '') isCurrentCorrect = true;
    } else {
        if (userAns.length > 0 && userAns.length === correctAns.length && userAns.every(v => correctAns.includes(v))) {
            isCurrentCorrect = true;
        }
    }
    const hasAnsweredCurrent = userAns.length > 0 || (currentQuestion.type === 'text' && userAns[0]?.toString().trim().length > 0);

    const handleNext = () => {
        if (test.showFeedback && !showQuestionFeedback && hasAnsweredCurrent) {
            setShowQuestionFeedback(true);
        } else {
            setShowQuestionFeedback(false);
            if (!isLast) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                handleSubmit(false);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto flex-col gap-6 animate-fade-in">
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'sticky', top: '4.5rem', zIndex: 40, marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/employee')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        title="Вернуться к списку тестов"
                    >
                        <ArrowLeft size={16} /> Назад
                    </button>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{test.title}</h3>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.125rem' }}>
                            Вопрос {currentQuestionIndex + 1} из {activeQuestions.length}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.75rem', fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 700, border: '1px solid', borderColor: timeLeft < 60 ? 'rgba(239,68,68,0.3)' : '#e2e8f0', background: timeLeft < 60 ? 'rgba(239,68,68,0.08)' : 'white', color: timeLeft < 60 ? '#ef4444' : 'var(--text-primary)' }}>
                    <Clock size={20} style={{ color: timeLeft < 60 ? '#ef4444' : 'var(--accent-primary)' }} />
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="progress-bg mt-0 rounded-none h-2">
                <div className="progress-fill shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${progressPercent}%` }}></div>
            </div>

            {/* Question Card */}
            <div className="card min-h-[400px] flex-col relative pb-28 shadow-xl border-t-0 rounded-t-none">
                <h2 className="text-2xl font-bold mb-8 leading-relaxed text-primary">{currentQuestion.text}</h2>

                <div className="flex-col gap-3">
                    {currentQuestion.type === 'text' ? (
                        <textarea
                            className="form-control"
                            placeholder="Введите ваш ответ здесь..."
                            value={(answers[currentQuestion.id] || [])[0] || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, 'text', e.target.value)}
                            rows={4}
                        />
                    ) : (
                        currentQuestion.options.map((opt, idx) => {
                            const isChecked = (answers[currentQuestion.id] || []).includes(opt);
                            const isCorrectOpt = currentQuestion.correctAnswers.includes(opt);
                            let bgClass = isChecked ? 'border-accent-primary bg-accent-primary/5 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]' : 'border-[var(--border-color)] bg-white hover:border-accent-primary/50 hover:bg-[var(--bg-secondary)] hover:shadow-md hover:-translate-y-0.5';

                            if (showQuestionFeedback) {
                                if (isCorrectOpt) {
                                    bgClass = 'border-success bg-success/10 shadow-[0_0_0_2px_var(--success)] scale-[1.01]';
                                } else if (isChecked && !isCorrectOpt) {
                                    bgClass = 'border-danger bg-danger/10 scale-[1.01]';
                                } else {
                                    bgClass = 'border-[var(--border-color)] opacity-50 bg-gray-50';
                                }
                            }

                            return (
                                <label
                                    key={idx}
                                    className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${bgClass}`}
                                >
                                    <input
                                        type={currentQuestion.type === 'single' ? 'radio' : 'checkbox'}
                                        name={`q-${currentQuestion.id}`}
                                        value={opt}
                                        checked={isChecked}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, currentQuestion.type, opt, e.target.checked)}
                                        className="w-5 h-5 accent-accent-primary flex-shrink-0"
                                        style={{ minWidth: '1.25rem' }}
                                    />
                                    <span className={`${isChecked ? 'text-primary font-medium' : 'text-secondary'}`}>{opt}</span>
                                </label>
                            );
                        })
                    )}
                </div>

                {/* Navigation Controls */}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>

                    {showQuestionFeedback && (
                        <div className={`flex items-center gap-2 animate-fade-in ${isCurrentCorrect ? 'text-success' : 'text-danger'}`}>
                            {isCurrentCorrect ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <div className="font-semibold">{isCurrentCorrect ? 'Правильный ответ!' : 'Неправильный ответ'}</div>
                        </div>
                    )}

                    <button
                        className={`btn ${showQuestionFeedback ? 'btn-primary' : (isLast && (!test.showFeedback || showQuestionFeedback) ? 'btn-success' : 'btn-primary')}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}
                        onClick={handleNext}
                        disabled={test.showFeedback && !hasAnsweredCurrent}
                    >
                        {showQuestionFeedback ? (
                            <>Дальше <ArrowRight size={18} /></>
                        ) : test.showFeedback ? (
                            <>Проверить ответ <CheckCircle size={18} /></>
                        ) : !isLast ? (
                            <>Дальше <ArrowRight size={18} /></>
                        ) : (
                            <><CheckCircle size={18} /> Завершить тест</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
