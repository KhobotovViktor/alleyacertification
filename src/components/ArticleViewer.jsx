import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { getArticleById, getCurrentUser, saveArticleProgress } from '../services/db';
import { RunnerSkeleton } from './SkeletonLoader';

// Helper to convert YouTube standard links to embed links
const getEmbedUrl = (url) => {
    if (!url) return null;
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
        embedUrl = url.replace('youtube.com/watch?v=', 'youtube.com/embed/');
        // strip ampersands arguments like &t=123s
        embedUrl = embedUrl.split('&')[0];
    } else if (url.includes('youtu.be/')) {
        embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
        embedUrl = embedUrl.split('?')[0];
    }
    // VK Video support
    if (url.includes('vk.com/video')) {
        // Very basic VK conversion (requires knowing owner_id and video_id)
        // OID_VID -> oid=OID&id=VID
        const match = url.match(/video(-?\d+)_(\d+)/);
        if (match) {
            embedUrl = `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2`;
        }
    }
    return embedUrl;
};

export default function ArticleViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [article, setArticle] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [canFinish, setCanFinish] = useState(true);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadArticle = async () => {
            if (user && id) {
                setIsLoading(true);
                try {
                    const dbArticle = await getArticleById(id);
                    if (!dbArticle) {
                        navigate(user.role === 'admin' ? '/admin' : '/employee');
                        return;
                    }

                    // Check access if employee
                    if (user.role === 'employee' && dbArticle.allowedUsers && dbArticle.allowedUsers.length > 0) {
                        if (!dbArticle.allowedUsers.includes(user.id)) {
                            navigate('/employee');
                            return;
                        }
                    }

                    setArticle(dbArticle);
                    if (dbArticle.minTimeMinutes && dbArticle.minTimeMinutes > 0) {
                        setTimeLeft(dbArticle.minTimeMinutes * 60);
                        setCanFinish(false);
                    } else {
                        setCanFinish(true);
                    }
                } catch (err) {
                    console.error('Failed to load article:', err);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadArticle();
    }, [id, user?.id, navigate]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timerObj = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timerObj);
        } else if (article && article.minTimeMinutes > 0) {
            setCanFinish(true);
        }
    }, [timeLeft, article]);

    if (isLoading) {
        return <RunnerSkeleton />;
    }
    if (!article) return <div className="p-8 text-center text-secondary">Материал не найден.</div>;

    const goBack = () => {
        navigate(user?.role === 'admin' ? '/admin' : '/employee');
    };

    const handleFinish = async () => {
        if (user?.role === 'employee' && article) {
            const timeSpentSeconds = (article.minTimeMinutes || 0) * 60 - timeLeft;
            await saveArticleProgress(user.id, article.id, Math.max(timeSpentSeconds, 1)); // Save at least 1s
        }
        goBack();
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="max-w-4xl mx-auto flex-col gap-6 animate-fade-in pb-12">
            {/* Header info */}
            <div 
                className="glass-panel py-7 flex items-center justify-between sticky top-[4.5rem] z-40 bg-[rgba(255,255,255,0.85)] backdrop-blur shadow-sm mb-6 border-b-0"
                style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={goBack}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0.5rem', background: 'white', border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)',
                            transition: 'all 0.2s', flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-primary)';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                        title="Вернуться назад"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h3 className="flex items-center gap-2 text-primary m-0">
                            <BookOpen size={20} className="text-accent-primary" />
                            {article.title}
                        </h3>
                    </div>
                </div>

                {/* Timer Area */}
                {article.minTimeMinutes > 0 && user?.role === 'employee' && (
                    <div className="flex items-center gap-3">
                        {!canFinish ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 0.75rem', borderRadius: '0.75rem',
                                fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700,
                                border: '1px solid', borderColor: timeLeft < 60 ? 'rgba(239,68,68,0.3)' : '#e2e8f0',
                                background: timeLeft < 60 ? 'rgba(239,68,68,0.08)' : 'white',
                                color: timeLeft < 60 ? '#ef4444' : 'var(--text-primary)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                                <Clock size={18} style={{ color: timeLeft < 60 ? '#ef4444' : 'var(--accent-primary)' }} className={timeLeft < 60 ? 'animate-pulse' : ''} />
                                {formatTime(timeLeft)}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 0.75rem', borderRadius: '0.75rem',
                                background: 'white', border: '1px solid #e2e8f0',
                                color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                animation: 'bounce 1s infinite'
                            }}>
                                <CheckCircle size={18} /> Готово
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content Range */}
            <div className="card flex-col gap-10 shadow-2xl p-5 md:p-8 lg:p-16 bg-white min-h-[60vh] border border-white mt-2 relative z-10 rounded-3xl">

                {/* Video Embed */}
                {article.videoUrl && getEmbedUrl(article.videoUrl) && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border-4 border-[var(--bg-secondary)]">
                        <iframe
                            src={getEmbedUrl(article.videoUrl)}
                            className="absolute top-0 left-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}

                {/* Main Content (Rich Text) */}
                <div
                    className="text-primary leading-relaxed quill-content mt-6 mb-8"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Status Bar / Controls */}
                <div className="mt-12 flex flex-col items-center justify-center border-t border-[var(--border-color)] pt-8">
                    {user?.role === 'admin' ? (
                        <button className="btn btn-secondary px-8 outline" onClick={goBack}>
                            Вернуться в панель Админа
                        </button>
                    ) : (
                        <button
                            className={`btn ${canFinish ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'} px-12 py-3 transition-all shadow-md`}
                            onClick={handleFinish}
                            disabled={!canFinish}
                        >
                            Изучил материал
                        </button>
                    )}

                    {!canFinish && user?.role === 'employee' && (
                        <p className="text-secondary text-sm mt-3 animate-pulse">Кнопка станет активна через {formatTime(timeLeft)}</p>
                    )}
                </div>
            </div>

            {/* Quick styles to handle Quill's default HTML output nicely */}
            <style>{`
                .quill-content { font-size: var(--font-size-base); line-height: 1.8; color: #334155; white-space: pre-wrap; word-break: normal; overflow-wrap: break-word; word-wrap: break-word; }
                .quill-content p { margin-bottom: 1.5em; overflow-wrap: break-word; word-wrap: break-word; word-break: normal; }
                .quill-content h1 { font-size: var(--font-size-h); margin-bottom: 0.8em; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; overflow-wrap: break-word; word-break: normal; }
                .quill-content h2 { font-size: var(--font-size-h); margin-bottom: 0.8em; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; overflow-wrap: break-word; word-break: normal; }
                .quill-content h3 { font-size: var(--font-size-h); margin-bottom: 0.8em; font-weight: 600; color: #1e293b; overflow-wrap: break-word; word-break: normal; }
                .quill-content ul { list-style-type: disc; padding-left: 2em; margin-bottom: 1.5em; }
                .quill-content ol { list-style-type: decimal; padding-left: 2em; margin-bottom: 1.5em; }
                .quill-content a { color: var(--accent-primary); text-decoration: none; font-weight: 500; border-bottom: 1px solid transparent; transition: border-color 0.2s; overflow-wrap: break-word; word-wrap: break-word; word-break: normal; }
                .quill-content a:hover { border-bottom-color: var(--accent-primary); }
                .quill-content blockquote { border-left: 4px solid var(--accent-primary); padding-left: 1.5em; color: #64748b; font-style: italic; background: #f8fafc; padding: 1em 1.5em; border-radius: 0 0.5rem 0.5rem 0; margin-bottom: 1.5em; }
                .quill-content img { border-radius: 0.75rem; box-shadow: var(--shadow-md); margin-bottom: 1.5em; max-width: 100%; height: auto; display: block; }
                .quill-content iframe { max-width: 100%; border-radius: 0.75rem; }
                .quill-content table { width: 100% !important; border-collapse: collapse; margin-bottom: 1.5em; display: block; overflow-x: auto; }
                .quill-content tr { border-bottom: 1px solid var(--border-color); }
                .quill-content td, .quill-content th { padding: 0.5rem; text-align: left; }
            `}</style>
        </div>
    );
}
