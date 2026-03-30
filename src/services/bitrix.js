/**
 * Bitrix24 Integration Service
 * 
 * To use this service, add VITE_BITRIX_WEBHOOK_URL to your .env file.
 * The URL should look like: https://am35.bitrix24.ru/rest/1/your_secret_token/
 */

const CHAT_IDS = ['107763', '139607'];

export const sendTestResultToBitrix = async (data) => {
    const webhookUrl = import.meta.env.VITE_BITRIX_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.warn('Bitrix24 Webhook URL is not configured. Skipping notification.');
        return;
    }

    const { userName, testTitle, score, total, passed } = data;
    
    const message = `🚀 *Результат теста*\n\n` +
                    `👤 *Сотрудник:* ${userName}\n` +
                    `📝 *Название теста:* ${testTitle}\n` +
                    `✅ *Правильных ответов:* ${score} из ${total}\n` +
                    `🏁 *Тест пройден:* ${passed ? 'Да ✅' : 'Нет ❌'}`;

    try {
        const promises = CHAT_IDS.map(chatId => {
            const url = `${webhookUrl.replace(/\/$/, '')}/im.message.add.json`;
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    DIALOG_ID: `chat${chatId}`,
                    MESSAGE: message
                })
            });
        });

        const results = await Promise.all(promises);
        results.forEach(async (res, idx) => {
            if (!res.ok) {
                const err = await res.json();
                console.error(`Failed to send to Bitrix Chat ${CHAT_IDS[idx]}:`, err);
            }
        });
    } catch (err) {
        console.error('Bitrix24 integration error:', err);
    }
};
