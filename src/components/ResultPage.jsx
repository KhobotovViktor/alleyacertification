import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * Public read-only result page. No auth required.
 * Query params:
 *   t  – test title
 *   s  – score (number)
 *   n  – total questions (number)
 *   p  – passed (1 / 0)
 *   u  – user display name
 *   d  – ISO date string
 *   id – test id (optional, for "Take test" CTA when test is public)
 */
export default function ResultPage() {
    const [params] = useSearchParams();

    const title  = params.get('t') || 'Тест';
    const score  = parseInt(params.get('s') ?? '0', 10);
    const total  = parseInt(params.get('n') ?? '0', 10);
    const passed = params.get('p') === '1';
    const user   = params.get('u') || '';
    const date   = params.get('d') ? new Date(params.get('d')).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const testId = params.get('id') || '';

    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <div className="card w-full animate-fade-in flex-col gap-0" style={{ maxWidth: '480px', padding: 0, overflow: 'hidden' }}>

                {/* Coloured top banner */}
                <div style={{
                    padding: '2rem 2rem 1.5rem',
                    background: passed
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)'
                        : 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.03) 100%)',
                    borderBottom: `1px solid ${passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'}`,
                    textAlign: 'center',
                }}>
                    {passed
                        ? <CheckCircle size={52} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
                        : <AlertCircle size={52} style={{ color: 'var(--danger)',  margin: '0 auto 1rem' }} />
                    }
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: passed ? 'var(--success)' : 'var(--danger)', marginBottom: '0.35rem' }}>
                        {passed ? 'Тест сдан' : 'Тест не сдан'}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.35 }}>{title}</h2>
                    {user && <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user}</div>}
                    {date && <div style={{ marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{date}</div>}
                </div>

                {/* Score block */}
                <div style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '1.25rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: passed ? 'var(--success)' : 'var(--danger)' }}>
                                {score}<span style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/{total}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', marginTop: '0.3rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Правильных</div>
                        </div>
                        <div style={{ width: '1px', height: '3rem', background: 'var(--border-color)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: passed ? 'var(--success)' : 'var(--danger)' }}>
                                {percent}<span style={{ fontSize: '1.25rem', fontWeight: 500 }}>%</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', marginTop: '0.3rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Результат</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                        <div style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: passed ? 'var(--success)' : 'var(--danger)',
                            borderRadius: '4px',
                            transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                        }} />
                    </div>

                    {/* CTA */}
                    {testId ? (
                        <Link
                            to={`/test/${testId}`}
                            className="btn btn-primary w-full"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            Пройти тест <ArrowRight size={16} />
                        </Link>
                    ) : (
                        <Link
                            to="/"
                            className="btn btn-secondary w-full"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            На главную
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
