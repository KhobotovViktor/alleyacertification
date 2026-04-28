import { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, Trash2, Users, Target, Clock, CheckCircle, X } from 'lucide-react';
import { getChallenges, createChallenge, deleteChallenge, joinChallenge, leaveChallenge } from '../services/db';

const MEDALS = ['🥇', '🥈', '🥉'];
const GOAL_LABELS = {
    tests_count: 'Пройди N тестов',
    avg_score:   'Средний балл N%',
};

const fmtDeadline = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const timeLeft = (iso) => {
    const diff = new Date(iso) - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    if (days > 0) return `${days} дн. ${hours} ч.`;
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    if (hours > 0) return `${hours} ч. ${mins} мин.`;
    return `${mins} мин.`;
};

// ── Create-challenge form ────────────────────────────────────────────────────
const CreateForm = ({ onSubmit, onCancel, submitting }) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        goalType: 'tests_count',
        goalValue: 3,
        deadline: '',
    });

    // Default deadline = 7 days from now
    useEffect(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setSeconds(0, 0);
        setForm(p => ({ ...p, deadline: d.toISOString().slice(0, 16) }));
    }, []);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const valid = form.title.trim() && form.goalValue > 0 && form.deadline;

    return (
        <div className="bento-card animate-fade-in" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} style={{ color: 'var(--accent-primary)' }} /> Новый челлендж
                </h4>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
                    <X size={18} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Title */}
                <div>
                    <label className="form-label-sm">Название *</label>
                    <input
                        value={form.title}
                        onChange={e => set('title', e.target.value)}
                        placeholder="Напр.: Пройди 5 тестов за неделю"
                        maxLength={200}
                        className="form-control-sm"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="form-label-sm">Описание</label>
                    <textarea
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="Дополнительные условия или призы..."
                        maxLength={500}
                        rows={2}
                        className="form-control-sm"
                        style={{ resize: 'vertical' }}
                    />
                </div>

                {/* Goal type + value */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
                    <div>
                        <label className="form-label-sm">Цель *</label>
                        <select
                            value={form.goalType}
                            onChange={e => set('goalType', e.target.value)}
                            className="form-control-sm"
                        >
                            <option value="tests_count">Количество сданных тестов</option>
                            <option value="avg_score">Средний балл (%)</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label-sm">{form.goalType === 'tests_count' ? 'Тестов' : 'Балл %'}</label>
                        <input
                            type="number"
                            min={1}
                            max={form.goalType === 'avg_score' ? 100 : 999}
                            value={form.goalValue}
                            onChange={e => set('goalValue', Math.max(1, parseInt(e.target.value) || 1))}
                            className="form-control-sm"
                            style={{ width: '5rem', textAlign: 'center' }}
                        />
                    </div>
                </div>

                {/* Deadline */}
                <div>
                    <label className="form-label-sm">Дедлайн *</label>
                    <input
                        type="datetime-local"
                        value={form.deadline}
                        onChange={e => set('deadline', e.target.value)}
                        className="form-control-sm"
                        style={{ width: 'auto' }}
                    />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                    <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>
                        Отмена
                    </button>
                    <button
                        onClick={() => valid && onSubmit(form)}
                        disabled={!valid || submitting}
                        className="btn btn-primary"
                        style={{ flex: 1, gap: '0.4rem', opacity: valid ? 1 : 0.5 }}
                    >
                        <Trophy size={15} />
                        {submitting ? 'Создание...' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Challenge card ───────────────────────────────────────────────────────────
const ChallengeCard = ({ challenge, currentUser, isAdmin, onJoin, onLeave, onDelete, joining }) => {
    const { title, description, goalType, goalValue, deadline, createdByName,
            participants, isJoined, isExpired, myProgress } = challenge;

    const pct = Math.min(100, Math.round((myProgress / goalValue) * 100));
    const achieved = myProgress >= goalValue;
    const tl = timeLeft(deadline);
    const canDelete = isAdmin || currentUser?.id === challenge.createdBy;

    const goalDesc = goalType === 'tests_count'
        ? `Сдать ${goalValue} тест${goalValue === 1 ? '' : goalValue < 5 ? 'а' : 'ов'}`
        : `Набрать средний балл ${goalValue}%`;

    return (
        <div className="bento-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, lineHeight: 1.25, color: 'var(--text-primary)' }}>{title}</span>
                        {isExpired && <span className="status-pill status-pill-danger">Завершён</span>}
                        {achieved && !isExpired && <span className="status-pill status-pill-published">✓ Выполнено</span>}
                    </div>
                    {description && (
                        <p style={{ margin: '0.2rem 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {description}
                        </p>
                    )}
                </div>
                {canDelete && (
                    <button
                        onClick={() => onDelete(challenge.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '0.2rem', flexShrink: 0, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                        title="Удалить челлендж"
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>

            {/* Goal + deadline meta */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className="chip chip-purple"><Target size={11} />{goalDesc}</span>
                <span className="chip chip-neutral"><Clock size={11} />{tl ? `Осталось: ${tl}` : fmtDeadline(deadline)}</span>
                <span className="chip chip-neutral"><Users size={11} />{participants.length} участн.</span>
            </div>

            {/* Progress bar (only for joined) */}
            {isJoined && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Мой прогресс</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: achieved ? 'var(--accent-primary)' : '#6366f1' }}>
                            {goalType === 'tests_count' ? `${myProgress} / ${goalValue}` : `${myProgress}% / ${goalValue}%`}
                        </span>
                    </div>
                    <div className="progress-bg" style={{ height: '0.4rem' }}>
                        <div className="progress-fill" style={{
                            width: `${pct}%`,
                            background: achieved
                                ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        }} />
                    </div>
                </div>
            )}

            {/* Leaderboard */}
            {participants.length > 0 && (
                <div>
                    <div style={{ fontSize: 'var(--font-size-2xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>
                        Таблица участников
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {participants.slice(0, 5).map((p, idx) => {
                            const isMe = p.userId === currentUser?.id;
                            const pPct = Math.min(100, Math.round((p.progress / goalValue) * 100));
                            const pAchieved = p.progress >= goalValue;
                            return (
                                <div key={p.userId} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
                                    background: isMe ? 'rgba(99,102,241,0.06)' : 'transparent',
                                    border: `1px solid ${isMe ? 'rgba(99,102,241,0.15)' : 'transparent'}`,
                                }}>
                                    <span style={{ fontSize: '0.9rem', width: '1.5rem', textAlign: 'center', flexShrink: 0 }}>
                                        {idx < 3 ? MEDALS[idx] : `${idx + 1}.`}
                                    </span>
                                    <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', fontWeight: isMe ? 800 : 600, color: 'var(--text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.userName}{isMe && ' (вы)'}
                                    </span>
                                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: pAchieved ? 'var(--accent-primary)' : '#6366f1', flexShrink: 0 }}>
                                        {goalType === 'tests_count' ? p.progress : `${p.progress}%`}
                                        {pAchieved && ' ✓'}
                                    </span>
                                    <div style={{ width: '3rem', height: '0.3rem', borderRadius: 'var(--radius-full)', background: '#f1f5f9', flexShrink: 0, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 'var(--radius-full)', width: `${pPct}%`, background: pAchieved ? '#10b981' : '#6366f1' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {participants.length > 5 && (
                            <div style={{ fontSize: 'var(--font-size-2xs)', color: '#94a3b8', textAlign: 'center', paddingTop: '0.15rem' }}>
                                и ещё {participants.length - 5} участников
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Join/Leave */}
            {!isExpired && currentUser && (
                <div style={{ marginTop: 'auto', paddingTop: '0.1rem' }}>
                    {isJoined ? (
                        <button
                            onClick={() => onLeave(challenge.id)}
                            disabled={joining === challenge.id}
                            className="btn btn-danger w-full"
                            style={{ padding: '0.55rem' }}
                        >
                            {joining === challenge.id ? '...' : 'Покинуть'}
                        </button>
                    ) : (
                        <button
                            onClick={() => onJoin(challenge.id)}
                            disabled={joining === challenge.id}
                            className="btn btn-primary w-full"
                            style={{ gap: '0.4rem', padding: '0.55rem' }}
                        >
                            <CheckCircle size={14} />
                            {joining === challenge.id ? '...' : 'Участвовать'}
                        </button>
                    )}
                </div>
            )}

            <div style={{ fontSize: 'var(--font-size-2xs)', color: '#94a3b8', textAlign: 'right', marginTop: '-0.25rem' }}>
                Создал: {createdByName}
            </div>
        </div>
    );
};

// ── Main export ──────────────────────────────────────────────────────────────
export default function ChallengesTab({ currentUser, isAdmin }) {
    const [challenges, setChallenges] = useState(null); // null = not loaded
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(null); // challengeId being joined/left
    const [filter, setFilter] = useState('active'); // 'active' | 'all'

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getChallenges(currentUser?.id || null);
            setChallenges(data);
        } catch (err) {
            console.error('Failed to load challenges:', err);
            setChallenges([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (form) => {
        setCreating(true);
        try {
            await createChallenge({
                ...form,
                goalValue: Number(form.goalValue),
                deadline: new Date(form.deadline).toISOString(),
                createdBy: currentUser.id,
                createdByName: currentUser.name,
            });
            setShowCreate(false);
            await load();
        } catch (err) {
            alert('Ошибка при создании: ' + (err.message || err));
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить этот челлендж?')) return;
        try {
            await deleteChallenge(id);
            setChallenges(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('Ошибка при удалении');
        }
    };

    const handleJoin = async (challengeId) => {
        if (!currentUser) return;
        setJoining(challengeId);
        try {
            await joinChallenge(challengeId, currentUser.id, currentUser.name);
            setChallenges(prev => prev.map(c => c.id !== challengeId ? c : {
                ...c,
                isJoined: true,
                participants: [...c.participants, { userId: currentUser.id, userName: currentUser.name, progress: 0 }],
            }));
        } catch (err) {
            alert('Ошибка при вступлении');
        } finally {
            setJoining(null);
        }
    };

    const handleLeave = async (challengeId) => {
        if (!currentUser) return;
        setJoining(challengeId);
        try {
            await leaveChallenge(challengeId, currentUser.id);
            setChallenges(prev => prev.map(c => c.id !== challengeId ? c : {
                ...c,
                isJoined: false,
                participants: c.participants.filter(p => p.userId !== currentUser.id),
            }));
        } catch (err) {
            alert('Ошибка при выходе');
        } finally {
            setJoining(null);
        }
    };

    const displayed = (challenges || []).filter(c => filter === 'all' || !c.isExpired);

    return (
        <div className="flex-col gap-5 animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={18} style={{ color: '#f59e0b' }} /> Челленджи
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                        Соревнуйтесь с коллегами — выполняйте задания и занимайте место в таблице
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Filter toggle */}
                    <div style={{ display: 'inline-flex', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {['active', 'all'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{ padding: '0.35rem 0.85rem', border: 'none', background: filter === f ? 'var(--accent-primary)' : 'white', color: filter === f ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                            >
                                {f === 'active' ? 'Активные' : 'Все'}
                            </button>
                        ))}
                    </div>
                    {currentUser && (
                        <button
                            onClick={() => setShowCreate(s => !s)}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '0.875rem', fontSize: '0.84rem' }}
                        >
                            <Plus size={15} /> Создать
                        </button>
                    )}
                </div>
            </div>

            {/* Create form */}
            {showCreate && (
                <CreateForm
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreate(false)}
                    submitting={creating}
                />
            )}

            {/* List */}
            {loading ? (
                <div className="bento-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bento-card animate-pulse" style={{ height: 260, background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)' }} />
                    ))}
                </div>
            ) : displayed.length === 0 ? (
                <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderStyle: 'dashed' }}>
                    <Trophy size={36} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 0.75rem' }} />
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {filter === 'active' ? 'Нет активных челленджей' : 'Челленджей пока нет'}
                    </p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                        Создайте первый вызов для коллег!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '0.75rem' }}>
                    {displayed.map(challenge => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            currentUser={currentUser}
                            isAdmin={isAdmin}
                            onJoin={handleJoin}
                            onLeave={handleLeave}
                            onDelete={handleDelete}
                            joining={joining}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
