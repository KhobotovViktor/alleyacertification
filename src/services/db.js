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
        window.dispatchEvent(new CustomEvent('user-session-change'));
        return user;
    }
    return null;
};

export const logout = () => {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    window.dispatchEvent(new CustomEvent('user-session-change'));
};

export const getCurrentUser = () => {
    const user = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return user ? JSON.parse(user) : null;
};

export const getAllUsers = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .order('id');
    if (error) throw error;
    return data || [];
};

// All users including department — for admin user management
export const getFullUsersList = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role, department')
        .order('name');
    if (error) throw error;
    return data || [];
};

export const createUser = async ({ id, name, password, role, department }) => {
    const { error } = await supabase
        .from('users')
        .insert([{
            id: id.trim(),
            name: name.trim(),
            password,
            role,
            department: department?.trim() || null,
        }]);
    if (error) {
        if (error.code === '23505') throw new Error('Пользователь с таким логином уже существует');
        throw error;
    }
};

export const deleteUser = async (userId) => {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
    if (error) throw error;
};

export const updateUserPassword = async (userId, password) => {
    const { error } = await supabase
        .from('users')
        .update({ password })
        .eq('id', userId);
    if (error) throw error;
};

export const getAllEmployees = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role, department')
        .eq('role', 'employee');
    if (error) throw error;
    return data || [];
};

export const updateUserDepartment = async (userId, department) => {
    const { error } = await supabase
        .from('users')
        .update({ department })
        .eq('id', userId);
    if (error) throw error;
};

// --- Tests ---
// Full data (with questions JSON) — used by AdminDashboard for question count
export const getTests = async () => {
    const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
};

// Lightweight — no questions JSON, used by EmployeeDashboard
export const getTestsSummary = async () => {
    const { data, error } = await supabase
        .from('tests')
        .select('id, title, timeLimit, passingScore, maxAttempts, allowedUsers, requiredArticleId, shuffleQuestions, noRepeatQuestions, questionsLimit, showFeedback, isPublic, status, deadline, createdAt, createdBy')
        .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
};

// Tests created by a specific user (employee-created tests) — includes comment + question counts
export const getMyTests = async (userId) => {
    const { data, error } = await supabase
        .from('tests')
        .select('id, title, timeLimit, passingScore, questions, isPublic, status, createdAt')
        .eq('createdBy', userId)
        .order('createdAt', { ascending: false });
    if (error) throw error;
    const tests = data || [];
    if (!tests.length) return tests;
    const testIds = tests.map(t => t.id);
    const [commentCounts, questionCounts] = await Promise.all([
        getCommentCounts(testIds),
        getAuthorQuestionCounts(testIds),
    ]);
    return tests.map(t => ({
        ...t,
        commentCount: commentCounts[t.id] || 0,
        questionCount: questionCounts[t.id]?.total || 0,
        unansweredQuestionCount: questionCounts[t.id]?.unanswered || 0,
    }));
};

export const getTestById = async (id) => {
    const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

export const saveTest = async (test) => {
    const testToSave = {
        ...test,
        allowedUsers: test.allowedUsers || [],
        questions: test.questions || [],
        requiredArticleId: test.requiredArticleId || null,
        noRepeatQuestions: !!test.noRepeatQuestions,
        isPublic: !!test.isPublic,
        status: test.status || 'published',
        deadline: test.deadline || null,
    };

    if (test.id) {
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

export const updateTestStatus = async (id, status) => {
    const { error } = await supabase
        .from('tests')
        .update({ status })
        .eq('id', id);
    if (error) throw error;
};

// --- Articles ---
// No content field — dashboards only need metadata (title, allowedUsers, etc.)
// Full content is fetched via getArticleById() when opening an article
export const getArticles = async () => {
    const { data, error } = await supabase
        .from('articles')
        .select('id, title, allowedUsers, createdAt, videoUrl, audioUrl, minTimeMinutes')
        .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getArticleById = async (id) => {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

export const saveArticle = async (article) => {
    const articleToSave = {
        title: article.title,
        content: article.content,
        videoUrl: article.videoUrl || '',
        audioUrl: article.audioUrl || '',
        minTimeMinutes: parseInt(article.minTimeMinutes) || 0,
        allowedUsers: article.allowedUsers || []
    };

    if (article.id) {
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

// --- Storage ---
export const uploadQuestionMedia = async (file) => {
    if (!file) return null;

    const maxMB = 50;
    if (file.size > maxMB * 1024 * 1024) {
        throw new Error(`Файл слишком большой (максимум ${maxMB} МБ)`);
    }

    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
        .from('question-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('question-media')
        .getPublicUrl(fileName);

    const mediaType = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('audio/') ? 'audio'
        : file.type.startsWith('video/') ? 'video'
        : 'image'; // fallback

    return { url: publicUrl, mediaType };
};

export const uploadAudioFile = async (file) => {
    // Basic validation
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
        .from('podcasts')
        .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('podcasts')
        .getPublicUrl(filePath);

    return publicUrl;
};

// --- Article Progress ---
export const getArticleProgress = async (userId = null) => {
    let query = supabase
        .from('article_progress')
        .select('*')
        .order('lastReadAt', { ascending: false });
    if (userId) query = query.eq('userId', userId);
    const { data, error } = await query;
    if (error) throw error;
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
    if (error) throw error;
    return data || [];
};

export const getUserResults = async (userId) => {
    const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const saveResult = async (result) => {
    const resultToSave = {
        ...result,
        date: result.date || new Date().toISOString(),
        answeredQuestionIds: result.answeredQuestionIds || []
    };

    // If id exists — update, otherwise — insert (let DB generate the id)
    if (resultToSave.id) {
        const { data, error } = await supabase
            .from('results')
            .update(resultToSave)
            .eq('id', resultToSave.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        const { id, ...insertData } = resultToSave;
        const { data, error } = await supabase
            .from('results')
            .insert([insertData])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

export const getAlreadyAnsweredQuestionIds = async (userId, testId) => {
    const { data, error } = await supabase
        .from('results')
        .select('answeredQuestionIds')
        .eq('userId', userId)
        .eq('testId', testId);
    
    if (error || !data) return [];
    
    // Flatten the array of arrays of IDs
    const allIds = data.reduce((acc, row) => {
        const ids = Array.isArray(row.answeredQuestionIds) ? row.answeredQuestionIds : [];
        return [...acc, ...ids];
    }, []);
    
    // Return unique IDs
    return [...new Set(allIds)];
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

// --- Test Comments ---
export const getTestComments = async (testId) => {
    const { data, error } = await supabase
        .from('test_comments')
        .select('*')
        .eq('testId', testId)
        .order('createdAt', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const addTestComment = async (userId, userName, testId, text) => {
    const { data, error } = await supabase
        .from('test_comments')
        .insert([{ userId, userName, testId, text: text.trim().slice(0, 500) }])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteTestComment = async (commentId) => {
    const { error } = await supabase
        .from('test_comments')
        .delete()
        .eq('id', commentId);
    if (error) throw error;
};

export const getCommentCounts = async (testIds) => {
    if (!testIds?.length) return {};
    const { data } = await supabase
        .from('test_comments')
        .select('testId')
        .in('testId', testIds);
    const counts = {};
    (data || []).forEach(c => { counts[c.testId] = (counts[c.testId] || 0) + 1; });
    return counts;
};

// --- Questions to Author ---
export const askTestAuthor = async (testId, fromUserId, fromUserName, question) => {
    const { data, error } = await supabase
        .from('test_questions_to_author')
        .insert([{ testId, fromUserId, fromUserName, question: question.trim().slice(0, 500) }])
        .select().single();
    if (error) throw error;
    return data;
};

export const getQuestionsForTest = async (testId) => {
    const { data, error } = await supabase
        .from('test_questions_to_author')
        .select('*')
        .eq('testId', testId)
        .order('createdAt', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const answerTestQuestion = async (questionId, answer) => {
    const { data, error } = await supabase
        .from('test_questions_to_author')
        .update({ answer: answer.trim().slice(0, 1000), answeredAt: new Date().toISOString() })
        .eq('id', questionId)
        .select().single();
    if (error) throw error;
    return data;
};

export const getAuthorQuestionCounts = async (testIds) => {
    if (!testIds?.length) return {};
    const { data } = await supabase
        .from('test_questions_to_author')
        .select('testId, answer')
        .in('testId', testIds);
    const counts = {};
    (data || []).forEach(q => {
        if (!counts[q.testId]) counts[q.testId] = { total: 0, unanswered: 0 };
        counts[q.testId].total++;
        if (!q.answer) counts[q.testId].unanswered++;
    });
    return counts;
};

// --- Test Likes ---
export const toggleTestLike = async (userId, testId) => {
    const { data: existing } = await supabase
        .from('test_likes')
        .select('id')
        .eq('userId', userId)
        .eq('testId', testId)
        .single();

    if (existing) {
        await supabase.from('test_likes').delete().eq('id', existing.id);
        return false; // unliked
    } else {
        await supabase.from('test_likes').insert([{ userId, testId }]);
        return true; // liked
    }
};

export const getPopularTests = async (currentUserId) => {
    const { data: tests, error } = await supabase
        .from('tests')
        .select('id, title, timeLimit, passingScore, maxAttempts, status, isPublic, createdAt, createdBy, questions')
        .eq('isPublic', true)
        .eq('status', 'published');
    if (error) throw error;
    if (!tests?.length) return { tests: [], userLikedIds: new Set() };

    const testIds = tests.map(t => t.id);
    const [{ data: allLikes }, { data: myLikes }, { data: allComments }] = await Promise.all([
        supabase.from('test_likes').select('testId').in('testId', testIds),
        supabase.from('test_likes').select('testId').eq('userId', currentUserId).in('testId', testIds),
        supabase.from('test_comments').select('testId').in('testId', testIds),
    ]);

    const likeCounts = {};
    (allLikes || []).forEach(l => { likeCounts[l.testId] = (likeCounts[l.testId] || 0) + 1; });

    const commentCounts = {};
    (allComments || []).forEach(c => { commentCounts[c.testId] = (commentCounts[c.testId] || 0) + 1; });

    const userLikedIds = new Set((myLikes || []).map(l => l.testId));

    const sorted = tests
        .map(t => ({
            ...t,
            likeCount: likeCounts[t.id] || 0,
            commentCount: commentCounts[t.id] || 0,
            questionsCount: t.questions?.length || 0,
        }))
        .sort((a, b) => b.likeCount - a.likeCount || new Date(b.createdAt) - new Date(a.createdAt));

    return { tests: sorted, userLikedIds };
};

// --- Activity Feed & Reactions ---
export const getActivityFeed = async (limit = 40) => {
    const [{ data: results }, { data: createdTests }] = await Promise.all([
        supabase.from('results').select('id, userId, testId, score, total, date')
            .eq('passed', true).order('date', { ascending: false }).limit(limit),
        supabase.from('tests').select('id, title, createdAt, createdBy')
            .not('createdBy', 'is', null).eq('status', 'published').eq('isPublic', true)
            .order('createdAt', { ascending: false }).limit(20),
    ]);

    const testIds = [...new Set((results || []).map(r => r.testId))];
    const { data: testRows } = testIds.length
        ? await supabase.from('tests').select('id, title').in('id', testIds)
        : { data: [] };
    const testMap = Object.fromEntries((testRows || []).map(t => [t.id, t.title]));

    const passedEvents = (results || []).map(r => ({
        id: r.id, type: 'test_passed',
        userId: r.userId, date: r.date,
        testId: r.testId, testTitle: testMap[r.testId] || 'Тест',
        score: r.score, total: r.total,
    }));
    const createdEvents = (createdTests || []).map(t => ({
        id: `created_${t.id}`, type: 'test_created',
        userId: t.createdBy, date: t.createdAt,
        testId: t.id, testTitle: t.title,
    }));

    return [...passedEvents, ...createdEvents]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
};

export const getReactionData = async (resultIds, currentUserId) => {
    if (!resultIds?.length) return { counts: {}, myReactions: {} };
    const [{ data: all }, { data: mine }] = await Promise.all([
        supabase.from('result_reactions').select('resultId, emoji').in('resultId', resultIds),
        supabase.from('result_reactions').select('resultId, emoji').in('resultId', resultIds).eq('userId', currentUserId),
    ]);
    const counts = {};
    (all || []).forEach(r => {
        if (!counts[r.resultId]) counts[r.resultId] = {};
        counts[r.resultId][r.emoji] = (counts[r.resultId][r.emoji] || 0) + 1;
    });
    const myReactions = {};
    (mine || []).forEach(r => {
        if (!myReactions[r.resultId]) myReactions[r.resultId] = new Set();
        myReactions[r.resultId].add(r.emoji);
    });
    return { counts, myReactions };
};

// --- Public Profile ---
export const getUserProfile = async (userId) => {
    const { data: user, error } = await supabase
        .from('users').select('id, name, role, department').eq('id', userId).single();
    if (error || !user) return null;
    const [{ data: results }, { data: createdTests }] = await Promise.all([
        supabase.from('results').select('score, total, passed, date').eq('userId', userId).order('date', { ascending: false }),
        supabase.from('tests').select('id, title, timeLimit, passingScore, questions, isPublic, status, createdAt')
            .eq('createdBy', userId).eq('status', 'published').eq('isPublic', true),
    ]);
    return { user, results: results || [], createdTests: createdTests || [] };
};

// --- Author Follows ---
export const toggleFollow = async (followerId, authorId) => {
    const { data: existing } = await supabase.from('author_follows').select('id')
        .eq('followerId', followerId).eq('authorId', authorId).single();
    if (existing) {
        await supabase.from('author_follows').delete().eq('id', existing.id);
        return false;
    }
    await supabase.from('author_follows').insert([{ followerId, authorId }]);
    return true;
};

export const getFollowData = async (authorId, currentUserId) => {
    const [{ count }, { data: mine }] = await Promise.all([
        supabase.from('author_follows').select('*', { count: 'exact', head: true }).eq('authorId', authorId),
        currentUserId
            ? supabase.from('author_follows').select('id').eq('followerId', currentUserId).eq('authorId', authorId).single()
            : Promise.resolve({ data: null }),
    ]);
    return { followerCount: count || 0, isFollowing: !!mine };
};

export const getFollowerIds = async (authorId) => {
    const { data } = await supabase.from('author_follows').select('followerId').eq('authorId', authorId);
    return (data || []).map(f => f.followerId);
};

export const getFollowedAuthorIds = async (userId) => {
    const { data } = await supabase.from('author_follows').select('authorId').eq('followerId', userId);
    return new Set((data || []).map(f => f.authorId));
};

export const toggleResultReaction = async (resultId, userId, emoji) => {
    const { data: existing } = await supabase
        .from('result_reactions')
        .select('id')
        .eq('resultId', resultId)
        .eq('userId', userId)
        .eq('emoji', emoji)
        .single();
    if (existing) {
        await supabase.from('result_reactions').delete().eq('id', existing.id);
        return false;
    } else {
        await supabase.from('result_reactions').insert([{ resultId, userId, emoji }]);
        return true;
    }
};

// --- Push Notifications ---
export const sendPushNotification = async (userIds, { title, body, url = '/', tag }) => {
    if (!userIds?.length) return;
    try {
        await supabase.functions.invoke('send-push', {
            body: { userIds, title, body, url, tag },
        });
    } catch (err) {
        console.warn('[Push] invoke failed:', err);
    }
};

export const getAdminUserIds = async () => {
    const { data } = await supabase.from('users').select('id').eq('role', 'admin');
    return (data || []).map(u => u.id);
};

export const notifyTestPublished = async (test) => {
    let userIds = test.allowedUsers?.length ? test.allowedUsers : null;
    if (!userIds) {
        const employees = await getAllEmployees();
        userIds = employees.map(e => e.id);
    }
    if (!userIds?.length) return;
    const deadlineText = test.deadline
        ? ` · Срок: ${new Date(test.deadline).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
        : '';
    await sendPushNotification(userIds, {
        title: `📋 Новый тест: ${test.title}`,
        body: `Время: ${Math.round(test.timeLimit / 60)} мин · Балл: ${test.passingScore}${deadlineText}`,
        url: '/employee',
        tag: `test-published-${test.id || Date.now()}`,
    });
};

export const notifyResultSaved = async (result, testTitle, userName) => {
    const pct = Math.round(result.score / result.total * 100);
    const emoji = result.passed ? '✅' : '❌';
    // Notify the employee
    sendPushNotification([result.userId], {
        title: `${emoji} ${testTitle}`,
        body: `Ваш результат: ${result.score} из ${result.total} (${pct}%)`,
        url: '/employee',
        tag: `result-${result.testId}`,
    });
    // Notify all admins
    const adminIds = await getAdminUserIds();
    if (adminIds.length) {
        sendPushNotification(adminIds, {
            title: `📊 Новый результат`,
            body: `${userName}: «${testTitle}» — ${result.score}/${result.total} (${pct}%) ${emoji}`,
            url: '/admin',
            tag: `admin-result-${result.testId}-${result.userId}`,
        });
    }
};

// --- Department Leaderboard ---
export const getDepartmentLeaderboard = async (department) => {
    if (!department) return [];

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('department', department)
        .eq('role', 'employee');

    if (error || !users?.length) return [];

    const userIds = users.map(u => u.id);

    const { data: resultsData } = await supabase
        .from('results')
        .select('userId, score, total, passed')
        .in('userId', userIds);

    const allResults = resultsData || [];

    return users
        .map(u => {
            const ur = allResults.filter(r => r.userId === u.id);
            const passedCount = ur.filter(r => r.passed).length;
            const totalAttempts = ur.length;
            const avgPct = totalAttempts > 0
                ? Math.round(ur.reduce((s, r) => s + (r.score / r.total * 100), 0) / totalAttempts)
                : 0;
            return { id: u.id, name: u.name, passedCount, totalAttempts, avgPct };
        })
        .sort((a, b) => b.passedCount - a.passedCount || b.avgPct - a.avgPct);
};
