/**
 * Bitrix24 Integration Service
 */

const CHAT_IDS = ['107763', '139607'];

export const sendTestResultToBitrix = async (data) => {
    let webhookUrl = import.meta.env.VITE_BITRIX_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.warn('Bitrix24 Webhook URL is not configured. Skipping notification.');
        return;
    }

    // URL RESILIENCE: Extract base REST URL if user pasted a specific method like /profile.json
    // Matches everything up to the secret token (e.g., .../rest/USER_ID/TOKEN/)
    const restUrlMatch = webhookUrl.match(/^(https?:\/\/[^\/]+\/rest\/\d+\/[^\/]+\/)/);
    if (restUrlMatch) {
        webhookUrl = restUrlMatch[1];
    } else {
        // Fallback: just ensure trailing slash
        webhookUrl = webhookUrl.endsWith('/') ? webhookUrl : `${webhookUrl}/`;
    }

    const { userName, testTitle, score, total, passed } = data;
    
    const message = `🚀 Результат теста\n\n` +
                    `👤 Сотрудник: ${userName}\n` +
                    `📝 Название теста: ${testTitle}\n` +
                    `✅ Правильных ответов: ${score} из ${total}\n` +
                    `🏁 Тест пройден: ${passed ? 'Да ✅' : 'Нет ❌'}`;

    try {
        const promises = CHAT_IDS.map(chatId => {
            const url = `${webhookUrl}im.message.add`;
            
            const params = new URLSearchParams();
            params.append('DIALOG_ID', `chat${chatId}`);
            params.append('MESSAGE', message);

            console.log(`Sending Bitrix24 notification to chat ${chatId} via ${url}`);

            return fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });
        });

        await Promise.all(promises);
        console.log('Bitrix24 notification requests completed.');
    } catch (err) {
        console.error('Bitrix24 integration error:', err);
    }
};
