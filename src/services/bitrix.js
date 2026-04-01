/**
 * Bitrix24 Integration Service
 */

const CHAT_IDS = ['107763', '139607'];

/**
 * Ensures we have the base REST URL ending with a slash
 */
const getCleanWebhookUrl = (rawUrl) => {
    if (!rawUrl) return null;
    
    // Matches the base REST URL part: https://domain/rest/USER/TOKEN/
    // This regex is more lenient with trailing slashes and method suffixes
    const restUrlMatch = rawUrl.match(/^(https?:\/\/[^\/]+\/rest\/\d+\/[^\/]+)/);
    if (restUrlMatch) {
        return `${restUrlMatch[1]}/`;
    }
    
    // Fallback: just ensure trailing slash if regex missed it
    return rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
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
    const rawWebhookUrl = import.meta.env.VITE_BITRIX_WEBHOOK_URL;
    const webhookUrl = getCleanWebhookUrl(rawWebhookUrl);
    
    if (!webhookUrl) {
        console.warn('Bitrix24 Webhook URL is not configured. Skipping notification.');
        return;
    }

    const { userName, testTitle, score, total, passed } = data;
    
    const message = `🚀 Результат теста\n\n` +
                    `👤 Сотрудник: ${userName || 'Неизвестно'}\n` +
                    `📝 Название теста: ${testTitle || 'Без названия'}\n` +
                    `✅ Правильных ответов: ${score} из ${total}\n` +
                    `🏁 Тест пройден: ${passed ? 'Да ✅' : 'Нет ❌'}`;

    try {
        const promises = CHAT_IDS.map(chatId => {
            const url = `${webhookUrl}im.message.add`;
            const params = new URLSearchParams();
            params.append('DIALOG_ID', `chat${chatId}`);
            params.append('MESSAGE', message);

            console.log(`[Bitrix24] Sending to chat ${chatId} via ${url}`);

            return fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });
        });

        await Promise.all(promises);
        console.log('[Bitrix24] Notification batch completed.');
    } catch (err) {
        console.error('[Bitrix24] Global integration error:', err);
    }
};
