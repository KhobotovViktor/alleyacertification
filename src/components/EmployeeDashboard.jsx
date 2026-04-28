import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Play, CheckCircle, Clock, AlertTriangle, FileText, BookOpen,
    Star, Flame, Target, TrendingUp, Crown, Shield, Lock, Users, CalendarClock,
    Plus, Edit, Trash2, Link2, Copy, Send, PenLine, Heart, Rss, Zap, Trophy,
    BookMarked, GitFork
} from 'lucide-react';
import {
    getTestsSummary, getCurrentUser, getUserResults,
    getArticles, getArticleProgress, getDepartmentLeaderboard,
    getMyTests, deleteTest, updateTestStatus, getAllUsers,
    toggleTestLike, getPopularTests,
    getTestComments, addTestComment, deleteTestComment,
    getQuestionsForTest, answerTestQuestion,
    getActivityFeed, getReactionData, toggleResultReaction,
    toggleFollow, getFollowedAuthorIds,
    getWeeklyRating,
    copyTest, getMyCollections,
} from '../services/db';
import ChallengesTab from './ChallengesTab';
import CollectionsTab from './CollectionsTab';
import { AddToCollectionDropdown } from './CollectionsTab';
import { DashboardSkeleton } from './SkeletonLoader';

// ── Achievement definitions ──────────────────────────────────────────────────
const ACHIEVEMENTS = [
    {
        id: 'first_step',
        title: 'Первый шаг',
        desc: 'Пройдено первое тестирование',
        icon: <Play size={22} />,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.12)',
        border: 'rgba(16,185,129,0.25)',
        glow: '0 0 18px rgba(16,185,129,0.22)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1.5"/>
                <path d="M20 15 L34 24 L20 33 Z" fill="#10b981"/>
            </svg>
        ),
    },
    {
        id: 'perfect',
        title: 'Отличник',
        desc: '100% правильных ответов',
        icon: <Star size={22} />,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.3)',
        glow: '0 0 18px rgba(245,158,11,0.28)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1.5"/>
                <path d="M24 11 L27 20 H36 L29 26 L32 35 L24 29 L16 35 L19 26 L12 20 H21 Z" fill="#f59e0b"/>
            </svg>
        ),
    },
    {
        id: 'streak_3',
        title: 'Три в ряд',
        desc: '3 теста сданы подряд',
        icon: <Flame size={22} />,
        color: '#f97316',
        bg: 'rgba(249,115,22,0.12)',
        border: 'rgba(249,115,22,0.25)',
        glow: '0 0 18px rgba(249,115,22,0.22)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(249,115,22,0.12)" stroke="#f97316" strokeWidth="1.5"/>
                <path d="M24 36 C18 36 14 31 14 26 C14 21 18 17 20 14 C20 18 22 20 24 20 C22 17 23 13 26 11 C27 16 30 18 30 24 C30 21 28 20 27 20 C29 22 30 25 30 28 C30 33 27 36 24 36Z" fill="#f97316"/>
            </svg>
        ),
    },
    {
        id: 'streak_5',
        title: 'Пятёрка!',
        desc: '5 тестов сданы подряд',
        icon: <Trophy size={22} />,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.25)',
        glow: '0 0 18px rgba(239,68,68,0.2)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5"/>
                <path d="M16 14 H32 L29 26 C29 29 26.5 31 24 31 C21.5 31 19 29 19 26 Z" fill="#ef4444"/>
                <path d="M14 14 L16 14 L15 20 C14 22 12 22 12 20 Z" fill="#ef4444" opacity="0.6"/>
                <path d="M34 14 L32 14 L33 20 C34 22 36 22 36 20 Z" fill="#ef4444" opacity="0.6"/>
                <rect x="20" y="31" width="8" height="3" rx="1" fill="#ef4444" opacity="0.7"/>
                <rect x="17" y="34" width="14" height="2.5" rx="1.25" fill="#ef4444"/>
            </svg>
        ),
    },
    {
        id: 'sharpshooter',
        title: 'Снайпер',
        desc: '90%+ в трёх разных тестах',
        icon: <Target size={22} />,
        color: '#8b5cf6',
        bg: 'rgba(139,92,246,0.1)',
        border: 'rgba(139,92,246,0.25)',
        glow: '0 0 18px rgba(139,92,246,0.22)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" strokeWidth="1.5"/>
                <circle cx="24" cy="24" r="11" stroke="#8b5cf6" strokeWidth="1.5" fill="none"/>
                <circle cx="24" cy="24" r="6" stroke="#8b5cf6" strokeWidth="1.5" fill="none"/>
                <circle cx="24" cy="24" r="2.5" fill="#8b5cf6"/>
                <line x1="24" y1="13" x2="24" y2="10" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="24" y1="35" x2="24" y2="38" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="13" y1="24" x2="10" y2="24" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="35" y1="24" x2="38" y2="24" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        ),
    },
    {
        id: 'persistent',
        title: 'Настойчивый',
        desc: 'Сдал тест с повторной попытки',
        icon: <TrendingUp size={22} />,
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.1)',
        border: 'rgba(59,130,246,0.25)',
        glow: '0 0 18px rgba(59,130,246,0.2)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="1.5"/>
                <polyline points="12,30 19,22 24,27 36,15" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <polyline points="30,15 36,15 36,21" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
        ),
    },
    {
        id: 'all_tests',
        title: 'Всезнайка',
        desc: 'Сдал все доступные тесты',
        icon: <Crown size={22} />,
        color: '#ec4899',
        bg: 'rgba(236,72,153,0.1)',
        border: 'rgba(236,72,153,0.25)',
        glow: '0 0 18px rgba(236,72,153,0.22)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(236,72,153,0.1)" stroke="#ec4899" strokeWidth="1.5"/>
                <path d="M13 33 L13 22 L19 28 L24 14 L29 28 L35 22 L35 33 Z" fill="#ec4899" fillOpacity="0.85"/>
                <rect x="13" y="33" width="22" height="2.5" rx="1.25" fill="#ec4899"/>
            </svg>
        ),
    },
    {
        id: 'veteran',
        title: 'Ветеран',
        desc: '10 пройденных тестирований',
        icon: <Shield size={22} />,
        color: '#64748b',
        bg: 'rgba(100,116,139,0.1)',
        border: 'rgba(100,116,139,0.22)',
        glow: '0 0 14px rgba(100,116,139,0.18)',
        svg: (
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 36, height: 36 }}>
                <circle cx="24" cy="24" r="20" fill="rgba(100,116,139,0.1)" stroke="#64748b" strokeWidth="1.5"/>
                <path d="M24 12 L34 16 L34 25 C34 30.5 29.5 35 24 37 C18.5 35 14 30.5 14 25 L14 16 Z" fill="#64748b" fillOpacity="0.2" stroke="#64748b" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M19 24 L22.5 27.5 L29 21" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
];

// ── Compute earned achievements ──────────────────────────────────────────────
const computeAchievements = (results, availableTestCount) => {
    if (!results.length) return [];
    const sorted = [...results].sort((a, b) => new Date(a.date) - new Date(b.date));
    const earned = new Set();

    earned.add('first_step');

    if (results.some(r => r.total > 0 && r.score === r.total)) earned.add('perfect');

    let streak = 0, maxStreak = 0;
    for (const r of sorted) {
        if (r.passed) { streak++; maxStreak = Math.max(maxStreak, streak); }
        else streak = 0;
    }
    if (maxStreak >= 3) earned.add('streak_3');
    if (maxStreak >= 5) earned.add('streak_5');

    const highScoreTests = new Set(
        results.filter(r => r.total > 0 && r.score / r.total >= 0.9).map(r => r.testId)
    );
    if (highScoreTests.size >= 3) earned.add('sharpshooter');

    const byTest = {};
    for (const r of sorted) {
        (byTest[r.testId] = byTest[r.testId] || []).push(r);
    }
    const persistent = Object.values(byTest).some(attempts => {
        let hadFail = false;
        for (const a of attempts) {
            if (!a.passed) hadFail = true;
            else if (hadFail) return true;
        }
        return false;
    });
    if (persistent) earned.add('persistent');

    const passedTestIds = new Set(sorted.filter(r => r.passed).map(r => r.testId));
    if (availableTestCount > 0 && passedTestIds.size >= availableTestCount) earned.add('all_tests');

    if (results.length >= 10) earned.add('veteran');

    return [...earned];
};

// ── SVG Progress Chart ───────────────────────────────────────────────────────
const ProgressChart = ({ results }) => {
    const sorted = [...results]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-20);

    if (sorted.length < 2) {
        return (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', opacity: 0.65 }}>
                {sorted.length === 0
                    ? 'Пройдите первый тест — здесь появится ваш прогресс'
                    : 'Нужно минимум 2 попытки для отображения графика'}
            </div>
        );
    }

    const PL = 46, PT = 14, PB = 140, W = 580, H = 172;
    const chartW = W - PL - 22;
    const chartH = PB - PT;
    const n = sorted.length;

    const pts = sorted.map((r, i) => {
        const pct = r.total > 0 ? Math.round(r.score / r.total * 100) : 0;
        return {
            x: PL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW),
            y: PT + (1 - pct / 100) * chartH,
            pct,
            passed: r.passed,
            date: new Date(r.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        };
    });

    const polyPts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPts = `${PL},${PB} ${polyPts} ${pts[n - 1].x.toFixed(1)},${PB}`;
    const y70 = PT + 0.3 * chartH;
    const xLabels = [...new Set([0, Math.round((n - 1) / 2), n - 1])];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
            <defs>
                <linearGradient id="progAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28"/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01"/>
                </linearGradient>
            </defs>

            {/* Grid + Y labels */}
            {[0, 25, 50, 75, 100].map(pct => {
                const y = PT + (1 - pct / 100) * chartH;
                return (
                    <g key={pct}>
                        <line x1={PL} y1={y} x2={PL + chartW} y2={y} stroke="#f1f5f9" strokeWidth="1"/>
                        <text x={PL - 7} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{pct}%</text>
                    </g>
                );
            })}

            {/* Threshold at 70% */}
            <line x1={PL} y1={y70} x2={PL + chartW} y2={y70} stroke="#10b981" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.45"/>
            <text x={PL + 5} y={y70 - 4} fontSize="8" fill="#10b981" opacity="0.6">порог</text>

            {/* X axis */}
            <line x1={PL} y1={PB} x2={PL + chartW} y2={PB} stroke="#e2e8f0" strokeWidth="1"/>

            {/* Area fill */}
            <polygon points={areaPts} fill="url(#progAreaGrad)"/>

            {/* Line */}
            <polyline points={polyPts} fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>

            {/* Data points */}
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill={p.passed ? '#10b981' : '#ef4444'} stroke="white" strokeWidth="2"/>
                    <title>{p.date}: {p.pct}% ({p.passed ? 'Сдано' : 'Не сдано'})</title>
                </g>
            ))}

            {/* X labels */}
            {xLabels.map(i => (
                <text key={i} x={pts[i].x} y={H - 5} textAnchor="middle" fontSize="9" fill="#94a3b8">{pts[i].date}</text>
            ))}
        </svg>
    );
};

// ── Inline comments panel ────────────────────────────────────────────────────
const CommentsPanel = ({ testId, currentUserId, isTestAuthor, comments, input, onInputChange, onAdd, onDelete, onExpand, expanded, submitting }) => {
    const PREVIEW = 3;
    const list = comments || [];
    const visible = expanded ? list : list.slice(0, PREVIEW);
    const hidden = list.length - PREVIEW;

    const fmtDate = (iso) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = (now - d) / 1000;
        if (diff < 60) return 'только что';
        if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {comments === undefined ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.5rem', opacity: 0.6 }}>Загрузка...</div>
            ) : list.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.25rem 0', opacity: 0.55 }}>Комментариев пока нет — будьте первым</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {visible.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                            {/* Avatar */}
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.userId === currentUserId ? 'rgba(16,185,129,0.12)' : '#f1f5f9', color: c.userId === currentUserId ? 'var(--accent-primary)' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0, marginTop: '0.1rem' }}>
                                {c.userName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{c.userName}</span>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', opacity: 0.55 }}>{fmtDate(c.createdAt)}</span>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4, marginTop: '0.15rem', wordBreak: 'break-word' }}>{c.text}</div>
                            </div>
                            {/* Delete — own comment OR test author */}
                            {(c.userId === currentUserId || isTestAuthor) && (
                                <button
                                    onClick={() => onDelete(c.id)}
                                    title="Удалить"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '0.1rem 0.2rem', fontSize: '0.7rem', flexShrink: 0, lineHeight: 1, transition: 'color 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; }}
                                >✕</button>
                            )}
                        </div>
                    ))}
                    {!expanded && hidden > 0 && (
                        <button onClick={onExpand} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, color: 'var(--accent-primary)', textAlign: 'left', padding: '0.1rem 0', fontFamily: 'inherit' }}>
                            + ещё {hidden} {hidden === 1 ? 'комментарий' : hidden < 5 ? 'комментария' : 'комментариев'}
                        </button>
                    )}
                </div>
            )}

            {/* Input row */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
                <textarea
                    placeholder="Написать комментарий..."
                    value={input || ''}
                    onChange={e => onInputChange(e.target.value.slice(0, 500))}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAdd(); } }}
                    rows={1}
                    style={{ flex: 1, borderRadius: '0.625rem', border: '1px solid #e2e8f0', padding: '0.45rem 0.65rem', fontSize: '0.8rem', resize: 'none', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', background: 'white', lineHeight: 1.4 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                />
                <button
                    onClick={onAdd}
                    disabled={!(input || '').trim() || submitting}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '0.625rem', border: 'none', background: (input || '').trim() ? 'var(--accent-primary)' : '#e2e8f0', color: (input || '').trim() ? 'white' : '#94a3b8', fontWeight: 700, fontSize: '0.78rem', cursor: (input || '').trim() ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0, fontFamily: 'inherit' }}
                >
                    {submitting ? '...' : '→'}
                </button>
            </div>
        </div>
    );
};

// ── Questions-to-author panel ────────────────────────────────────────────────
const QuestionsPanel = ({ questions, answerInputs, onInputChange, onAnswer, submitting }) => {
    const relTime = (iso) => {
        const diff = (Date.now() - new Date(iso)) / 1000;
        if (diff < 60) return 'только что';
        if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
        return `${Math.floor(diff / 86400)} дн. назад`;
    };

    return (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {questions === undefined ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.5rem', opacity: 0.6 }}>Загрузка...</div>
            ) : questions.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.25rem 0', opacity: 0.55 }}>Вопросов пока нет</div>
            ) : questions.map(q => (
                <div key={q.id} style={{ background: q.answer ? '#f8fafc' : 'rgba(245,158,11,0.03)', border: `1px solid ${q.answer ? '#e2e8f0' : 'rgba(245,158,11,0.25)'}`, borderRadius: '0.75rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Question row */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                            {(q.fromUserName?.[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{q.fromUserName}</span>
                                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{relTime(q.createdAt)}</span>
                                {!q.answer && (
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '0.4rem', background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
                                        ожидает ответа
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45, marginTop: '0.2rem', wordBreak: 'break-word' }}>{q.question}</div>
                        </div>
                    </div>

                    {/* Answer / reply area */}
                    {q.answer ? (
                        <div style={{ marginLeft: '2.25rem', padding: '0.5rem 0.7rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', flexShrink: 0, marginTop: '0.05rem' }}>↩</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45, wordBreak: 'break-word' }}>{q.answer}</span>
                        </div>
                    ) : (
                        <div style={{ marginLeft: '2.25rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
                            <textarea
                                placeholder="Напишите ответ..."
                                value={answerInputs?.[q.id] || ''}
                                onChange={e => onInputChange(q.id, e.target.value.slice(0, 1000))}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAnswer(q.id); } }}
                                rows={2}
                                style={{ flex: 1, borderRadius: '0.625rem', border: '1px solid #e2e8f0', padding: '0.45rem 0.65rem', fontSize: '0.78rem', resize: 'none', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', background: 'white', lineHeight: 1.4 }}
                                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                            />
                            <button
                                onClick={() => onAnswer(q.id)}
                                disabled={!(answerInputs?.[q.id] || '').trim() || submitting}
                                style={{ padding: '0.45rem 0.8rem', borderRadius: '0.625rem', border: 'none', background: (answerInputs?.[q.id] || '').trim() ? 'var(--accent-primary)' : '#e2e8f0', color: (answerInputs?.[q.id] || '').trim() ? 'white' : '#94a3b8', fontWeight: 700, fontSize: '0.8rem', cursor: (answerInputs?.[q.id] || '').trim() ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0, fontFamily: 'inherit' }}
                            >{submitting ? '...' : '↩'}</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// ── Main component ───────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [results, setResults] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myTests, setMyTests] = useState([]);
    const [feedTests, setFeedTests] = useState(null); // null = not loaded yet
    const [feedUserLikedIds, setFeedUserLikedIds] = useState(new Set());
    const [feedLoading, setFeedLoading] = useState(false);
    const [likeInProgress, setLikeInProgress] = useState(new Set());
    const [copiedFeedTestId, setCopiedFeedTestId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tests');
    const [copiedMyTestId, setCopiedMyTestId] = useState(null);
    const [deleteMyTestId, setDeleteMyTestId] = useState(null);

    // ── Comments ──
    const [openCommentTestId, setOpenCommentTestId] = useState(null);
    const [commentsByTestId, setCommentsByTestId] = useState({});
    const [commentInputs, setCommentInputs] = useState({});   // testId → draft text
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [expandedComments, setExpandedComments] = useState({}); // testId → bool

    // ── Activity feed & reactions ──
    const [activityResults, setActivityResults] = useState(null); // null = not loaded
    const [activityLoading, setActivityLoading] = useState(false);
    const [reactionCounts, setReactionCounts] = useState({});  // resultId → {emoji → count}
    const [myReactions, setMyReactions] = useState({});        // resultId → Set<emoji>
    const [reactionInProgress, setReactionInProgress] = useState(new Set());

    // ── Follow ──
    const [followedAuthorIds, setFollowedAuthorIds] = useState(new Set()); // in Feed
    const [followInProgress, setFollowInProgress] = useState(new Set());

    // ── Weekly rating ──
    const [weeklyRating, setWeeklyRating] = useState(null); // null = not loaded
    const [weeklyLoading, setWeeklyLoading] = useState(false);

    // ── Copy test ──
    const [copyingTestId, setCopyingTestId] = useState(null);

    // ── Collections (for AddToCollection dropdown in feed) ──
    const [myCollections, setMyCollections] = useState(null); // null = not loaded

    // ── Questions to author ──
    const [openQuestionTestId, setOpenQuestionTestId] = useState(null);
    const [questionsByTestId, setQuestionsByTestId] = useState({});  // testId → Question[]
    const [questionAnswerInputs, setQuestionAnswerInputs] = useState({}); // testId → { qId → text }
    const [answerSubmitting, setAnswerSubmitting] = useState(false);

    const user = getCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user?.id]);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [allTests, allArticles, userRes, userArticleProgress, deptBoard, myCreatedTests] = await Promise.all([
                getTestsSummary(),
                getArticles(),
                getUserResults(user.id),
                getArticleProgress(user.id),
                user.department ? getDepartmentLeaderboard(user.department) : Promise.resolve([]),
                getMyTests(user.id),
            ]);

            const filteredTests = allTests.filter(t =>
                (t.status || 'published') !== 'draft' &&
                (!t.allowedUsers || t.allowedUsers.length === 0 || t.allowedUsers.includes(user.id))
            );
            const filteredArticles = allArticles.filter(a =>
                !a.allowedUsers || a.allowedUsers.length === 0 || a.allowedUsers.includes(user.id)
            );

            const testsWithStats = filteredTests.map(t => {
                const testResults = userRes.filter(r => r.testId === t.id);
                return {
                    ...t,
                    attemptsCount: testResults.length,
                    bestResult: testResults.sort((a, b) => b.score - a.score)[0] || null,
                    articleCompleted: !t.requiredArticleId || userArticleProgress.some(p => p.articleId === t.requiredArticleId),
                    requiredArticle: t.requiredArticleId ? allArticles.find(a => a.id === t.requiredArticleId) : null,
                };
            });

            setTests(testsWithStats);
            setArticles(filteredArticles);
            setResults(userRes);
            setLeaderboard(deptBoard || []);
            setMyTests(myCreatedTests || []);
        } catch (err) {
            console.error('Failed to load employee dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Feed / Activity: lazy-load when tab is first opened ──
    useEffect(() => {
        if (activeTab === 'feed') {
            if (feedTests === null) loadFeed();
            if (myCollections === null) loadMyCollections();
        }
        if (activeTab === 'activity') {
            if (activityResults === null) loadActivity();
            if (weeklyRating === null) loadWeeklyRating();
        }
    }, [activeTab]);

    const loadFeed = async () => {
        setFeedLoading(true);
        try {
            const [{ tests: popular, userLikedIds }, users, followedIds] = await Promise.all([
                getPopularTests(user.id),
                getAllUsers(),
                getFollowedAuthorIds(user.id),
            ]);
            const nameMap = Object.fromEntries(users.map(u => [u.id, u.name]));
            setFeedTests(popular.map(t => ({
                ...t,
                creatorName: t.createdBy ? (nameMap[t.createdBy] || 'Пользователь') : null,
            })));
            setFeedUserLikedIds(userLikedIds);
            setFollowedAuthorIds(followedIds);
        } catch (err) {
            console.error('Feed load error:', err);
            setFeedTests([]);
        } finally {
            setFeedLoading(false);
        }
    };

    const handleFollowAuthor = async (authorId) => {
        if (followInProgress.has(authorId)) return;
        setFollowInProgress(prev => new Set([...prev, authorId]));
        const was = followedAuthorIds.has(authorId);
        setFollowedAuthorIds(prev => {
            const s = new Set(prev);
            was ? s.delete(authorId) : s.add(authorId);
            return s;
        });
        try {
            await toggleFollow(user.id, authorId);
        } catch {
            setFollowedAuthorIds(prev => {
                const s = new Set(prev);
                was ? s.add(authorId) : s.delete(authorId);
                return s;
            });
        } finally {
            setFollowInProgress(prev => { const s = new Set(prev); s.delete(authorId); return s; });
        }
    };

    const loadActivity = async () => {
        setActivityLoading(true);
        try {
            const [results, allUsers] = await Promise.all([
                getActivityFeed(40),
                getAllUsers(),
            ]);
            const userMap = Object.fromEntries(allUsers.map(u => [u.id, u.name]));
            const enriched = results.map(r => ({ ...r, userName: userMap[r.userId] || 'Сотрудник' }));
            const { counts, myReactions: mine } = await getReactionData(enriched.map(r => r.id), user.id);
            setActivityResults(enriched);
            setReactionCounts(counts);
            setMyReactions(mine);
        } catch (err) {
            console.error('Activity load error:', err);
            setActivityResults([]);
        } finally {
            setActivityLoading(false);
        }
    };

    const loadWeeklyRating = async () => {
        setWeeklyLoading(true);
        try {
            const data = await getWeeklyRating();
            setWeeklyRating(data);
        } catch (err) {
            console.error('Weekly rating load error:', err);
            setWeeklyRating([]);
        } finally {
            setWeeklyLoading(false);
        }
    };

    const loadMyCollections = async () => {
        if (!user?.id) return;
        try {
            const data = await getMyCollections(user.id);
            setMyCollections(data);
        } catch (err) {
            setMyCollections([]);
        }
    };

    const handleCopyTest = async (testId) => {
        if (copyingTestId) return;
        setCopyingTestId(testId);
        try {
            const newTest = await copyTest(testId, user.id);
            navigate(`/employee/test/${newTest.id}`);
        } catch (err) {
            alert('Ошибка при копировании теста');
        } finally {
            setCopyingTestId(null);
        }
    };

    const handleReact = async (resultId, emoji) => {
        const key = `${resultId}:${emoji}`;
        if (reactionInProgress.has(key)) return;
        setReactionInProgress(prev => new Set([...prev, key]));

        // Optimistic
        const wasReacted = myReactions[resultId]?.has(emoji);
        setMyReactions(prev => {
            const s = new Set(prev[resultId] || []);
            wasReacted ? s.delete(emoji) : s.add(emoji);
            return { ...prev, [resultId]: s };
        });
        setReactionCounts(prev => ({
            ...prev,
            [resultId]: {
                ...(prev[resultId] || {}),
                [emoji]: Math.max(0, ((prev[resultId]?.[emoji] || 0) + (wasReacted ? -1 : 1))),
            },
        }));

        try {
            await toggleResultReaction(resultId, user.id, emoji);
        } catch (err) {
            // Revert on error
            setMyReactions(prev => {
                const s = new Set(prev[resultId] || []);
                wasReacted ? s.add(emoji) : s.delete(emoji);
                return { ...prev, [resultId]: s };
            });
            setReactionCounts(prev => ({
                ...prev,
                [resultId]: {
                    ...(prev[resultId] || {}),
                    [emoji]: Math.max(0, ((prev[resultId]?.[emoji] || 0) + (wasReacted ? 1 : -1))),
                },
            }));
        } finally {
            setReactionInProgress(prev => { const n = new Set(prev); n.delete(key); return n; });
        }
    };

    const handleLike = async (testId) => {
        if (likeInProgress.has(testId)) return;
        setLikeInProgress(prev => new Set([...prev, testId]));
        try {
            const nowLiked = await toggleTestLike(user.id, testId);
            setFeedUserLikedIds(prev => {
                const next = new Set(prev);
                if (nowLiked) next.add(testId); else next.delete(testId);
                return next;
            });
            setFeedTests(prev => prev.map(t =>
                t.id === testId
                    ? { ...t, likeCount: t.likeCount + (nowLiked ? 1 : -1) }
                    : t
            ));
        } finally {
            setLikeInProgress(prev => { const next = new Set(prev); next.delete(testId); return next; });
        }
    };

    const copyFeedLink = (testId) => {
        const url = `${window.location.origin}/test/${testId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedFeedTestId(testId);
            setTimeout(() => setCopiedFeedTestId(null), 2000);
        });
    };

    const toggleComments = async (testId) => {
        if (openCommentTestId === testId) {
            setOpenCommentTestId(null);
            return;
        }
        setOpenCommentTestId(testId);
        // Load if not cached yet
        if (commentsByTestId[testId] === undefined) {
            try {
                const comments = await getTestComments(testId);
                setCommentsByTestId(prev => ({ ...prev, [testId]: comments }));
            } catch {
                setCommentsByTestId(prev => ({ ...prev, [testId]: [] }));
            }
        }
    };

    const handleAddComment = async (testId) => {
        const text = (commentInputs[testId] || '').trim();
        if (!text || commentSubmitting) return;
        setCommentSubmitting(true);
        try {
            const newComment = await addTestComment(user.id, user.name, testId, text);
            setCommentsByTestId(prev => ({
                ...prev,
                [testId]: [...(prev[testId] || []), newComment],
            }));
            setCommentInputs(prev => ({ ...prev, [testId]: '' }));
            // Bump comment count in feed list
            setFeedTests(prev => prev?.map(t =>
                t.id === testId ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t
            ));
            // Bump in myTests list
            setMyTests(prev => prev.map(t =>
                t.id === testId ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t
            ));
        } catch (err) {
            console.error('Comment error:', err);
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleDeleteComment = async (testId, commentId) => {
        try {
            await deleteTestComment(commentId);
            setCommentsByTestId(prev => ({
                ...prev,
                [testId]: (prev[testId] || []).filter(c => c.id !== commentId),
            }));
            setFeedTests(prev => prev?.map(t =>
                t.id === testId ? { ...t, commentCount: Math.max(0, (t.commentCount || 1) - 1) } : t
            ));
            setMyTests(prev => prev.map(t =>
                t.id === testId ? { ...t, commentCount: Math.max(0, (t.commentCount || 1) - 1) } : t
            ));
        } catch (err) {
            console.error('Delete comment error:', err);
        }
    };

    const toggleQuestions = async (testId) => {
        if (openQuestionTestId === testId) { setOpenQuestionTestId(null); return; }
        setOpenQuestionTestId(testId);
        if (questionsByTestId[testId] === undefined) {
            try {
                const qs = await getQuestionsForTest(testId);
                setQuestionsByTestId(prev => ({ ...prev, [testId]: qs }));
            } catch {
                setQuestionsByTestId(prev => ({ ...prev, [testId]: [] }));
            }
        }
    };

    const handleAnswerQuestion = async (testId, questionId) => {
        const answer = (questionAnswerInputs[testId]?.[questionId] || '').trim();
        if (!answer || answerSubmitting) return;
        setAnswerSubmitting(true);
        try {
            const updated = await answerTestQuestion(questionId, answer);
            setQuestionsByTestId(prev => ({
                ...prev,
                [testId]: (prev[testId] || []).map(q => q.id === questionId ? updated : q),
            }));
            setQuestionAnswerInputs(prev => ({
                ...prev,
                [testId]: { ...(prev[testId] || {}), [questionId]: '' },
            }));
            setMyTests(prev => prev.map(t =>
                t.id === testId
                    ? { ...t, unansweredQuestionCount: Math.max(0, (t.unansweredQuestionCount || 1) - 1) }
                    : t
            ));
        } catch (err) {
            console.error('Answer error:', err);
        } finally {
            setAnswerSubmitting(false);
        }
    };

    if (isLoading) return <DashboardSkeleton />;

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    // ── Derived stats ──
    const earnedAchievements = computeAchievements(results, tests.length);

    const sortedByDate = [...results].sort((a, b) => new Date(a.date) - new Date(b.date));
    let currentStreak = 0;
    for (let i = sortedByDate.length - 1; i >= 0; i--) {
        if (sortedByDate[i].passed) currentStreak++;
        else break;
    }
    const bestPct = results.length > 0
        ? Math.max(...results.map(r => r.total > 0 ? Math.round(r.score / r.total * 100) : 0))
        : 0;

    const myRank = leaderboard.findIndex(u => u.id === user.id) + 1;

    const handleDeleteMyTest = async (testId) => {
        try {
            await deleteTest(testId);
            setMyTests(prev => prev.filter(t => t.id !== testId));
            setDeleteMyTestId(null);
        } catch (err) {
            alert('Ошибка при удалении теста');
        }
    };

    const handleToggleMyTestStatus = async (test) => {
        const next = (test.status || 'published') === 'draft' ? 'published' : 'draft';
        try {
            await updateTestStatus(test.id, next);
            setMyTests(prev => prev.map(t => t.id === test.id ? { ...t, status: next } : t));
        } catch {
            alert('Не удалось изменить статус теста');
        }
    };

    const copyMyTestLink = (testId) => {
        const url = `${window.location.origin}/test/${testId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedMyTestId(testId);
            setTimeout(() => setCopiedMyTestId(null), 2000);
        });
    };

    const tabs = [
        { key: 'tests',         icon: <Play size={16} />,         label: 'Тесты' },
        { key: 'feed',          icon: <Rss size={16} />,          label: 'Лента' },
        { key: 'activity',      icon: <Zap size={16} />,          label: 'Активность' },
        { key: 'challenges',    icon: <Trophy size={16} />,       label: 'Челленджи' },
        { key: 'collections',   icon: <BookMarked size={16} />,   label: 'Коллекции' },
        { key: 'mytests',       icon: <Plus size={16} />,         label: 'Мои тесты' },
        { key: 'results',       icon: <CheckCircle size={16} />,  label: 'Результаты' },
        { key: 'articles',      icon: <BookOpen size={16} />,     label: 'Материалы' },
        { key: 'trainingStats', icon: <Clock size={16} />,        label: 'Статистика' },
        { key: 'progress',      icon: <Star size={16} />,         label: 'Прогресс' },
    ];

    return (
        <div className="flex-col gap-6">

            {/* ── Bento header ── */}
            <div className="bento-grid mb-8">
                <div className="bento-card bento-card-large bg-gradient-to-br from-white to-slate-50">
                    <div className="flex-col justify-center h-full">
                        <div className="flex items-center gap-4 mb-2">
                            <div>
                                <h2 className="m-0 leading-tight">Привет, {user.name}!</h2>
                                <p className="m-0 text-secondary opacity-70 mt-0.5">{user.role === 'admin' ? 'Администратор' : 'Сотрудник'}</p>
                            </div>
                        </div>
                        <p className="m-0 text-sm text-secondary opacity-80">Готов к сегодняшним достижениям? Твой прогресс выглядит отлично.</p>
                        <Link to={`/profile/${user.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', padding: '0.4rem 0.875rem', borderRadius: '0.75rem', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.06)', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
                            👤 Мой профиль
                        </Link>
                    </div>
                </div>

                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle size={18}/></div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Тесты сданы</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">{results.filter(r => r.passed).length}</div>
                    <p className="text-[11px] text-secondary opacity-60 m-0 mt-1">Верных ответов выше порога</p>
                </div>

                <div className="bento-card">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Clock size={18}/></div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-secondary opacity-70">Средний балл</span>
                    </div>
                    <div className="text-4xl font-black text-primary leading-none mb-1">
                        {results.length > 0
                            ? Math.round(results.reduce((acc, r) => acc + r.score / r.total, 0) / results.length * 100)
                            : 0}%
                    </div>
                    <p className="text-[11px] text-secondary opacity-60 m-0 mt-1">Отношение верных к общему числу</p>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', borderRadius: '0.75rem',
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                background: activeTab === tab.key ? 'white' : 'transparent',
                                color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {tab.icon}
                            <span className="mobile-text-sm">{tab.label}</span>
                            {tab.key === 'progress' && earnedAchievements.length > 0 && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 4px',
                                    background: activeTab === 'progress' ? 'var(--accent-primary)' : 'rgba(16,185,129,0.12)',
                                    color: activeTab === 'progress' ? 'white' : 'var(--accent-primary)',
                                    fontSize: '0.65rem', fontWeight: 800,
                                }}>
                                    {earnedAchievements.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tests ── */}
            {activeTab === 'tests' && (
                <div className="bento-grid">
                    {tests.map((test, index) => {
                        const now = new Date();
                        const deadlineDate = test.deadline ? new Date(test.deadline) : null;
                        const isExpired = deadlineDate && deadlineDate < now;
                        const hoursLeft = deadlineDate && !isExpired ? (deadlineDate - now) / 3_600_000 : null;
                        const isBlocked = isExpired || (test.maxAttempts > 0 && test.attemptsCount >= test.maxAttempts);
                        const hasPassed = test.bestResult?.passed;

                        // Deadline badge colour
                        const deadlineBadgeStyle = isExpired
                            ? { background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }
                            : hoursLeft !== null && hoursLeft <= 24
                                ? { background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
                                : hoursLeft !== null && hoursLeft <= 48
                                    ? { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }
                                    : { background: 'rgba(16,185,129,0.07)', color: 'var(--accent-primary)', border: '1px solid rgba(16,185,129,0.2)' };

                        return (
                            <div key={test.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`}>
                                <div className="flex-col gap-1 mb-4 pr-6">
                                    <h3 className="text-lg font-bold text-primary leading-tight">{test.title}</h3>
                                </div>
                                <div className="flex-col gap-2.5 mb-6">
                                    {deadlineDate && (
                                        <div className="flex items-center gap-2 text-sm" style={{ ...deadlineBadgeStyle, padding: '0.25rem 0.625rem', borderRadius: '0.5rem', width: 'fit-content', fontSize: '0.75rem', fontWeight: 600 }}>
                                            <CalendarClock size={12}/>
                                            {isExpired
                                                ? 'Срок истёк'
                                                : `До ${deadlineDate.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-accent-primary"><Clock size={14}/></div>
                                        <span>{test.timeLimit / 60} мин</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-success"><CheckCircle size={14}/></div>
                                        <span className="mobile-text-sm">Порог: {test.passingScore} балла</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary">
                                        <div className={`w-6 h-6 rounded bg-slate-50 flex items-center justify-center ${isBlocked && !hasPassed ? 'text-danger' : 'text-warning'}`}><AlertTriangle size={14}/></div>
                                        <span className="mobile-text-sm">Попытки: {test.attemptsCount} / {test.maxAttempts === 0 ? '∞' : test.maxAttempts}</span>
                                    </div>
                                </div>
                                <div className="mt-auto flex-col gap-2">
                                    {hasPassed && (
                                        <div className="btn w-full btn-secondary text-sm bg-success/5 text-success border-success/10 flex justify-center items-center gap-2 pointer-events-none" style={{ padding: '0.875rem' }}>
                                            <CheckCircle size={18}/><span className="font-bold">Тест успешно сдан</span>
                                        </div>
                                    )}
                                    {!test.articleCompleted ? (
                                        <Link to={`/article/${test.requiredArticleId}`} className="btn w-full btn-secondary warning overflow-hidden text-ellipsis whitespace-nowrap text-xs flex justify-center items-center gap-1 bg-warning/10 text-warning border-warning/30 hover:bg-warning/20" style={{ padding: '0.875rem' }}>
                                            <AlertTriangle size={14}/><span className="truncate">Изучить: {test.requiredArticle?.title || 'Материал'}</span>
                                        </Link>
                                    ) : isExpired ? (
                                        <button className="btn w-full btn-secondary text-sm opacity-50" disabled style={{ padding: '0.875rem' }}>Срок сдачи истёк</button>
                                    ) : isBlocked ? (
                                        <button className="btn w-full btn-secondary text-sm opacity-50" disabled style={{ padding: '0.875rem' }}>Попытки исчерпаны</button>
                                    ) : (
                                        <button onClick={() => navigate(`/test/${test.id}`)} className="btn btn-primary w-full flex justify-center gap-2 relative overflow-hidden group" style={{ padding: '0.875rem' }}>
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"/>
                                            <Play size={18} className="relative z-10"/>
                                            <span className="relative z-10 font-bold">{hasPassed ? 'Пройти снова' : 'Начать тест'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {tests.length === 0 && (
                        <div className="bento-card col-span-full p-8 text-center text-secondary border-dashed">Нет доступных тестов.</div>
                    )}
                </div>
            )}

            {/* ── Feed ── */}
            {activeTab === 'feed' && (
                <div className="flex-col gap-5 animate-fade-in">
                    <div>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Rss size={18} style={{ color: 'var(--accent-primary)' }}/> Лента популярных тестов
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                            Все публичные тесты сервиса — лайкайте понравившиеся и делитесь ссылкой
                        </p>
                    </div>

                    {feedLoading || feedTests === null ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                            {[1,2,3,4,5,6].map(i => (
                                <div key={i} style={{ borderRadius: '1.25rem', background: 'white', border: '1px solid #f1f5f9', padding: '1.25rem', minHeight: '180px', animation: 'pulse 1.5s infinite' }}>
                                    <div style={{ height: 18, borderRadius: 6, background: '#f1f5f9', marginBottom: '0.75rem', width: '70%' }}/>
                                    <div style={{ height: 12, borderRadius: 4, background: '#f8fafc', marginBottom: '0.5rem', width: '45%' }}/>
                                    <div style={{ height: 12, borderRadius: 4, background: '#f8fafc', width: '55%' }}/>
                                </div>
                            ))}
                        </div>
                    ) : feedTests.length === 0 ? (
                        <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderStyle: 'dashed' }}>
                            <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <Rss size={24} style={{ color: 'var(--accent-primary)' }}/>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Лента пока пуста</div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                Когда появятся публичные тесты — они отобразятся здесь
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                            {feedTests.map((test, index) => {
                                const liked = feedUserLikedIds.has(test.id);
                                const pending = likeInProgress.has(test.id);
                                const isCopied = copiedFeedTestId === test.id;
                                return (
                                    <div key={test.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                                        {/* Header */}
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.35, color: 'var(--text-primary)', marginBottom: test.creatorName ? '0.35rem' : 0 }}>
                                                {test.title}
                                            </div>
                                            {test.creatorName && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                    <Link to={`/profile/${test.createdBy}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.15)', textDecoration: 'none' }}>
                                                        <Users size={9}/> {test.creatorName}
                                                    </Link>
                                                    {test.createdBy !== user.id && (
                                                        <button
                                                            onClick={() => handleFollowAuthor(test.createdBy)}
                                                            disabled={followInProgress.has(test.createdBy)}
                                                            style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', border: `1px solid ${followedAuthorIds.has(test.createdBy) ? 'rgba(16,185,129,0.3)' : '#e2e8f0'}`, background: followedAuthorIds.has(test.createdBy) ? 'rgba(16,185,129,0.08)' : 'white', color: followedAuthorIds.has(test.createdBy) ? 'var(--accent-primary)' : '#64748b', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                                                        >
                                                            {followedAuthorIds.has(test.createdBy) ? '✓ Слежу' : '+ Следить'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats chips */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                                                {test.questionsCount} вопр.
                                            </span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                                                {test.timeLimit / 60} мин.
                                            </span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.08)', color: 'var(--accent-primary)' }}>
                                                Балл: {test.passingScore}
                                            </span>
                                        </div>

                                        {/* Action row */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', alignItems: 'stretch' }}>
                                            {/* Like button */}
                                            <button
                                                onClick={() => handleLike(test.id)}
                                                disabled={pending}
                                                title={liked ? 'Убрать лайк' : 'Понравилось'}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                    padding: '0.6rem 0.75rem', borderRadius: '0.75rem',
                                                    border: `1.5px solid ${liked ? 'rgba(239,68,68,0.3)' : '#e2e8f0'}`,
                                                    background: liked ? 'rgba(239,68,68,0.07)' : 'white',
                                                    color: liked ? '#ef4444' : 'var(--text-secondary)',
                                                    fontSize: '0.82rem', fontWeight: 700,
                                                    cursor: pending ? 'wait' : 'pointer',
                                                    transition: 'all 0.2s', flexShrink: 0,
                                                }}
                                                onMouseEnter={e => { if (!pending) { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.color = '#ef4444'; }}}
                                                onMouseLeave={e => { if (!pending) { e.currentTarget.style.borderColor = liked ? 'rgba(239,68,68,0.3)' : '#e2e8f0'; e.currentTarget.style.background = liked ? 'rgba(239,68,68,0.07)' : 'white'; e.currentTarget.style.color = liked ? '#ef4444' : 'var(--text-secondary)'; }}}
                                            >
                                                <Heart size={14} style={{ fill: liked ? '#ef4444' : 'none', transition: 'fill 0.2s' }}/>
                                                <span>{test.likeCount > 0 ? test.likeCount : ''}</span>
                                            </button>

                                            {/* Comments toggle */}
                                            <button
                                                onClick={() => toggleComments(test.id)}
                                                title="Комментарии"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                    padding: '0.6rem 0.7rem', borderRadius: '0.75rem',
                                                    border: `1.5px solid ${openCommentTestId === test.id ? 'rgba(99,102,241,0.35)' : '#e2e8f0'}`,
                                                    background: openCommentTestId === test.id ? 'rgba(99,102,241,0.07)' : 'white',
                                                    color: openCommentTestId === test.id ? '#6366f1' : 'var(--text-secondary)',
                                                    fontSize: '0.8rem', fontWeight: 700,
                                                    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = '#6366f1'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = openCommentTestId === test.id ? 'rgba(99,102,241,0.35)' : '#e2e8f0'; e.currentTarget.style.background = openCommentTestId === test.id ? 'rgba(99,102,241,0.07)' : 'white'; e.currentTarget.style.color = openCommentTestId === test.id ? '#6366f1' : 'var(--text-secondary)'; }}
                                            >
                                                💬 {test.commentCount > 0 ? test.commentCount : ''}
                                            </button>

                                            {/* Share button */}
                                            <button
                                                onClick={() => copyFeedLink(test.id)}
                                                title="Скопировать ссылку"
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '2.5rem', borderRadius: '0.75rem',
                                                    border: `1.5px solid ${isCopied ? 'rgba(16,185,129,0.35)' : '#e2e8f0'}`,
                                                    background: isCopied ? 'rgba(16,185,129,0.08)' : 'white',
                                                    color: isCopied ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                                                }}
                                                onMouseEnter={e => { if (!isCopied) { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.background = 'rgba(16,185,129,0.06)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}}
                                                onMouseLeave={e => { if (!isCopied) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
                                            >
                                                {isCopied ? <CheckCircle size={14}/> : <Link2 size={14}/>}
                                            </button>

                                            {/* Add to collection */}
                                            <AddToCollectionDropdown
                                                testId={test.id}
                                                collections={myCollections}
                                                onAdded={() => {}}
                                            />

                                            {/* Copy test — only for tests by others */}
                                            {test.createdBy !== user.id && (
                                                <button
                                                    onClick={() => handleCopyTest(test.id)}
                                                    disabled={copyingTestId === test.id}
                                                    title="Взять за основу — создать копию в «Мои тесты»"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        width: '2.5rem', borderRadius: '0.75rem',
                                                        border: '1.5px solid #e2e8f0', background: 'white',
                                                        color: 'var(--text-secondary)',
                                                        cursor: copyingTestId === test.id ? 'wait' : 'pointer',
                                                        transition: 'all 0.2s', flexShrink: 0,
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; e.currentTarget.style.color = '#6366f1'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                                >
                                                    {copyingTestId === test.id ? <span style={{ fontSize: '0.7rem' }}>...</span> : <GitFork size={14}/>}
                                                </button>
                                            )}

                                            {/* Take test button */}
                                            <button
                                                onClick={() => navigate(`/test/${test.id}`)}
                                                className="btn btn-primary"
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.6rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}
                                            >
                                                <Play size={13}/> Пройти
                                            </button>
                                        </div>

                                        {/* Expandable comments */}
                                        {openCommentTestId === test.id && (
                                            <CommentsPanel
                                                testId={test.id}
                                                currentUserId={user.id}
                                                isTestAuthor={test.createdBy === user.id}
                                                comments={commentsByTestId[test.id]}
                                                input={commentInputs[test.id]}
                                                onInputChange={v => setCommentInputs(prev => ({ ...prev, [test.id]: v }))}
                                                onAdd={() => handleAddComment(test.id)}
                                                onDelete={cid => handleDeleteComment(test.id, cid)}
                                                onExpand={() => setExpandedComments(prev => ({ ...prev, [test.id]: true }))}
                                                expanded={!!expandedComments[test.id]}
                                                submitting={commentSubmitting}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Activity ── */}
            {activeTab === 'activity' && (
                <div className="flex-col gap-5 animate-fade-in">
                    <div>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={18} style={{ color: 'var(--accent-primary)' }} /> Активность коллег
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                            Последние сданные тесты — отмечайте успехи коллег реакциями
                        </p>
                    </div>

                    {/* ── Weekly Rating widget ── */}
                    {(() => {
                        const now = new Date();
                        const day = now.getDay();
                        const monday = new Date(now);
                        monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
                        monday.setHours(0, 0, 0, 0);
                        const weekLabel = `${monday.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} — сегодня`;
                        const medals = ['🥇', '🥈', '🥉'];
                        return (
                            <div className="bento-card" style={{ padding: '1.1rem 1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Crown size={16} style={{ color: '#f59e0b' }} /> Рейтинг недели
                                    </h4>
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{weekLabel}</span>
                                </div>
                                {weeklyLoading || weeklyRating === null ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {[1,2,3].map(i => (
                                            <div key={i} className="animate-pulse" style={{ height: 32, borderRadius: '0.5rem', background: 'linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)' }} />
                                        ))}
                                    </div>
                                ) : weeklyRating.length === 0 ? (
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', opacity: 0.6, textAlign: 'center', padding: '0.5rem 0' }}>
                                        На этой неделе ещё нет сданных тестов
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {weeklyRating.map((row, idx) => {
                                            const isMe = row.userId === user.id;
                                            return (
                                                <div key={row.userId} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.65rem', borderRadius: '0.6rem',
                                                    background: isMe ? 'rgba(99,102,241,0.07)' : idx === 0 ? 'rgba(245,158,11,0.06)' : 'transparent',
                                                    border: isMe ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                                                }}>
                                                    <span style={{ width: '1.5rem', textAlign: 'center', flexShrink: 0, fontSize: '0.9rem' }}>
                                                        {idx < 3 ? medals[idx] : `${idx + 1}.`}
                                                    </span>
                                                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: isMe ? 800 : 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {row.name}{isMe && ' (вы)'}
                                                        {row.department && <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: '0.72rem', marginLeft: '0.3rem' }}>{row.department}</span>}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981', flexShrink: 0 }}>
                                                        {row.passedCount} <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: '0.7rem' }}>сдано</span>
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', flexShrink: 0 }}>
                                                        {row.avgScore}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {activityLoading ? (
                        <div className="bento-grid">
                            {[1,2,3,4,5,6].map(i => (
                                <div key={i} className="bento-card animate-pulse" style={{ height: '130px', background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)', backgroundSize: '200% 100%' }}></div>
                            ))}
                        </div>
                    ) : !activityResults?.length ? (
                        <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderStyle: 'dashed' }}>
                            <Zap size={36} style={{ color: '#cbd5e1', marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>Пока никто не сдавал тесты</p>
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', opacity: 0.6 }}>Сдайте первый тест — коллеги смогут поставить реакцию</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {activityResults.map((result, index) => {
                                const pct = result.total > 0 ? Math.round(result.score / result.total * 100) : 0;
                                const isOwn = result.userId === user.id;
                                const reacted = myReactions[result.id] || new Set();
                                const counts = reactionCounts[result.id] || {};
                                const totalReactions = ['👍','🔥','🎉'].reduce((s, e) => s + (counts[e] || 0), 0);

                                const diff = (Date.now() - new Date(result.date)) / 1000;
                                const timeAgo = diff < 60 ? 'только что' : diff < 3600 ? `${Math.floor(diff/60)} мин. назад` : diff < 86400 ? `${Math.floor(diff/3600)} ч. назад` : `${Math.floor(diff/86400)} дн. назад`;

                                const aGrads = ['linear-gradient(135deg,#10b981,#06b6d4)','linear-gradient(135deg,#6366f1,#8b5cf6)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#ec4899,#f97316)','linear-gradient(135deg,#06b6d4,#6366f1)'];
                                const avatarBg = aGrads[(result.userName?.charCodeAt(0) || 0) % aGrads.length];
                                const ES = { '👍': { bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.35)' }, '🔥': { bg:'rgba(249,115,22,0.1)', border:'rgba(249,115,22,0.35)' }, '🎉': { bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.35)' } };

                                return (
                                    <div key={result.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`} style={{ padding: '0.9rem 1.1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            {/* Avatar */}
                                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: 'white', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                                                {(result.userName?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <Link to={`/profile/${result.userId}`} style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                        {result.userName}
                                                        {isOwn && <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.75rem' }}> (вы)</span>}
                                                    </Link>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>{timeAgo}</span>
                                                </div>

                                                {result.type === 'test_passed' ? (
                                                    <>
                                                        <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: 1.4 }}>
                                                            сдал тест <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>«{result.testTitle}»</span>
                                                        </div>
                                                        <div style={{ marginTop: '0.4rem' }}>
                                                            <span style={{ fontSize: '0.71rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                                ✓ {result.score}/{result.total} · {pct}%
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: 1.4 }}>
                                                            опубликовал тест <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>«{result.testTitle}»</span>
                                                        </div>
                                                        <div style={{ marginTop: '0.4rem' }}>
                                                            <span style={{ fontSize: '0.71rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                                📝 Новый тест
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom row */}
                                        <div style={{ marginTop: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                            {result.type === 'test_created' ? (
                                                // Created test: follow author + play button
                                                <>
                                                    {!isOwn && (
                                                        <button
                                                            onClick={() => handleFollowAuthor(result.userId)}
                                                            disabled={followInProgress.has(result.userId)}
                                                            style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '2rem', border: `1.5px solid ${followedAuthorIds.has(result.userId) ? 'rgba(16,185,129,0.3)' : '#e2e8f0'}`, background: followedAuthorIds.has(result.userId) ? 'rgba(16,185,129,0.07)' : 'white', color: followedAuthorIds.has(result.userId) ? 'var(--accent-primary)' : '#64748b', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                                        >
                                                            {followedAuthorIds.has(result.userId) ? '✓ Слежу' : '+ Следить'}
                                                        </button>
                                                    )}
                                                    <Link
                                                        to={`/test/${result.testId}`}
                                                        style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.85rem', borderRadius: '2rem', border: '1.5px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.07)', color: '#6366f1', textDecoration: 'none', transition: 'all 0.15s' }}
                                                    >
                                                        ▶ Пройти тест
                                                    </Link>
                                                </>
                                            ) : !isOwn ? (
                                                // Passed test: emoji reactions
                                                ['👍','🔥','🎉'].map(emoji => {
                                                    const active = reacted.has(emoji);
                                                    const count = counts[emoji] || 0;
                                                    return (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReact(result.id, emoji)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.28rem 0.65rem', borderRadius: '2rem', border: `1.5px solid ${active ? ES[emoji].border : '#e2e8f0'}`, background: active ? ES[emoji].bg : 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.15s', lineHeight: 1 }}
                                                            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = ES[emoji].bg; e.currentTarget.style.borderColor = ES[emoji].border; } }}
                                                            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
                                                        >
                                                            <span>{emoji}</span>
                                                            {count > 0 && <span style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 700 }}>{count}</span>}
                                                        </button>
                                                    );
                                                })
                                            ) : totalReactions > 0 ? (
                                                <>
                                                    {['👍','🔥','🎉'].filter(e => counts[e] > 0).map(emoji => (
                                                        <span key={emoji} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', borderRadius: '2rem', background: ES[emoji].bg, border: `1.5px solid ${ES[emoji].border}`, fontSize: '0.85rem', fontWeight: 700 }}>
                                                            {emoji} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{counts[emoji]}</span>
                                                        </span>
                                                    ))}
                                                    <span style={{ fontSize: '0.71rem', color: '#94a3b8', marginLeft: '0.15rem' }}>от коллег</span>
                                                </>
                                            ) : (
                                                <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>Коллеги ещё не оценили</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Challenges ── */}
            {activeTab === 'challenges' && (
                <ChallengesTab currentUser={user} isAdmin={user?.role === 'admin'} />
            )}

            {/* ── Collections ── */}
            {activeTab === 'collections' && (
                <CollectionsTab currentUser={user} />
            )}

            {/* ── My Tests ── */}
            {activeTab === 'mytests' && (
                <div className="flex-col gap-5 animate-fade-in">
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={18} style={{ color: 'var(--accent-primary)' }} /> Мои тесты
                            </h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                Создавайте тесты и делитесь ссылкой с кем угодно
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/employee/test/new')}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: '0.875rem' }}
                        >
                            <Plus size={15} /> Создать тест
                        </button>
                    </div>

                    {myTests.length === 0 ? (
                        <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderStyle: 'dashed' }}>
                            <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <Plus size={24} style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Нет созданных тестов</div>
                            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                Нажмите «Создать тест», составьте вопросы и поделитесь ссылкой
                            </p>
                            <button
                                onClick={() => navigate('/employee/test/new')}
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '0.875rem' }}
                            >
                                <Plus size={15} /> Создать первый тест
                            </button>
                        </div>
                    ) : (
                        <div className="bento-grid">
                            {myTests.map((test, index) => {
                                const isDraft = (test.status || 'published') === 'draft';
                                const testLink = `${window.location.origin}/test/${test.id}`;
                                const isCopied = copiedMyTestId === test.id;
                                const isConfirmDelete = deleteMyTestId === test.id;
                                return (
                                    <div key={test.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1}`} style={{ opacity: isDraft ? 0.85 : 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.35, color: 'var(--text-primary)', flex: 1 }}>{test.title}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end', flexShrink: 0 }}>
                                                {/* Status badge */}
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '2rem', fontSize: '0.68rem', fontWeight: 700, background: isDraft ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: isDraft ? '#d97706' : 'var(--accent-primary)', border: `1px solid ${isDraft ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                                    {isDraft ? <PenLine size={9}/> : <CheckCircle size={9}/>}
                                                    {isDraft ? 'Черновик' : 'Опубликован'}
                                                </span>
                                                {/* Collaborator badge */}
                                                {!test.isOwner && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.15rem 0.5rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 700, background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.18)' }}>
                                                        <Users size={9}/> {test.collaboratorRole === 'edit' ? 'Соавтор' : 'Просмотр'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                                                {test.questions?.length || 0} вопр.
                                            </span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                                                {test.timeLimit / 60} мин.
                                            </span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.08)', color: 'var(--accent-primary)' }}>
                                                Балл: {test.passingScore}
                                            </span>
                                            {test.commentCount > 0 && (
                                                <button
                                                    onClick={() => toggleComments(test.id)}
                                                    style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: openCommentTestId === test.id ? 'rgba(99,102,241,0.1)' : '#f1f5f9', color: openCommentTestId === test.id ? '#6366f1' : '#64748b', border: `1px solid ${openCommentTestId === test.id ? 'rgba(99,102,241,0.2)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                                                >
                                                    💬 {test.commentCount}
                                                </button>
                                            )}
                                            {(test.questionCount > 0 || test.unansweredQuestionCount > 0) && (
                                                <button
                                                    onClick={() => toggleQuestions(test.id)}
                                                    style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: openQuestionTestId === test.id ? 'rgba(245,158,11,0.12)' : (test.unansweredQuestionCount > 0 ? 'rgba(245,158,11,0.08)' : '#f1f5f9'), color: openQuestionTestId === test.id ? '#b45309' : (test.unansweredQuestionCount > 0 ? '#d97706' : '#64748b'), border: `1px solid ${openQuestionTestId === test.id ? 'rgba(245,158,11,0.35)' : (test.unansweredQuestionCount > 0 ? 'rgba(245,158,11,0.2)' : 'transparent')}`, cursor: 'pointer', transition: 'all 0.15s' }}
                                                >
                                                    ❓ {test.unansweredQuestionCount > 0 ? `${test.unansweredQuestionCount} новых` : test.questionCount}
                                                </button>
                                            )}
                                        </div>

                                        {/* Share link (when published) */}
                                        {!isDraft && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.65rem', borderRadius: '0.625rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: '0.875rem' }}>
                                                <Link2 size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }}/>
                                                <span style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{testLink}</span>
                                                <button
                                                    onClick={() => copyMyTestLink(test.id)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.55rem', borderRadius: '0.4rem', border: '1px solid rgba(16,185,129,0.25)', background: isCopied ? 'var(--accent-primary)' : 'white', color: isCopied ? 'white' : 'var(--accent-primary)', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                                                >
                                                    <Copy size={10}/>{isCopied ? 'Скопировано!' : 'Копировать'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Delete confirm banner */}
                                        {isConfirmDelete && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                                <span style={{ flex: 1, fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>Удалить тест? Отменить нельзя.</span>
                                                <button onClick={() => handleDeleteMyTest(test.id)} style={{ padding: '0.3rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Удалить</button>
                                                <button onClick={() => setDeleteMyTestId(null)} style={{ padding: '0.3rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>Отмена</button>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                            {/* Edit */}
                                            <button
                                                onClick={() => navigate(`/employee/test/${test.id}`)}
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                            >
                                                <Edit size={14}/> Изменить
                                            </button>

                                            {/* Publish toggle */}
                                            <button
                                                onClick={() => handleToggleMyTestStatus(test)}
                                                title={isDraft ? 'Опубликовать' : 'Снять с публикации'}
                                                style={{ width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', border: `1px solid ${isDraft ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`, background: isDraft ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)', color: isDraft ? 'var(--accent-primary)' : '#d97706', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                                                onMouseEnter={e => { e.currentTarget.style.background = isDraft ? 'var(--accent-primary)' : '#f59e0b'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = isDraft ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)'; e.currentTarget.style.color = isDraft ? 'var(--accent-primary)' : '#d97706'; e.currentTarget.style.borderColor = isDraft ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'; }}
                                            >
                                                {isDraft ? <Send size={14}/> : <PenLine size={14}/>}
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => setDeleteMyTestId(isConfirmDelete ? null : test.id)}
                                                title="Удалить тест"
                                                style={{ width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', border: `1px solid ${isConfirmDelete ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.15)'}`, background: isConfirmDelete ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = isConfirmDelete ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = isConfirmDelete ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.15)'; }}
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>

                                        {/* Comments panel */}
                                        {openCommentTestId === test.id && (
                                            <CommentsPanel
                                                testId={test.id}
                                                currentUserId={user.id}
                                                isTestAuthor={true}
                                                comments={commentsByTestId[test.id]}
                                                input={commentInputs[test.id]}
                                                onInputChange={v => setCommentInputs(prev => ({ ...prev, [test.id]: v }))}
                                                onAdd={() => handleAddComment(test.id)}
                                                onDelete={cid => handleDeleteComment(test.id, cid)}
                                                onExpand={() => setExpandedComments(prev => ({ ...prev, [test.id]: true }))}
                                                expanded={!!expandedComments[test.id]}
                                                submitting={commentSubmitting}
                                            />
                                        )}

                                        {/* Questions panel */}
                                        {openQuestionTestId === test.id && (
                                            <QuestionsPanel
                                                questions={questionsByTestId[test.id]}
                                                answerInputs={questionAnswerInputs[test.id]}
                                                onInputChange={(qId, v) => setQuestionAnswerInputs(prev => ({
                                                    ...prev,
                                                    [test.id]: { ...(prev[test.id] || {}), [qId]: v },
                                                }))}
                                                onAnswer={qId => handleAnswerQuestion(test.id, qId)}
                                                submitting={answerSubmitting}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Articles ── */}
            {activeTab === 'articles' && (
                <div className="bento-grid">
                    {articles.map((article, index) => (
                        <div key={article.id} className={`bento-card animate-fade-in stagger-${(index % 5) + 1} border-l-4 border-l-accent-primary`}>
                            <h3 className="text-lg font-bold text-primary mb-4 leading-tight">{article.title}</h3>
                            <div className="flex items-center gap-2 text-secondary px-3 py-1 bg-slate-50 w-fit rounded-lg text-[10px] font-bold uppercase tracking-wider opacity-60 mb-6">
                                <FileText size={12}/><span>Материал</span>
                            </div>
                            <div className="mt-auto">
                                <Link to={`/article/${article.id}`} className="btn btn-secondary w-full flex justify-center gap-2 font-bold py-3">
                                    <BookOpen size={18}/> Читать
                                </Link>
                            </div>
                        </div>
                    ))}
                    {articles.length === 0 && (
                        <div className="bento-card col-span-full p-8 text-center text-secondary border-dashed">Нет обучающих материалов.</div>
                    )}
                </div>
            )}

            {/* ── Results ── */}
            {activeTab === 'results' && (
                <div className="animate-fade-in">
                    <div className="scroll-hint">Листайте таблицу вправо →</div>
                    <div className="card table-container p-0 overflow-hidden">
                        <table className="w-full min-w-[500px]">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-white/30">
                                    <th className="text-center py-4 px-3 font-black uppercase tracking-[0.1em] text-secondary">Тест</th>
                                    <th className="text-center py-4 px-3 font-black uppercase tracking-[0.1em] text-secondary">Баллы</th>
                                    <th className="text-center py-4 px-3 font-black uppercase tracking-[0.1em] text-secondary">Дата</th>
                                    <th className="text-center py-4 px-3 font-black uppercase tracking-[0.1em] text-secondary">Статус</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {results.map(res => {
                                    const testName = tests.find(t => t.id === res.testId)?.title || 'Тест удалён';
                                    return (
                                        <tr key={res.id} className="hover:bg-accent-primary/5 transition-colors">
                                            <td className="py-4 px-3 font-medium text-center text-sm">{testName}</td>
                                            <td className="py-4 px-3 text-center">
                                                <span className="font-bold">{res.score}</span><span className="opacity-40"> / {res.total}</span>
                                            </td>
                                            <td className="py-4 px-3 text-[11px] text-secondary text-center">{formatDate(res.date)}</td>
                                            <td className="py-4 px-3 text-center">
                                                <span className={`badge ${res.passed ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex' }}>
                                                    {res.passed ? 'Сдано' : 'Не сдано'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {results.length === 0 && (
                                    <tr><td colSpan="4" className="py-12 text-center text-secondary font-medium italic">Вы ещё не проходили тесты.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Training Stats ── */}
            {activeTab === 'trainingStats' && (
                <div className="card animate-fade-in" style={{ padding: '1rem' }}>
                    <div className="flex-col gap-2">
                        {articles.map(article => {
                            const isCompleted = tests.find(t => t.requiredArticleId === article.id)?.articleCompleted;
                            return (
                                <div key={article.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-[var(--border-color)] gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'}`}>
                                            {isCompleted ? <CheckCircle size={16}/> : <BookOpen size={16}/>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate">{article.title}</div>
                                            <div className="text-[10px] font-bold text-secondary uppercase opacity-50">{isCompleted ? 'Изучен' : 'В процессе'}</div>
                                        </div>
                                    </div>
                                    <Link to={`/article/${article.id}`} className="btn btn-secondary py-1 px-3 text-xs shrink-0 font-bold">Открыть</Link>
                                </div>
                            );
                        })}
                        {articles.length === 0 && <div className="py-8 text-center text-secondary font-medium">Нет данных.</div>}
                    </div>
                </div>
            )}

            {/* ── Progress (NEW) ── */}
            {activeTab === 'progress' && (
                <div className="flex-col gap-6 animate-fade-in">

                    {/* ── Achievements ── */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div>
                                <h3 className="m-0 flex items-center gap-2">
                                    <Trophy size={18} className="text-accent-primary"/> Достижения
                                </h3>
                                <p className="text-xs text-secondary m-0 mt-1 opacity-70">
                                    Получено: {earnedAchievements.length} из {ACHIEVEMENTS.length}
                                </p>
                            </div>
                            {/* Progress bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: '90px', height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(earnedAchievements.length / ACHIEVEMENTS.length) * 100}%`,
                                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                                        borderRadius: '3px', transition: 'width 0.6s ease',
                                    }}/>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                    {Math.round(earnedAchievements.length / ACHIEVEMENTS.length * 100)}%
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: '0.875rem' }}>
                            {ACHIEVEMENTS.map(a => {
                                const unlocked = earnedAchievements.includes(a.id);
                                return (
                                    <div
                                        key={a.id}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            padding: '1.1rem 0.75rem 0.9rem', borderRadius: '1rem', textAlign: 'center',
                                            background: unlocked ? a.bg : '#f8fafc',
                                            border: `1.5px solid ${unlocked ? a.border : '#e8ecf0'}`,
                                            boxShadow: unlocked ? a.glow : 'none',
                                            opacity: unlocked ? 1 : 0.5,
                                            transition: 'all 0.3s',
                                        }}
                                    >
                                        {/* SVG icon or lock */}
                                        <div style={{
                                            width: 56, height: 56, borderRadius: '50%',
                                            background: unlocked ? 'white' : '#f1f5f9',
                                            border: `2px solid ${unlocked ? a.border : '#e2e8f0'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: '0.625rem', flexShrink: 0,
                                            boxShadow: unlocked ? `0 2px 8px ${a.bg}` : 'none',
                                            transition: 'all 0.3s',
                                        }}>
                                            {unlocked
                                                ? a.svg
                                                : <Lock size={18} style={{ color: '#cbd5e1' }}/>
                                            }
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '0.25rem', lineHeight: 1.25 }}>
                                            {a.title}
                                        </div>
                                        <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', lineHeight: 1.35, opacity: unlocked ? 0.75 : 0.55 }}>
                                            {a.desc}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Progress chart ── */}
                    <div className="card">
                        <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
                            <div>
                                <h3 className="m-0 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-accent-primary"/> График прогресса
                                </h3>
                                <p className="text-xs text-secondary m-0 mt-1 opacity-65">
                                    Последние {Math.min(results.length, 20)} попыток · зелёный = сдано, красный = не сдано
                                </p>
                            </div>
                            {results.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '2rem', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', fontSize: '0.75rem', fontWeight: 700, color: '#f97316' }}>
                                        <Flame size={12}/> Серия: {currentStreak}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '2rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                                        <Star size={12}/> Рекорд: {bestPct}%
                                    </div>
                                </div>
                            )}
                        </div>
                        <ProgressChart results={results}/>
                    </div>

                    {/* ── Department leaderboard ── */}
                    {user.department ? (
                        leaderboard.length > 1 ? (
                            <div className="card">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                    <div>
                                        <h3 className="m-0 flex items-center gap-2">
                                            <Users size={18} className="text-accent-primary"/> Рейтинг отдела
                                        </h3>
                                        <p className="text-xs text-secondary m-0 mt-1 opacity-70">
                                            {user.department} · {leaderboard.length} участников
                                        </p>
                                    </div>
                                    {myRank > 0 && (
                                        <div style={{ padding: '0.3rem 0.85rem', borderRadius: '2rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                            Ваше место: #{myRank}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {leaderboard.map((entry, i) => {
                                        const pos = i + 1;
                                        const isMe = entry.id === user.id;
                                        const maxPassed = leaderboard[0]?.passedCount || 1;
                                        const barWidth = maxPassed > 0 ? (entry.passedCount / maxPassed) * 100 : 0;
                                        const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null;

                                        return (
                                            <div
                                                key={entry.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                    padding: '0.75rem 1rem', borderRadius: '0.875rem',
                                                    background: isMe ? 'rgba(16,185,129,0.05)' : 'white',
                                                    border: `1.5px solid ${isMe ? 'rgba(16,185,129,0.22)' : '#f1f5f9'}`,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {/* Rank */}
                                                <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                                                    {medal
                                                        ? <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{medal}</span>
                                                        : <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>#{pos}</span>
                                                    }
                                                </div>

                                                {/* Avatar */}
                                                <div style={{
                                                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                                    background: isMe ? 'rgba(16,185,129,0.12)' : '#f1f5f9',
                                                    color: isMe ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '0.875rem',
                                                }}>
                                                    {entry.name.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Name + progress bar */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                                        <span style={{ fontWeight: isMe ? 700 : 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {entry.name}
                                                        </span>
                                                        {isMe && (
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '0.35rem', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-primary)', flexShrink: 0 }}>вы</span>
                                                        )}
                                                    </div>
                                                    <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${barWidth}%`, background: isMe ? 'var(--accent-primary)' : '#94a3b8', borderRadius: '2px', transition: 'width 0.7s ease' }}/>
                                                    </div>
                                                </div>

                                                {/* Passed count */}
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isMe ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{entry.passedCount}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.65 }}>сдано</div>
                                                </div>

                                                {/* Avg % */}
                                                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 40 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: entry.avgPct >= 80 ? 'var(--success)' : entry.avgPct >= 55 ? '#f59e0b' : 'var(--text-secondary)' }}>
                                                        {entry.totalAttempts > 0 ? `${entry.avgPct}%` : '—'}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.65 }}>средний</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="card">
                                <h3 className="m-0 mb-2 flex items-center gap-2"><Users size={18} className="text-accent-primary"/> Рейтинг отдела</h3>
                                <div className="py-6 text-center text-secondary text-sm" style={{ opacity: 0.65 }}>
                                    В вашем отделе пока только вы. Рейтинг появится, когда добавят коллег.
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="card">
                            <h3 className="m-0 mb-2 flex items-center gap-2"><Users size={18} className="text-accent-primary"/> Рейтинг отдела</h3>
                            <div className="py-6 text-center text-secondary text-sm" style={{ opacity: 0.65 }}>
                                Вы не состоите в отделе. Обратитесь к администратору, чтобы получить доступ к рейтингу.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
