import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookMarked, Plus, Trash2, Play, X, Check, Link2, ExternalLink } from 'lucide-react';
import {
    getMyCollections, createCollection, deleteCollection,
    addTestToCollection, removeTestFromCollection,
} from '../services/db';

// ── Create-collection form ────────────────────────────────────────────────────
const CreateForm = ({ onSubmit, onCancel, submitting }) => {
    const [form, setForm] = useState({ title: '', description: '' });
    const valid = form.title.trim();
    return (
        <div className="bento-card animate-fade-in" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                    <Plus size={15} style={{ color: 'var(--accent-primary)' }}/> Новая коллекция
                </h4>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={17}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Название коллекции *"
                    maxLength={200}
                    style={{ width: '100%', borderRadius: '0.625rem', border: '1px solid #e2e8f0', padding: '0.55rem 0.75rem', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onKeyDown={e => e.key === 'Enter' && valid && onSubmit(form)}
                    autoFocus
                />
                <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Описание (необязательно)"
                    maxLength={500}
                    rows={2}
                    style={{ width: '100%', borderRadius: '0.625rem', border: '1px solid #e2e8f0', padding: '0.55rem 0.75rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1, borderRadius: '0.75rem' }}>Отмена</button>
                    <button
                        onClick={() => valid && onSubmit(form)}
                        disabled={!valid || submitting}
                        className="btn btn-primary"
                        style={{ flex: 1, borderRadius: '0.75rem', opacity: valid ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                        <BookMarked size={14}/>{submitting ? 'Создание...' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Add-to-collection dropdown (used from feed) ────────────────────────────
export const AddToCollectionDropdown = ({ testId, collections, onAdded }) => {
    const [open, setOpen] = useState(false);
    const [adding, setAdding] = useState(null);
    const [done, setDone] = useState(new Set());
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handle = async (collId) => {
        if (done.has(collId)) return;
        setAdding(collId);
        try {
            await addTestToCollection(collId, testId);
            setDone(prev => new Set([...prev, collId]));
            onAdded && onAdded(collId);
        } catch (err) {
            // ignore duplicate
        } finally {
            setAdding(null);
            setTimeout(() => setOpen(false), 600);
        }
    };

    if (!collections?.length) return null;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(o => !o)}
                title="Добавить в коллекцию"
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '2.1rem', height: '2.1rem', borderRadius: '0.625rem',
                    border: `1.5px solid ${open ? 'rgba(99,102,241,0.35)' : '#e2e8f0'}`,
                    background: open ? 'rgba(99,102,241,0.07)' : 'white',
                    color: open ? '#6366f1' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = '#6366f1'; }}}
                onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
                <BookMarked size={13}/>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, zIndex: 200,
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.875rem',
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.1)', minWidth: '190px', padding: '0.375rem',
                    animation: 'fadeIn 0.12s',
                }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', padding: '0.25rem 0.6rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Добавить в коллекцию
                    </div>
                    {collections.map(c => (
                        <button
                            key={c.id}
                            onClick={() => handle(c.id)}
                            disabled={adding === c.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                                padding: '0.45rem 0.625rem', borderRadius: '0.625rem', border: 'none',
                                background: done.has(c.id) ? 'rgba(16,185,129,0.06)' : 'transparent',
                                color: done.has(c.id) ? 'var(--accent-primary)' : 'var(--text-primary)',
                                cursor: done.has(c.id) ? 'default' : 'pointer',
                                fontSize: '0.82rem', fontWeight: 600, textAlign: 'left',
                                transition: 'background 0.15s', fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => { if (!done.has(c.id)) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (!done.has(c.id)) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {done.has(c.id) ? <Check size={13} style={{ flexShrink: 0 }}/> : <BookMarked size={13} style={{ flexShrink: 0 }}/>}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main component ───────────────────────────────────────────────────────────
export default function CollectionsTab({ currentUser }) {
    const [collections, setCollections] = useState(null); // null = not loaded
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [copied, setCopied] = useState(null);

    const load = useCallback(async () => {
        if (!currentUser?.id) return;
        setLoading(true);
        try {
            const data = await getMyCollections(currentUser.id);
            setCollections(data);
        } catch (err) {
            console.error('Collections load error:', err);
            setCollections([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (form) => {
        setCreating(true);
        try {
            const created = await createCollection({
                title: form.title,
                description: form.description,
                createdBy: currentUser.id,
                createdByName: currentUser.name,
            });
            setShowCreate(false);
            setCollections(prev => [{ ...created, testCount: 0 }, ...(prev || [])]);
        } catch (err) {
            alert('Ошибка при создании: ' + err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить коллекцию?')) return;
        try {
            await deleteCollection(id);
            setCollections(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('Ошибка при удалении');
        }
    };

    const copyLink = (id) => {
        navigator.clipboard.writeText(`${window.location.origin}/collection/${id}`).then(() => {
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    return (
        <div className="flex-col gap-5 animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookMarked size={18} style={{ color: 'var(--accent-primary)' }}/> Мои коллекции
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                        Собирайте подборки тестов и делитесь ссылкой с командой
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(s => !s)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '0.875rem', fontSize: '0.84rem' }}
                >
                    <Plus size={15}/> Создать коллекцию
                </button>
            </div>

            {showCreate && (
                <CreateForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitting={creating}/>
            )}

            {loading ? (
                <div className="bento-grid">
                    {[1,2,3].map(i => (
                        <div key={i} className="bento-card animate-pulse" style={{ height: 120, background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)' }}/>
                    ))}
                </div>
            ) : !collections?.length ? (
                <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderStyle: 'dashed' }}>
                    <BookMarked size={36} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 0.75rem' }}/>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>Коллекций пока нет</p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                        Создайте первую подборку и добавляйте тесты прямо из ленты
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {collections.map(c => (
                        <div key={c.id} className="bento-card" style={{ padding: '0.9rem 1.1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                                    {c.description && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '2rem', background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)', flexShrink: 0 }}>
                                    {c.testCount} тест{c.testCount === 1 ? '' : c.testCount < 5 ? 'а' : 'ов'}
                                </span>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                    {/* Share link */}
                                    <button
                                        onClick={() => copyLink(c.id)}
                                        title="Скопировать ссылку"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.7rem', borderRadius: '0.625rem', border: `1px solid ${copied === c.id ? 'rgba(16,185,129,0.3)' : '#e2e8f0'}`, background: copied === c.id ? 'rgba(16,185,129,0.07)' : 'white', color: copied === c.id ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                                    >
                                        {copied === c.id ? <Check size={13}/> : <Link2 size={13}/>}
                                        <span className="mobile-hide">{copied === c.id ? 'Скопировано' : 'Ссылка'}</span>
                                    </button>
                                    {/* Open */}
                                    <Link
                                        to={`/collection/${c.id}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.7rem', borderRadius: '0.625rem', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.06)', color: '#6366f1', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}
                                    >
                                        <ExternalLink size={13}/><span className="mobile-hide">Открыть</span>
                                    </Link>
                                    {/* Expand/collapse */}
                                    <button
                                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                                        style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 0.55rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', background: 'white', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                                        title={expandedId === c.id ? 'Свернуть' : 'Показать тесты'}
                                    >
                                        <span style={{ fontSize: '0.8rem', transform: expandedId === c.id ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
                                    </button>
                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        title="Удалить коллекцию"
                                        style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 0.55rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', background: 'white', color: '#cbd5e1', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </div>

                            {/* Expanded test list */}
                            {expandedId === c.id && (
                                <CollectionTestList
                                    collectionId={c.id}
                                    onCountChange={delta => setCollections(prev => prev.map(cc => cc.id === c.id ? { ...cc, testCount: cc.testCount + delta } : cc))}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Expanded test list inside a collection ────────────────────────────────
import { getCollection } from '../services/db';

function CollectionTestList({ collectionId, onCountChange }) {
    const [tests, setTests] = useState(null);
    const [removing, setRemoving] = useState(null);

    useEffect(() => {
        getCollection(collectionId).then(coll => setTests(coll?.tests || [])).catch(() => setTests([]));
    }, [collectionId]);

    const handleRemove = async (testId) => {
        setRemoving(testId);
        try {
            await removeTestFromCollection(collectionId, testId);
            setTests(prev => prev.filter(t => t.id !== testId));
            onCountChange(-1);
        } catch (err) {
            alert('Ошибка при удалении');
        } finally {
            setRemoving(null);
        }
    };

    if (tests === null) {
        return <div style={{ padding: '0.75rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Загрузка...</div>;
    }
    if (tests.length === 0) {
        return (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.625rem', background: '#f8fafc', border: '1px dashed #e2e8f0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                Коллекция пуста — добавляйте тесты из ленты (кнопка 🔖)
            </div>
        );
    }
    return (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {tests.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '0.6rem', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <span style={{ width: '1.5rem', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ flex: 1, fontSize: '0.83rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>{Math.round(t.timeLimit / 60)} мин</span>
                    <Link
                        to={`/test/${t.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.06)', color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
                    >
                        <Play size={11}/> Пройти
                    </Link>
                    <button
                        onClick={() => handleRemove(t.id)}
                        disabled={removing === t.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '0.2rem', flexShrink: 0, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                        title="Убрать из коллекции"
                    >
                        <X size={14}/>
                    </button>
                </div>
            ))}
        </div>
    );
}
