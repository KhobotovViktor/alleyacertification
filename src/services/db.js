const STORAGE_KEY_TESTS = 'employee_tests';
const STORAGE_KEY_USERS = 'employee_users';
const STORAGE_KEY_RESULTS = 'employee_results';
const STORAGE_KEY_CURRENT_USER = 'employee_current_user';
const STORAGE_KEY_ARTICLES = 'employee_articles';
const STORAGE_KEY_ARTICLE_PROGRESS = 'employee_article_progress';

// --- Initialization ---
export const initializeDB = () => {
  // Always update users list to match requirements (they could be updated)
  const defaultUsers = [
    { id: 'admin1', name: 'Хоботов Виктор', role: 'admin', password: 'admin' },
    { id: 'emp_toropova', name: 'Торопова Ирина', role: 'employee', password: '832234' },
    { id: 'emp_davydova', name: 'Давыдова Лидия', role: 'employee', password: '741980' },
    { id: 'emp_dyagileva', name: 'Дягилева Юлия', role: 'employee', password: '621786' },
    { id: 'emp_ivlutina', name: 'Ивлютина Алена', role: 'employee', password: '223684' },
    { id: 'emp_ilinskaya', name: 'Ильинская Анастасия', role: 'employee', password: '976271' },
    { id: 'emp_kalinina', name: 'Калинина Светлана', role: 'employee', password: '590062' },
    { id: 'emp_kamkina', name: 'Камкина Юлия', role: 'employee', password: '820193' },
    { id: 'emp_steklova', name: 'Стеклова Полина', role: 'employee', password: '364553' }
  ];
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultUsers));

  if (!localStorage.getItem(STORAGE_KEY_TESTS)) {
    localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEY_RESULTS)) {
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEY_ARTICLES)) {
    localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEY_ARTICLE_PROGRESS)) {
    localStorage.setItem(STORAGE_KEY_ARTICLE_PROGRESS, JSON.stringify([]));
  }
};

// --- Auth ---
export const login = (userId, password) => {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS));
  const user = users.find(u => u.id === userId && u.password === password);
  if (user) {
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

export const getAllUsers = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS));
};

export const getAllEmployees = () => {
  const users = getAllUsers();
  return users.filter(u => u.role === 'employee');
};

// --- Tests ---
/*
Test model updated:
{
  ...
  allowedUsers: string[] // User IDs allowed to take this test. Empty = all allowed
}
*/
export const getTests = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_TESTS)) || [];
};

export const getTestById = (id) => {
  const tests = getTests();
  return tests.find(t => t.id?.toString() === id?.toString());
};

export const saveTest = (test) => {
  const tests = getTests();
  const existingIndex = tests.findIndex(t => t.id?.toString() === test.id?.toString());
  // Ensure allowedUsers defaults to empty array if undefined
  const testToSave = { ...test, allowedUsers: test.allowedUsers || [] };

  if (existingIndex >= 0) {
    tests[existingIndex] = testToSave;
  } else {
    tests.push({ ...testToSave, id: test.id || Date.now().toString() });
  }
  localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(tests));
};

export const deleteTest = (id) => {
  const tests = getTests();
  localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(tests.filter(t => t.id?.toString() !== id?.toString())));
};

// --- Articles ---
export const getArticles = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_ARTICLES)) || [];
};

export const getArticleById = (id) => {
  const articles = getArticles();
  return articles.find(a => a.id?.toString() === id?.toString());
};

export const saveArticle = (article) => {
  const articles = getArticles();
  const existingIndex = articles.findIndex(a => a.id?.toString() === article.id?.toString());
  const articleToSave = { ...article, allowedUsers: article.allowedUsers || [] };

  if (existingIndex >= 0) {
    articles[existingIndex] = articleToSave;
  } else {
    articles.push({ ...articleToSave, id: article.id || Date.now().toString(), createdAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(articles));
};

export const deleteArticle = (id) => {
  const articles = getArticles();
  localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(articles.filter(a => a.id?.toString() !== id?.toString())));
};

// --- Article Progress ---
export const getArticleProgress = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_ARTICLE_PROGRESS)) || [];
};

export const saveArticleProgress = (userId, articleId, timeSpentSeconds) => {
  const progressList = getArticleProgress();

  // Check if duplicate complete exists
  const existingIndex = progressList.findIndex(p => p.userId === userId && p.articleId === articleId);

  if (existingIndex >= 0) {
    progressList[existingIndex] = {
      ...progressList[existingIndex],
      timeSpentSeconds: progressList[existingIndex].timeSpentSeconds + timeSpentSeconds,
      lastReadAt: new Date().toISOString()
    };
  } else {
    progressList.push({
      id: Date.now().toString(),
      userId,
      articleId,
      timeSpentSeconds,
      firstReadAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString()
    });
  }

  localStorage.setItem(STORAGE_KEY_ARTICLE_PROGRESS, JSON.stringify(progressList));
};

export const hasUserCompletedArticle = (userId, articleId) => {
  if (!articleId) return true; // If no article required, consider it true
  const progressList = getArticleProgress();
  return progressList.some(p => p.userId === userId && p.articleId === articleId);
};

// --- Results ---
export const getResults = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_RESULTS)) || [];
};

export const getUserResults = (userId) => {
  const results = getResults();
  return results.filter(r => r.userId === userId);
};

export const saveResult = (result) => {
  const results = getResults();
  results.push({ ...result, id: Date.now().toString(), date: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
};

export const clearResults = () => {
  localStorage.removeItem(STORAGE_KEY_RESULTS);
};

export const getTestAttemptsCount = (userId, testId) => {
  const results = getResults();
  return results.filter(r => r.userId === userId && r.testId === testId).length;
};
