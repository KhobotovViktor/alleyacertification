import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, Headphones, Play, Pause, RotateCcw, RotateCw, Volume2 } from 'lucide-react';
import { getArticleById, getCurrentUser, saveArticleProgress } from '../services/db';
import { RunnerSkeleton } from './SkeletonLoader';
import { useRef } from 'react';

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

    // Audio Player State
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Audio Logic
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const skip = (amount) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + amount));
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col pb-12 animate-fade-in relative">
            
            {/* Unified Article Container */}
            <div className="bg-white shadow-2xl border border-white/10 rounded-[2.5rem] overflow-hidden relative">
                
                {/* Integrated Header (Sticky) */}
                <div 
                    className="sticky z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-6 md:px-12 py-5 md:py-7 flex items-center justify-between transition-all"
                    style={{ top: '4.5rem' }}
                >
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            onClick={goBack}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '2.75rem', height: '2.75rem', background: 'white', border: '1px solid #e2e8f0',
                                borderRadius: '1rem', cursor: 'pointer', color: 'var(--text-secondary)',
                                transition: 'all 0.2s', flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent-primary)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.transform = 'translateX(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="min-w-0">
                            <h2 className="flex items-center gap-2.5 text-primary m-0 text-lg md:text-xl font-bold truncate">
                                <BookOpen size={22} className="text-accent-primary flex-shrink-0" />
                                <span className="truncate">{article.title}</span>
                            </h2>
                        </div>
                    </div>

                    {/* Timer / Badge Area */}
                    {article.minTimeMinutes > 0 && user?.role === 'employee' && (
                        <div className="flex-shrink-0">
                            {!canFinish ? (
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-mono text-base font-black border transition-all ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-500 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                                    <Clock size={18} className={timeLeft < 60 ? 'animate-pulse' : 'text-accent-primary'} />
                                    {formatTime(timeLeft)}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-sm border border-emerald-100 animate-bounce shadow-sm">
                                    <CheckCircle size={18} /> Готово
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Integrated Audio Player Section */}
                {article.audioUrl && (
                    <div className="bg-slate-50/50 border-b border-slate-100 px-6 md:px-12 py-12 md:py-16 flex flex-col items-center">
                        <div className="w-full max-w-2xl flex flex-col gap-8 relative">
                            {/* Player Controls */}
                            <div className="flex items-center justify-center gap-10">
                                <button onClick={() => skip(-10)} className="player-btn scale-110" title="Назад на 10 сек">
                                    <RotateCcw size={32} />
                                </button>
                                <button onClick={togglePlay} className="player-btn player-btn-play scale-125 mx-2" title={isPlaying ? 'Пауза' : 'Воспроизвести'}>
                                    {isPlaying ? <Pause size={38} fill="currentColor" /> : <Play size={38} fill="currentColor" className="ml-1" />}
                                </button>
                                <button onClick={() => skip(10)} className="player-btn scale-110" title="Вперед на 10 сек">
                                    <RotateCw size={32} />
                                </button>
                            </div>
                            
                            {/* Seek Bar */}
                            <div className="flex flex-col gap-3">
                                <input 
                                    type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek}
                                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-accent-primary"
                                    style={{ background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${(currentTime / (duration || 1)) * 100}%, #e2e8f0 ${(currentTime / (duration || 1)) * 100}%, #e2e8f0 100%)` }}
                                />
                                <div className="flex justify-between text-xs font-bold text-slate-400 font-mono">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <audio ref={audioRef} src={article.audioUrl} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={() => setIsPlaying(false)} className="hidden" />
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="px-6 md:px-16 py-12 md:py-20 flex flex-col gap-12">
                    {/* Video Embed */}
                    {article.videoUrl && getEmbedUrl(article.videoUrl) && (
                        <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-50">
                            <iframe src={getEmbedUrl(article.videoUrl)} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                        </div>
                    )}

                    {/* Rich Text Content */}
                    <div
                        className="quill-content text-lg leading-loose text-slate-700"
                        dangerouslySetInnerHTML={{ 
                            __html: article.content ? article.content.replace(/&nbsp;|\u00A0/g, ' ') : '' 
                        }}
                    />

                    {/* Finish Action */}
                    <div className="pt-12 flex flex-col items-center border-t border-slate-100">
                        {user?.role === 'admin' ? (
                            <button className="btn btn-secondary px-10 py-3 rounded-2xl" onClick={goBack}>
                                Вернуться в панель Админа
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                                <button
                                    className={`btn w-full py-4 rounded-2xl text-lg font-bold shadow-xl transition-all ${canFinish ? 'btn-primary scale-105 active:scale-95' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                                    onClick={handleFinish}
                                    disabled={!canFinish}
                                >
                                    {canFinish ? 'Изучил материал ✅' : 'Осталось дочитать...'}
                                </button>
                                {!canFinish && (
                                    <p className="text-secondary text-sm font-medium animate-pulse">Кнопка станет активна через {formatTime(timeLeft)}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Support Styles */}
            <style>{`
                .quill-content { font-family: inherit; }
                .quill-content p { margin-bottom: 2em; }
                .quill-content h1, .quill-content h2, .quill-content h3 { color: #0f172a; margin-top: 2em; margin-bottom: 1em; font-weight: 800; }
                .quill-content img { border-radius: 1.5rem; margin: 3em 0; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); }
                .quill-content ul, .quill-content ol { margin-bottom: 2em; padding-left: 1.5em; }
                .quill-content li { margin-bottom: 0.75em; }
            `}</style>
            
            <div className="h-4"></div>
        </div>
    );
}
