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
    
    // Formatting the message for Bitrix24
    const message = `🚀 Результат теста\n\n` +
                    `👤 Сотрудник: ${userName}\n` +
                    `📝 Название теста: ${testTitle}\n` +
                    `✅ Правильных ответов: ${score} из ${total}\n` +
                    `🏁 Тест пройден: ${passed ? 'Да ✅' : 'Нет ❌'}`;

    try {
        const promises = CHAT_IDS.map(chatId => {
            // Ensure URL ends with a slash before adding method
            const baseUrl = webhookUrl.endsWith('/') ? webhookUrl : `${webhookUrl}/`;
            const url = `${baseUrl}im.message.add`;
            
            // Using URLSearchParams and mode: 'no-cors' to bypass CORS preflight blocks
            const params = new URLSearchParams();
            params.append('DIALOG_ID', `chat${chatId}`);
            params.append('MESSAGE', message);

            return fetch(url, {
                method: 'POST',
                mode: 'no-cors', // Critical for browser-side webhooks
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });
        });

        // Promise.all will resolve even with mode: 'no-cors' 
        // (but response will be opaque, status 0)
        await Promise.all(promises);
        console.log('Bitrix24 notification requests sent (opaque mode).');
        
    } catch (err) {
        console.error('Bitrix24 integration error:', err);
    }
};
