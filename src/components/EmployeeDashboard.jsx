import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle, Clock, AlertTriangle, FileText, BookOpen } from 'lucide-react';
import { getTests, getCurrentUser, getTestAttemptsCount, getUserResults, getArticles, hasUserCompletedArticle } from '../services/db';

export default function EmployeeDashboard() {
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [results, setResults] = useState([]);
    const user = getCurrentUser();

    useEffect(() => {
        if (user) {
            const allTests = getTests() || [];
            const allArticles = getArticles() || [];
            const userRes = getUserResults(user.id) || [];

            const filteredTests = allTests.filter(t => !t.allowedUsers || t.allowedUsers.length === 0 || t.allowedUsers.includes(user.id));
            const filteredArticles = allArticles.filter(a => !a.allowedUsers || a.allowedUsers.length === 0 || a.allowedUsers.includes(user.id));

            const testsWithStats = filteredTests.map(t => ({
                ...t,
                attemptsCount: getTestAttemptsCount(user.id, t.id),
                bestResult: userRes.filter(r => r.testId === t.id).sort((a, b) => b.score - a.score)[0] || null,
                articleCompleted: t.requiredArticleId ? hasUserCompletedArticle(user.id, t.requiredArticleId) : true,
                requiredArticle: t.requiredArticleId ? allArticles.find(a => a.id === t.requiredArticleId) : null
            }));

            setTests(testsWithStats);
            setArticles(filteredArticles);
            setResults(userRes);
        }
    }, [user?.id]);

    return (
        <div className="flex-col gap-8">
            {/* Articles Section */}
            <div>
                <div className="mb-4">
                    <h2 className="mb-2 flex items-center gap-2"><BookOpen size={24} className="text-accent-primary" /> Учебные материалы</h2>
                    <p className="mb-0 text-secondary">Рекомендуется изучить перед прохождением тестирования</p>
                </div>

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
            </div>

            {/* Tests Section */}
            <div>
                <div className="mb-4">
                    <h2 className="mb-2 flex items-center gap-2"><Play size={24} className="text-accent-primary" /> Мои Тесты</h2>
                    <p className="mb-0 text-secondary">Список доступных и пройденных тестирований</p>
                </div>

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
                                            {hasPassed ? <Play size={18} className="relative z-10" /> : <Play size={18} className="relative z-10" />} <span className="relative z-10">{hasPassed ? 'Пройти снова' : 'Начать тест'}</span>
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
            </div>
        </div>
    );
}
