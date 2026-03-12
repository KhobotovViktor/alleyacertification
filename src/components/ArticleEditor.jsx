import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, FileText, Users, Clock, Video } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { getArticleById, saveArticle, getAllEmployees } from '../services/db';

export default function ArticleEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [employees, setEmployees] = useState([]);
    const [article, setArticle] = useState({
        id: isNew ? '' : id,
        title: '',
        content: '',
        videoUrl: '', // New field for video
        minTimeMinutes: 5, // New field for timer
        allowedUsers: [] // Empty means everyone
    });
    const [activeTab, setActiveTab] = useState('content');

    useEffect(() => {
        setEmployees(getAllEmployees() || []);
        if (!isNew && id) {
            const existing = getArticleById(id);
            if (existing) {
                setArticle(existing);
            } else {
                navigate('/admin');
            }
        }
    }, [id, isNew, navigate]);

    const handleSave = () => {
        if (!article.title.trim() || !article.content.trim()) {
            alert('Пожалуйста, заполните название и содержимое материала.');
            return;
        }

        saveArticle({
            ...article,
            id: isNew ? Date.now().toString() : article.id
        });
        navigate('/admin');
    };

    const toggleUserAccess = (userId) => {
        setArticle(prev => {
            const isAllowed = prev.allowedUsers.includes(userId);
            if (isAllowed) {
                return { ...prev, allowedUsers: prev.allowedUsers.filter(id => id !== userId) };
            } else {
                return { ...prev, allowedUsers: [...prev.allowedUsers, userId] };
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto flex-col gap-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{isNew ? 'Создание учебного материала' : 'Редактирование материала'}</h2>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Напишите статью, инструкцию или регламент</p>
                    </div>
                </div>
                <button onClick={handleSave} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Save size={16} /> Сохранить
                </button>
            </div>

            {/* Editor Tabs */}
            <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {[
                        { key: 'content', icon: <FileText size={16} />, label: 'Содержимое' },
                        { key: 'access', icon: <Users size={16} />, label: 'Доступ' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1.25rem', borderRadius: '0.75rem',
                                border: 'none', fontSize: '0.8125rem', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s',
                                background: activeTab === tab.key ? 'white' : 'transparent',
                                color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'content' && (
                <div className="card flex-col gap-6 animate-fade-in">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="form-group md:col-span-2">
                            <label className="form-label">Заголовок материала <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                value={article.title}
                                onChange={(e) => setArticle({ ...article, title: e.target.value })}
                                className="form-control text-lg font-semibold"
                                placeholder="Например: Инструкция по работе с кассой..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label flex items-center gap-1"><Clock size={16} /> Таймер изучения (мин)</label>
                            <input
                                type="number"
                                min="0"
                                value={article.minTimeMinutes}
                                onChange={(e) => setArticle({ ...article, minTimeMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="form-control"
                                placeholder="Например: 5"
                            />
                            <div className="text-xs text-secondary mt-1">
                                0 - статья без таймера закрытия
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label flex items-center gap-1"><Video size={16} /> Ссылка на видеоурок (YouTube / VK Видео)</label>
                        <input
                            type="text"
                            value={article.videoUrl || ''}
                            onChange={(e) => setArticle({ ...article, videoUrl: e.target.value })}
                            className="form-control"
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                        <div className="text-xs text-secondary mt-1">
                            Вставьте обычную ссылку на ролик. Оставьте поле пустым, если видео не требуется.
                        </div>
                    </div>

                    <div className="form-group flex-1 flex flex-col">
                        <label className="form-label">Текст материала <span className="text-danger">*</span></label>
                        <div className="bg-white rounded-xl border border-[var(--border-color)] overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
                            <ReactQuill
                                theme="snow"
                                value={article.content}
                                onChange={(content) => setArticle({ ...article, content })}
                                style={{ height: '400px', display: 'flex', flexDirection: 'column' }}
                                placeholder="Напишите всё, что сотруднику нужно знать перед прохождением теста..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }, { 'size': ['small', false, 'large', 'huge'] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        ['link', 'clean']
                                    ]
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'access' && (
                <div className="card flex-col gap-4 animate-fade-in">
                    <h3 className="mb-2">Выбор сотрудников</h3>
                    <p className="text-sm text-secondary mb-4">
                        Выберите сотрудников, которые смогут читать этот материал.
                        Если ни один сотрудник не выбран, материал будет доступен <strong>всем</strong>.
                    </p>

                    <div className="grid md:grid-cols-2 gap-3">
                        {employees.map(emp => {
                            const isAllowed = article.allowedUsers.includes(emp.id);
                            return (
                                <label
                                    key={emp.id}
                                    className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${isAllowed ? 'border-accent-primary bg-accent-primary/5' : 'border-[var(--border-color)] hover:border-accent-primary/30'}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-accent-primary mr-4"
                                        checked={isAllowed}
                                        onChange={() => toggleUserAccess(emp.id)}
                                    />
                                    <div>
                                        <div className={`font-semibold ${isAllowed ? 'text-primary' : 'text-secondary'}`}>{emp.name}</div>
                                        <div className="text-xs opacity-70">Сотрудник</div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
}
