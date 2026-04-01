import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, Headphones, Play, Pause, RotateCcw, RotateCw, Volume2, LogOut } from 'lucide-react';
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
        <div className="max-w-[1200px] mx-auto px-4 md:px-0">
            {/* Top Navigation Bar */}
            <div className="top-nav-bar animate-fade-in">
                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-[#10b981] hidden md:block">Тестирование сотрудников «Аллея Мебели»</span>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-sm">
                            {user?.name?.charAt(0) || 'T'}
                        </div>
                        <span className="font-medium text-slate-700 hidden sm:block">{user?.name || 'Тестовый сотрудник'}</span>
                    </div>
                    
                    <button 
                        onClick={goBack}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-sm font-bold"
                    >
                        <LogOut size={16} className="rotate-180" />
                        Выйти
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="card flex-col gap-8 shadow-2xl p-6 md:p-12 bg-white min-h-[80vh] border border-white mt-4 relative z-10 rounded-[2.5rem] animate-fade-in overflow-hidden">
                
                {/* Article Header with Back Button & Title & Timer */}
                <div className="flex items-start justify-between gap-6 mb-4">
                    <div className="flex items-start gap-6">
                        <button
                            onClick={goBack}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm flex-shrink-0 mt-1"
                            title="Назад"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        
                        <div className="flex items-center gap-4">
                            <BookOpen size={48} className="text-slate-800" strokeWidth={1.5} />
                            <h1 className="text-5xl font-extrabold text-slate-900 m-0 tracking-tight">
                                {article.title}
                            </h1>
                        </div>
                    </div>

                    {/* Timer Badge (Top Right) */}
                    {article.minTimeMinutes > 0 && user?.role === 'employee' && (
                        <div className="timer-badge">
                            <Clock size={22} className="text-[#10b981]" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </div>

                {/* Video Embed */}
                {article.videoUrl && getEmbedUrl(article.videoUrl) && (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl border-8 border-slate-50">
                        <iframe
                            src={getEmbedUrl(article.videoUrl)}
                            className="absolute top-0 left-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}

                {/* Audio Player Component */}
                {article.audioUrl && (
                    <div className="w-full max-w-4xl mx-auto my-6 bento-card p-10 border-slate-100 bg-slate-50/30">
                        <div className="flex flex-col gap-10">
                            {/* Controls */}
                            <div className="flex items-center justify-center gap-10">
                                <button 
                                    onClick={() => skip(-10)}
                                    className="player-btn"
                                    title="Назад на 10 сек"
                                >
                                    <RotateCcw size={28} />
                                </button>
                                
                                <button 
                                    onClick={togglePlay}
                                    className="player-btn player-btn-play"
                                    title={isPlaying ? 'Пауза' : 'Воспроизвести'}
                                >
                                    {isPlaying ? (
                                        <Pause size={32} fill="currentColor" />
                                    ) : (
                                        <Play size={32} fill="currentColor" className="ml-1" />
                                    )}
                                </button>
                                
                                <button 
                                    onClick={() => skip(10)}
                                    className="player-btn"
                                    title="Вперед на 10 сек"
                                >
                                    <RotateCw size={28} />
                                </button>
                            </div>

                            {/* Timeline */}
                            <div className="flex flex-col gap-3">
                                <input 
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#10b981]"
                                    style={{
                                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentTime / (duration || 1)) * 100}%, #e2e8f0 ${(currentTime / (duration || 1)) * 100}%, #e2e8f0 100%)`
                                    }}
                                />
                                <div className="flex justify-between text-sm font-bold text-slate-400">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <audio 
                            ref={audioRef}
                            src={article.audioUrl}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Main Content (Rich Text) */}
                <div
                    className="text-primary leading-relaxed quill-content mt-10 mb-8 max-w-4xl"
                    dangerouslySetInnerHTML={{ 
                        __html: article.content ? article.content.replace(/&nbsp;|\u00A0/g, ' ') : '' 
                    }}
                />

                {/* Bottom Status Bar */}
                <div className="mt-auto pt-10 border-t border-slate-100 flex flex-col items-center">
                    {user?.role === 'admin' ? (
                        <button className="btn btn-secondary px-10 py-3 rounded-2xl" onClick={goBack}>
                            Вернуться в панель Админа
                        </button>
                    ) : (
                        <button
                            className={`btn ${canFinish ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'} px-16 py-4 rounded-2xl transition-all shadow-lg text-lg font-bold`}
                            onClick={handleFinish}
                            disabled={!canFinish}
                        >
                            Изучил материал
                        </button>
                    )}

                    {!canFinish && user?.role === 'employee' && (
                        <p className="text-slate-400 text-sm mt-4 font-medium animate-pulse">Кнопка станет активна через {formatTime(timeLeft)}</p>
                    )}
                </div>
            </div>

            {/* Quick styles to handle Quill's default HTML output nicely */}
            <style>{`
                .quill-content { font-size: var(--font-size-base); line-height: 1.8; color: #334155; white-space: pre-wrap; word-break: normal; overflow-wrap: break-word; hyphens: none; }
                .quill-content * { word-break: normal !important; overflow-wrap: break-word !important; hyphens: none !important; }
                .quill-content p { margin-bottom: 1.5em; }
                .quill-content h1 { font-size: var(--font-size-h); margin-bottom: 0.8em; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
                .quill-content h2 { font-size: var(--font-size-h); margin-bottom: 0.8em; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
                .quill-content h3 { font-size: var(--font-size-h); margin-bottom: 0.8em; font-weight: 600; color: #1e293b; }
                .quill-content ul { list-style-type: disc; padding-left: 2em; margin-bottom: 1.5em; }
                .quill-content ol { list-style-type: decimal; padding-left: 2em; margin-bottom: 1.5em; }
                .quill-content a { color: var(--accent-primary); text-decoration: none; font-weight: 500; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
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
