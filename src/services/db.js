import { supabase } from './supabaseClient';

const STORAGE_KEY_CURRENT_USER = 'employee_current_user';

// --- Auth ---
export const login = async (userId, password) => {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('password', password)
        .single();

    if (user && !error) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
        return user;
    }
    return null;
};

export const logout = () => {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
};

export const getCurrentUser = () => {
    const user = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return user ? JSON.parse(user) : null;
};

export const getAllUsers = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id');
    return data || [];
};

export const getAllEmployees = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee');
    return data || [];
};

// --- Tests ---
export const getTests = async () => {
    const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('createdAt', { ascending: false });
    return data || [];
};

export const getTestById = async (id) => {
    const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .single();
    return data;
};

export const saveTest = async (test) => {
    const testToSave = {
        ...test,
        allowedUsers: test.allowedUsers || [],
        questions: test.questions || [],
        requiredArticleId: test.requiredArticleId || null // Ensure empty string becomes null for FK
    };

    if (test.id && test.id.length > 20) {
        const { error } = await supabase
            .from('tests')
            .update(testToSave)
            .eq('id', test.id);
        if (error) throw error;
    } else {
        const { id, ...newTestData } = testToSave;
        const { error } = await supabase
            .from('tests')
            .insert([newTestData]);
        if (error) throw error;
    }
};

export const deleteTest = async (id) => {
    const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// --- Articles ---
export const getArticles = async () => {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('createdAt', { ascending: false });
    return data || [];
};

export const getArticleById = async (id) => {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
    return data;
};

export const saveArticle = async (article) => {
    const articleToSave = {
        title: article.title,
        content: article.content,
        videoUrl: article.videoUrl || '',
        minTimeMinutes: parseInt(article.minTimeMinutes) || 0,
        allowedUsers: article.allowedUsers || []
    };

    if (article.id && article.id.length > 20) {
        const { error } = await supabase
            .from('articles')
            .update(articleToSave)
            .eq('id', article.id);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('articles')
            .insert([articleToSave]);
        if (error) throw error;
    }
};

export const deleteArticle = async (id) => {
    const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// --- Article Progress ---
export const getArticleProgress = async () => {
    const { data, error } = await supabase
        .from('article_progress')
        .select('*')
        .order('lastReadAt', { ascending: false });
    return data || [];
};

export const saveArticleProgress = async (userId, articleId, timeSpentSeconds) => {
    const { data: existing } = await supabase
        .from('article_progress')
        .select('*')
        .eq('userId', userId)
        .eq('articleId', articleId)
        .single();

    if (existing) {
        await supabase
            .from('article_progress')
            .update({
                timeSpentSeconds: (existing.timeSpentSeconds || 0) + timeSpentSeconds,
                lastReadAt: new Date().toISOString()
            })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('article_progress')
            .insert([{
                userId,
                articleId,
                timeSpentSeconds,
                firstReadAt: new Date().toISOString(),
                lastReadAt: new Date().toISOString()
            }]);
    }
};

export const hasUserCompletedArticle = async (userId, articleId) => {
    if (!articleId) return true;
    const { data } = await supabase
        .from('article_progress')
        .select('id')
        .eq('userId', userId)
        .eq('articleId', articleId)
        .single();
    return !!data;
};

// --- Results ---
export const getResults = async () => {
    const { data, error } = await supabase
        .from('results')
        .select('*')
        .order('date', { ascending: false });
    return data || [];
};

export const getUserResults = async (userId) => {
    const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false });
    return data || [];
};

export const saveResult = async (result) => {
    const { error } = await supabase
        .from('results')
        .insert([{
            ...result,
            date: new Date().toISOString()
        }]);
    if (error) throw error;
};

export const clearResults = async () => {
    const { error } = await supabase
        .from('results')
        .delete()
        .neq('id', '0'); // Delete all
    if (error) throw error;
};

export const getTestAttemptsCount = async (userId, testId) => {
    const { count, error } = await supabase
        .from('results')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('testId', testId);
    return count || 0;
};
