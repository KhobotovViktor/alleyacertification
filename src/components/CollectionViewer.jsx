import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookMarked, Play, ArrowLeft, Link2, Check, Trash2, Clock, Target } from 'lucide-react';
import { getCollection, removeTestFromCollection, getCurrentUser } from '../services/db';

export default function CollectionViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [removing, setRemoving] = useState(null);

    useEffect(() => {
        setLoading(true);
        getCollection(id)
            .then(data => {
                if (!data) navigate('/');
                else setCollection(data);
            })
            .catch(() => navigate('/'))
            .finally(() => setLoading(false));
    }, [id]);

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleRemoveTest = async (testId) => {
        if (!isOwner) return;
        setRemoving(testId);
        try {
            await removeTestFromCollection(id, testId);
            setCollection(prev => ({ ...prev, tests: prev.tests.filter(t => t.id !== testId) }));
        } catch (err) {
            alert('Ошибка при удалении');
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-4 flex-col gap-6">
                {[160, 80, 200].map((h, i) => (
                    <div key={i} className="bento-card animate-pulse" style={{ height: h, background: 'linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)' }}/>
                ))}
            </div>
        );
    }

    if (!collection) return null;

    const isOwner = currentUser?.id === collection.createdBy;
    const tests = collection.tests || [];
    const GRADS = [
        'linear-gradient(135deg,#10b981,#06b6d4)',
        'linear-gradient(135deg,#6366f1,#8b5cf6)',
        'linear-gradient(135deg,#f59e0b,#ef4444)',
        'linear-gradient(135deg,#ec4899,#f97316)',
        'linear-gradient(135deg,#06b6d4,#6366f1)',
    ];

    return (
        <div className="max-w-3xl mx-auto p-4 flex-col gap-6 animate-fade-in">
            {/* Back */}
            {currentUser && (
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content', padding: '0.45rem 0.9rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white', color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                    <ArrowLeft size={15}/> Назад
                </button>
            )}

            {/* Header card */}
            <div className="bento-card" style={{ padding: '1.5rem 1.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '1rem', background: GRADS[(collection.title?.charCodeAt(0) || 0) % GRADS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                        <BookMarked size={26} style={{ color: 'white' }}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', lineHeight: 1.2 }}>{collection.title}</h2>
                        {collection.description && (
                            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                                {collection.description}
                            </p>
                        )}
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', opacity: 0.65 }}>
                            Автор: <span style={{ fontWeight: 600 }}>{collection.createdByName}</span>
                            {' · '}{tests.length} тест{tests.length === 1 ? '' : tests.length < 5 ? 'а' : 'ов'}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={copyLink}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.95rem', borderRadius: '0.75rem', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : '#e2e8f0'}`, background: copied ? 'rgba(16,185,129,0.07)' : 'white', color: copied ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                            >
                                {copied ? <Check size={14}/> : <Link2 size={14}/>}
                                {copied ? 'Ссылка скопирована!' : 'Поделиться коллекцией'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tests list */}
            {tests.length === 0 ? (
                <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderStyle: 'dashed' }}>
                    <BookMarked size={36} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 0.75rem' }}/>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>Коллекция пуста</p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                        Добавляйте тесты из ленты через кнопку 🔖
                    </p>
                </div>
            ) : (
                <div>
                    <h3 style={{ margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                        <Play size={16} style={{ color: 'var(--accent-primary)' }}/> Тесты в коллекции
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
                        {tests.map((test, i) => (
                            <div key={test.id} className="bento-card animate-fade-in" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                {/* Position badge + title */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: GRADS[i % GRADS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', color: 'white', flexShrink: 0 }}>
                                        {i + 1}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3, flex: 1 }}>{test.title}</div>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleRemoveTest(test.id)}
                                            disabled={removing === test.id}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '0.15rem', flexShrink: 0, transition: 'color 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                                            title="Убрать из коллекции"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    )}
                                </div>

                                {/* Meta chips */}
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={10}/>{Math.round(test.timeLimit / 60)} мин.
                                    </span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                                        {test.questions?.length || 0} вопр.
                                    </span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.08)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Target size={10}/>Балл: {test.passingScore}
                                    </span>
                                </div>

                                <Link
                                    to={`/test/${test.id}`}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '0.75rem', padding: '0.55rem', fontSize: '0.85rem', textDecoration: 'none', marginTop: 'auto' }}
                                >
                                    <Play size={13}/> Пройти тест
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
