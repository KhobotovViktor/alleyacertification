/**
 * Bitrix24 Integration Service
 */

const CHAT_IDS = ['107763', '139607'];

const getCleanWebhookUrl = (rawUrl) => {
    if (!rawUrl) return null;
    const restUrlMatch = rawUrl.match(/^(https?:\/\/[^\/]+\/rest\/\d+\/[^\/]+)/);
    if (restUrlMatch) return `${restUrlMatch[1]}/`;
    return rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
};

const sendToAllChats = async (webhookUrl, message) => {
    const promises = CHAT_IDS.map(chatId => {
        const url = `${webhookUrl}im.message.add`;
        const params = new URLSearchParams();
        params.append('DIALOG_ID', `chat${chatId}`);
        params.append('MESSAGE', message);
        console.log(`[Bitrix24] Sending to chat ${chatId}`);
        return fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
    });
    await Promise.all(promises);
    console.log('[Bitrix24] Notification batch completed.');
};

export const testConnection = async () => {
    const webhookUrl = getCleanWebhookUrl(import.meta.env.VITE_BITRIX_WEBHOOK_URL);
    if (!webhookUrl) throw new Error('Webhook URL не настроен в .env');

    const url = `${webhookUrl}im.message.add`;
    const params = new URLSearchParams();
    params.append('DIALOG_ID', `chat${CHAT_IDS[0]}`);
    params.append('MESSAGE', '🛠️ Тестовое сообщение: связь с системой обучения установлена!');

    console.log(`[Bitrix24 Diagnostic] Testing connection via: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return response;
};

export const sendTestResultToBitrix = async (data) => {
    const webhookUrl = getCleanWebhookUrl(import.meta.env.VITE_BITRIX_WEBHOOK_URL);
    if (!webhookUrl) {
        console.warn('Bitrix24 Webhook URL is not configured. Skipping notification.');
        return;
    }

    const { userName, testTitle, score, total, passed } = data;
    const message =
        `🚀 Результат теста\n\n` +
        `👤 Сотрудник: ${userName || 'Неизвестно'}\n` +
        `📝 Название теста: ${testTitle || 'Без названия'}\n` +
        `✅ Правильных ответов: ${score} из ${total}\n` +
        `🏁 Тест пройден: ${passed ? 'Да ✅' : 'Нет ❌'}`;

    try {
        await sendToAllChats(webhookUrl, message);
    } catch (err) {
        console.error('[Bitrix24] Global integration error:', err);
    }
};

/**
 * Notify chats when a test is published with a deadline.
 * Called from TestEditor on save when status === 'published' and deadline is set.
 */
export const sendTestAssignedToBitrix = async (data) => {
    const webhookUrl = getCleanWebhookUrl(import.meta.env.VITE_BITRIX_WEBHOOK_URL);
    if (!webhookUrl) {
        console.warn('Bitrix24 Webhook URL is not configured. Skipping assignment notification.');
        return;
    }

    const { testTitle, deadline, assignedCount } = data;
    const deadlineStr = deadline
        ? new Date(deadline).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : null;

    const message =
        `📋 Новое тестирование назначено\n\n` +
        `📝 Тест: ${testTitle || 'Без названия'}\n` +
        (assignedCount != null ? `👥 Сотрудников: ${assignedCount === 0 ? 'все' : assignedCount}\n` : '') +
        (deadlineStr ? `📅 Срок сдачи: до ${deadlineStr}\n` : '') +
        `\n⚡ Войдите в систему аттестации и пройдите тест в срок.`;

    try {
        await sendToAllChats(webhookUrl, message);
    } catch (err) {
        console.error('[Bitrix24] Assignment notification error:', err);
    }
};
