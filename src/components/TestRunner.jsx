import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, ArrowRight, ArrowLeft, CheckCircle, Link2, Share2, HelpCircle, Download } from 'lucide-react';
import { getTestById, saveResult, getCurrentUser, getTestAttemptsCount, getAlreadyAnsweredQuestionIds, notifyResultSaved, addTestComment, askTestAuthor } from '../services/db';

// ── Result card canvas generator ─────────────────────────────────────────────
const rRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

const generateResultCard = (userName, testTitle, score, total, passed) => {
    const W = 800, H = 420;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const pct = total > 0 ? Math.round(score / total * 100) : 0;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0c1222'); bg.addColorStop(0.5, '#111827'); bg.addColorStop(1, '#0c1222');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Glow — top right (pass/fail color)
    const g1 = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, 320);
    g1.addColorStop(0, passed ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.18)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    // Glow — bottom left (indigo)
    const g2 = ctx.createRadialGradient(0, H, 0, 0, H, 280);
    g2.addColorStop(0, 'rgba(99,102,241,0.18)'); g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    // Thin top border line
    const line = ctx.createLinearGradient(0, 0, W, 0);
    line.addColorStop(0, 'transparent');
    line.addColorStop(0.3, passed ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.5)');
    line.addColorStop(0.7, passed ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.5)');
    line.addColorStop(1, 'transparent');
    ctx.fillStyle = line; ctx.fillRect(0, 0, W, 2);

    // App name (top left)
    ctx.font = 'bold 15px system-ui,-apple-system,sans-serif';
    ctx.fillStyle = passed ? '#10b981' : '#ef4444';
    ctx.textAlign = 'left';
    ctx.fillText('Аллея · Тестирование', 48, 52);

    // Pass/fail badge (top right)
    const badgeText = passed ? '✓  ТЕСТ СДАН' : '✗  НЕ СДАН';
    const bColor = passed ? '#10b981' : '#ef4444';
    const bBg = passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)';
    ctx.font = 'bold 12px system-ui,-apple-system,sans-serif';
    const bW = ctx.measureText(badgeText).width + 28;
    ctx.fillStyle = bBg;
    rRect(ctx, W - bW - 44, 34, bW, 30, 15); ctx.fill();
    ctx.strokeStyle = passed ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.3)';
    ctx.lineWidth = 1; rRect(ctx, W - bW - 44, 34, bW, 30, 15); ctx.stroke();
    ctx.fillStyle = bColor;
    ctx.textAlign = 'right';
    ctx.fillText(badgeText, W - 44 - 14, 53);

    // Big score
    const scoreStr = `${pct}%`;
    ctx.font = `900 118px system-ui,-apple-system,sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(scoreStr, W / 2, H / 2 + 38);

    // Score sub-label
    ctx.font = '400 16px system-ui,-apple-system,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fillText(`${score} из ${total} правильных ответов`, W / 2, H / 2 + 72);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2 - 120, H - 120); ctx.lineTo(W / 2 + 120, H - 120); ctx.stroke();

    // User name
    ctx.font = 'bold 20px system-ui,-apple-system,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillText(userName, W / 2, H - 88);

    // Test title
    ctx.font = '400 14px system-ui,-apple-system,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.36)';
    const title = testTitle.length > 64 ? testTitle.slice(0, 61) + '…' : testTitle;
    ctx.fillText(`«${title}»`, W / 2, H - 62);

    // Date (bottom right)
    ctx.textAlign = 'right';
    ctx.font = '400 12px system-ui,-apple-system,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText(new Date().toLocaleDateString('ru-RU'), W - 44, H - 32);

    return canvas;
};
import { sendTestResultToBitrix } from '../services/bitrix';
import { RunnerSkeleton } from './SkeletonLoader';

export default function TestRunner() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getCurrentUser();
    const timerRef = useRef(null);
    const isSubmittingRef = useRef(false); // guards against duplicate handleSubmit calls


    const [test, setTest] = useState(null);
    const [activeQuestions, setActiveQuestions] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [resultId, setResultId] = useState(null);
    const [showQuestionFeedback, setShowQuestionFeedback] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [sharedResult, setSharedResult] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // ── Post-test comment state ──
    const [commentText, setCommentText] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [commentDone, setCommentDone] = useState(false);

    // ── Share card state ──
    const [cardDownloading, setCardDownloading] = useState(false);

    // ── Ask author state ──
    const [askOpen, setAskOpen] = useState(false);
    const [askText, setAskText] = useState('');
    const [askSent, setAskSent] = useState(false);
    const [askSubmitting, setAskSubmitting] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

    const copyTestLink = () => {
        const url = `${window.location.origin}/test/${id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        });
    };

    const shareResult = (score, total, passed) => {
        const percent = Math.round((score / total) * 100);
        const params = new URLSearchParams({
            t: test?.title || '',
            s: score,
            n: total,
            p: passed ? '1' : '0',
            u: user?.name || '',
            d: new Date().toISOString(),
            ...(test?.isPublic ? { id } : {}),
        });
        const url = `${window.location.origin}/result?${params.toString()}`;
        const icon = passed ? '✅' : '❌';
        const text = `${icon} «${test?.title}»\nРезультат: ${score} из ${total} (${percent}%)\n${passed ? 'Тест сдан!' : 'Тест не сдан'}`;

        if (navigator.share) {
            navigator.share({ title: test?.title, text, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setSharedResult(true);
                setTimeout(() => setSharedResult(false), 2500);
            });
        }
    };

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

                    // Check deadline before allowing entry
                    if (dbTest.deadline && new Date(dbTest.deadline) < new Date()) {
                        alert('Срок сдачи этого теста истёк.');
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

                    if (dbTest.noRepeatQuestions) {
                        const answeredIds = await getAlreadyAnsweredQuestionIds(user.id, dbTest.id);
                        questionsToUse = questionsToUse.filter(q => !answeredIds.includes(q.id));
                    }

                    if (questionsToUse.length === 0) {
                        alert('Вы уже ответили на все доступные вопросы этого теста!');
                        navigate('/employee');
                        return;
                    }

                    if (dbTest.shuffleQuestions) {
                        questionsToUse.sort(() => Math.random() - 0.5);
                    }
                    if (dbTest.questionsLimit > 0 && dbTest.questionsLimit < questionsToUse.length) {
                        questionsToUse = questionsToUse.slice(0, dbTest.questionsLimit);
                    }

                    setTest(dbTest);
                    setActiveQuestions(questionsToUse);
                    setTimeLeft(dbTest.timeLimit);

                    // Create initial result record to track attempt
                    const initialResult = await saveResult({
                        userId: user.id,
                        testId: dbTest.id,
                        score: 0,
                        total: questionsToUse.length,
                        passed: false,
                        answeredQuestionIds: []
                    });
                    setResultId(initialResult.id);
                } catch (err) {
                    console.error('Failed to initialize test:', err);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        initTest();
    }, [id, user?.id, navigate]);

    // Timer: created once when test starts; counts down internally and clears itself at 0.
    // timeLeft is intentionally NOT in deps — functional updater always reads latest value.
    useEffect(() => {
        if (!test || isFinished || timeLeft <= 0) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [test, isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-submit when timer hits 0
    useEffect(() => {
        if (test && !isFinished && timeLeft === 0) {
            handleSubmit(true);
        }
    }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

    // Intercept browser Back button — show confirm dialog instead of navigating away
    useEffect(() => {
        if (!test || isFinished) return;

        // Push a dummy history entry so the back button fires popstate instead of leaving
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            // Re-push to keep the current URL while showing our dialog
            window.history.pushState(null, '', window.location.href);
            setShowExitConfirm(true);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [test, isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

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
                const synonyms = (q.synonyms || []).map(s => s.trim().toLowerCase());
                if ((uVal === cVal && uVal !== '') || synonyms.includes(uVal)) score++;
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

    const handleDownloadCard = () => {
        if (cardDownloading) return;
        setCardDownloading(true);
        const { score, passed } = evaluateScore();
        try {
            const canvas = generateResultCard(user.name, test.title, score, activeQuestions.length, passed);
            const link = document.createElement('a');
            link.download = `результат.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } finally {
            setTimeout(() => setCardDownloading(false), 1000);
        }
    };

    const handleAskQuestion = async () => {
        if (!askText.trim() || askSubmitting) return;
        setAskSubmitting(true);
        try {
            await askTestAuthor(test.id, user.id, user.name, askText);
            setAskSent(true);
            setAskText('');
            setAskOpen(false);
            setTimeout(() => setAskSent(false), 3500);
        } catch (err) {
            console.error('Ask error:', err);
        } finally {
            setAskSubmitting(false);
        }
    };

    const handleSubmit = async (isTimeout = false) => {
        // Prevent duplicate submissions (double-click, timer race, StrictMode, etc.)
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        if (timerRef.current) clearInterval(timerRef.current);

        setIsLoading(true);
        const { score, passed } = evaluateScore();
        try {
            await saveResult({
                id: resultId,
                userId: user.id,
                testId: test.id,
                score,
                total: activeQuestions.length,
                passed,
                answeredQuestionIds: activeQuestions.map(q => q.id),
                userAnswers: answers
            });

            await sendTestResultToBitrix({
                userName: user.name,
                testTitle: test.title,
                score,
                total: activeQuestions.length,
                passed
            });
            // Fire-and-forget push notifications (employee + all admins)
            notifyResultSaved(
                { id: resultId, userId: user.id, testId: test.id, score, total: activeQuestions.length, passed },
                test.title,
                user.name
            ).catch(() => {});

            setIsFinished(true);
        } catch (err) {
            alert('Ошибка при сохранении результата');
            console.error(err);
            isSubmittingRef.current = false; // allow retry on error
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return <RunnerSkeleton />;
    }
    if (!test) return <div className="p-8 text-center text-danger">Тест не найден.</div>;

    const handleSubmitComment = async () => {
        if (!commentText.trim() || commentSubmitting) return;
        setCommentSubmitting(true);
        try {
            await addTestComment(user.id, user.name, test.id, commentText.trim());
            setCommentDone(true);
        } catch (err) {
            console.error('Comment error:', err);
        } finally {
            setCommentSubmitting(false);
        }
    };

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

                    {/* ── Comment form ── */}
                    <div className="animate-fade-in" style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {commentDone ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                                <CheckCircle size={16}/> Спасибо за отзыв!
                            </div>
                        ) : (
                            <>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    💬 Оставьте отзыв о тесте
                                </div>
                                {/* Quick chips */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {['Легко 😌', 'В самый раз 👌', 'Сложно 🤯', 'Интересно 🤩', 'Советую ✅'].map(chip => (
                                        <button
                                            key={chip}
                                            type="button"
                                            onClick={() => setCommentText(prev => prev === chip ? '' : chip)}
                                            style={{
                                                padding: '0.3rem 0.7rem', borderRadius: '2rem', fontSize: '0.78rem', fontWeight: 600,
                                                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                                                border: `1.5px solid ${commentText === chip ? 'var(--accent-primary)' : '#e2e8f0'}`,
                                                background: commentText === chip ? 'rgba(16,185,129,0.1)' : 'white',
                                                color: commentText === chip ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                            }}
                                        >{chip}</button>
                                    ))}
                                </div>
                                {/* Free-form text */}
                                <textarea
                                    className="form-control"
                                    placeholder="Или напишите свой отзыв..."
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value.slice(0, 500))}
                                    rows={2}
                                    style={{ borderRadius: '0.75rem', resize: 'none', fontSize: '0.875rem' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={handleSubmitComment}
                                        disabled={!commentText.trim() || commentSubmitting}
                                        className="btn btn-primary"
                                        style={{ flex: 1, borderRadius: '0.75rem', padding: '0.55rem', fontSize: '0.875rem' }}
                                    >{commentSubmitting ? 'Отправка...' : 'Отправить'}</button>
                                    <button
                                        onClick={() => setCommentDone(true)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.55rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                                    >Пропустить</button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        {/* Download result card */}
                        <button
                            onClick={handleDownloadCard}
                            disabled={cardDownloading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: `1px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`, background: passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.05)', color: passed ? 'var(--accent-primary)' : '#ef4444', fontWeight: 700, fontSize: '0.9rem', cursor: cardDownloading ? 'wait' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                        >
                            <Download size={16} />
                            {cardDownloading ? 'Генерация...' : 'Скачать карточку результата'}
                        </button>

                        {test.isPublic && (
                            <button
                                onClick={() => shareResult(score, activeQuestions.length, passed)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid', borderColor: sharedResult ? 'rgba(16,185,129,0.4)' : '#e2e8f0', background: sharedResult ? 'rgba(16,185,129,0.08)' : 'white', color: sharedResult ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                            >
                                <Share2 size={16} />
                                {sharedResult ? 'Скопировано в буфер!' : 'Поделиться ссылкой'}
                            </button>
                        )}
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
        <>
        <div className="max-w-3xl mx-auto flex-col gap-4 animate-fade-in p-2 md:p-0">
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'sticky', top: '4.5rem', zIndex: 40, marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                    <button
                        onClick={() => setShowExitConfirm(true)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        title="Выйти из теста"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{test.title}</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.125rem' }}>
                            {currentQuestionIndex + 1} / {activeQuestions.length}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {test.isPublic && (
                        <button
                            onClick={copyTestLink}
                            title={copiedLink ? 'Скопировано!' : 'Скопировать ссылку на тест'}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', border: '1px solid', borderColor: copiedLink ? 'rgba(16,185,129,0.4)' : '#e2e8f0', background: copiedLink ? 'rgba(16,185,129,0.08)' : 'white', color: copiedLink ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                        >
                            <Link2 size={14} />
                            <span className="mobile-hide">{copiedLink ? 'Скопировано!' : 'Поделиться'}</span>
                        </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, border: '1px solid', borderColor: timeLeft < 60 ? 'rgba(239,68,68,0.3)' : '#e2e8f0', background: timeLeft < 60 ? 'rgba(239,68,68,0.08)' : 'white', color: timeLeft < 60 ? '#ef4444' : 'var(--text-primary)' }}>
                        <Clock size={18} style={{ color: timeLeft < 60 ? '#ef4444' : 'var(--accent-primary)' }} />
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            <div className="progress-bg mt-0 rounded-none h-1.5">
                <div className="progress-fill shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${progressPercent}%` }}></div>
            </div>

            {/* Question Card */}
            <div className="card min-h-[400px] flex-col relative shadow-xl border-t-0 rounded-t-none" style={{ padding: 'clamp(1rem, 5vw, 2.5rem)', paddingBottom: '8rem' }}>

                {/* ── Question media ── */}
                {currentQuestion.mediaUrl && (
                    <div style={{ marginBottom: '1.5rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        {currentQuestion.mediaType === 'image' && (
                            <img
                                src={currentQuestion.mediaUrl}
                                alt=""
                                style={{ display: 'block', width: '100%', maxHeight: '360px', objectFit: 'contain', background: '#f1f5f9' }}
                            />
                        )}
                        {currentQuestion.mediaType === 'audio' && (
                            <div style={{ padding: '1rem' }}>
                                <audio controls src={currentQuestion.mediaUrl} style={{ width: '100%', display: 'block' }} />
                            </div>
                        )}
                        {currentQuestion.mediaType === 'video' && (
                            <video
                                controls
                                src={currentQuestion.mediaUrl}
                                style={{ display: 'block', width: '100%', maxHeight: '360px', background: '#000' }}
                            />
                        )}
                    </div>
                )}

                <h2 style={{ marginBottom: '2rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>{currentQuestion.text}</h2>

                <div className="flex-col gap-3">
                    {currentQuestion.type === 'text' ? (
                        <textarea
                            className="form-control"
                            placeholder="Введите ваш ответ здесь..."
                            value={(answers[currentQuestion.id] || [])[0] || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, 'text', e.target.value)}
                            rows={4}
                            style={{ width: '100%', padding: '1rem', borderRadius: '1rem' }}
                        />
                    ) : (
                        currentQuestion.options.map((opt, idx) => {
                            const isChecked = (answers[currentQuestion.id] || []).includes(opt);
                            const isCorrectOpt = currentQuestion.correctAnswers.includes(opt);
                            let bgClass = isChecked ? 'border-accent-primary bg-accent-primary/5 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' : 'border-[var(--border-color)] bg-white';

                            if (showQuestionFeedback) {
                                if (isCorrectOpt) {
                                    bgClass = 'border-success bg-success/10 shadow-[0_0_0_2px_var(--success)]';
                                } else if (isChecked && !isCorrectOpt) {
                                    bgClass = 'border-danger bg-danger/10';
                                } else {
                                    bgClass = 'border-[var(--border-color)] opacity-50 bg-gray-50';
                                }
                            }

                            return (
                                <label
                                    key={idx}
                                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${bgClass}`}
                                    style={{ margin: 0 }}
                                >
                                    <input
                                        type={currentQuestion.type === 'single' ? 'radio' : 'checkbox'}
                                        name={`q-${currentQuestion.id}`}
                                        value={opt}
                                        checked={isChecked}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, currentQuestion.type, opt, e.target.checked)}
                                        className="w-5 h-5 accent-accent-primary flex-shrink-0"
                                    />
                                    <span style={{ lineHeight: 1.4 }} className={`${isChecked ? 'text-primary font-medium' : 'text-secondary'}`}>{opt}</span>
                                </label>
                            );
                        })
                    )}
                </div>

                {/* Navigation Controls */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem', borderBottomLeftRadius: '2rem', borderBottomRightRadius: '2rem' }}>

                    {/* ── Ask author widget ── */}
                    {test.createdBy && (
                        askSent ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', animation: 'fadeIn 0.2s ease' }}>
                                <CheckCircle size={14} /> Вопрос отправлен автору
                            </div>
                        ) : askOpen ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', animation: 'fadeIn 0.2s ease' }}>
                                <textarea
                                    autoFocus
                                    placeholder="Напишите вопрос автору теста..."
                                    value={askText}
                                    onChange={e => setAskText(e.target.value.slice(0, 500))}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskQuestion(); } }}
                                    rows={2}
                                    style={{ flex: 1, borderRadius: '0.75rem', border: '1px solid rgba(99,102,241,0.3)', padding: '0.5rem 0.7rem', fontSize: '0.8rem', resize: 'none', fontFamily: 'inherit', outline: 'none', background: 'white', lineHeight: 1.4 }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
                                    <button
                                        onClick={handleAskQuestion}
                                        disabled={!askText.trim() || askSubmitting}
                                        style={{ padding: '0.4rem 0.85rem', borderRadius: '0.625rem', border: 'none', background: askText.trim() ? '#6366f1' : '#e2e8f0', color: askText.trim() ? 'white' : '#94a3b8', fontWeight: 700, fontSize: '0.75rem', cursor: askText.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                    >{askSubmitting ? '...' : 'Отправить'}</button>
                                    <button
                                        onClick={() => { setAskOpen(false); setAskText(''); }}
                                        style={{ padding: '0.35rem 0.85rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', background: 'white', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.73rem', cursor: 'pointer', fontFamily: 'inherit' }}
                                    >Отмена</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAskOpen(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.76rem', fontWeight: 600, padding: 0, fontFamily: 'inherit', width: 'fit-content', transition: 'color 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
                            >
                                <HelpCircle size={13} /> Задать вопрос автору
                            </button>
                        )
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        {showQuestionFeedback ? (
                            <div className={`flex items-center gap-2 animate-fade-in ${isCurrentCorrect ? 'text-success' : 'text-danger'}`}>
                                {isCurrentCorrect ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <div className="font-bold text-sm">{isCurrentCorrect ? 'Правильно!' : 'Неверно'}</div>
                            </div>
                        ) : (
                            <div style={{ flex: 1 }}></div>
                        )}

                        <button
                            className={`btn ${showQuestionFeedback ? 'btn-primary' : (isLast && (!test.showFeedback || showQuestionFeedback) ? 'btn-success' : 'btn-primary')}`}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', minWidth: '140px' }}
                            onClick={handleNext}
                            disabled={test.showFeedback && !hasAnsweredCurrent}
                        >
                            {showQuestionFeedback ? (
                                <>Далее <ArrowRight size={18} /></>
                            ) : test.showFeedback ? (
                                <>Проверить <CheckCircle size={18} /></>
                            ) : !isLast ? (
                                <>Далее <ArrowRight size={18} /></>
                            ) : (
                                <><CheckCircle size={18} /> Готово</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* ── Exit Confirmation Modal ── */}
        {showExitConfirm && (
            <div
                onClick={() => setShowExitConfirm(false)}
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
                        padding: '2rem', maxWidth: '420px', width: '100%',
                        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.2)',
                        display: 'flex', flexDirection: 'column', gap: '1.25rem',
                        animation: 'fadeIn 0.2s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    {/* Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: '1rem', background: 'rgba(239,68,68,0.1)', margin: '0 auto' }}>
                        <AlertCircle size={24} style={{ color: '#ef4444' }} />
                    </div>

                    {/* Text */}
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem' }}>Выйти из теста?</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                            Попытка будет засчитана как <strong style={{ color: '#ef4444' }}>неудача</strong>.
                            Вы потратите одну из отведённых попыток, но не получите результата.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => setShowExitConfirm(false)}
                            style={{
                                flex: 1, padding: '0.75rem', borderRadius: '0.875rem',
                                border: '1px solid #e2e8f0', background: 'white',
                                color: 'var(--text-primary)', fontWeight: 600,
                                fontSize: '0.9375rem', cursor: 'pointer',
                                transition: 'all 0.2s', fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                        >
                            Остаться
                        </button>
                        <button
                            onClick={() => navigate('/employee')}
                            style={{
                                flex: 1, padding: '0.75rem', borderRadius: '0.875rem',
                                border: 'none', background: '#ef4444',
                                color: 'white', fontWeight: 600,
                                fontSize: '0.9375rem', cursor: 'pointer',
                                transition: 'all 0.2s', fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
