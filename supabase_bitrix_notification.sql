-- SERVER-SIDE BITRIX24 NOTIFICATIONS (SUPABASE)
-- Use this script in the Supabase SQL Editor if client-side notifications continue to fail.

-- 1. Enable the pg_net extension (required for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the notification function
CREATE OR REPLACE FUNCTION public.notify_bitrix_on_result()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_test_title TEXT;
    v_message TEXT;
    -- IMPORTANT: Paste your actual base Webhook URL here (ending in /)
    v_webhook_url TEXT := 'https://am35.bitrix24.ru/rest/847/u29cnb56q4oeo6hq/'; 
    v_chat_ids TEXT[] := ARRAY['107763', '139607'];
    v_chat_id TEXT;
BEGIN
    -- Get user and test information
    SELECT name INTO v_user_name FROM public.users WHERE id = NEW."userId";
    SELECT title INTO v_test_title FROM public.tests WHERE id = NEW."testId";

    -- Format the message
    v_message := '🚀 Результат теста (Server-side)' || CHR(10) || CHR(10) ||
                 '👤 Сотрудник: ' || COALESCE(v_user_name, 'Unknown') || CHR(10) ||
                 '📝 Название теста: ' || COALESCE(v_test_title, 'Unknown') || CHR(10) ||
                 '✅ Правильных ответов: ' || NEW.score || ' из ' || NEW.total || CHR(10) ||
                 '🏁 Тест пройден: ' || CASE WHEN NEW.passed THEN 'Да ✅' ELSE 'Нет ❌' END;

    -- Send notifications to each chat ID
    FOREACH v_chat_id IN ARRAY v_chat_ids
    LOOP
        PERFORM net.http_post(
            url := v_webhook_url || 'im.message.add',
            body := jsonb_build_object(
                'DIALOG_ID', 'chat' || v_chat_id,
                'MESSAGE', v_message
            ),
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_result_inserted ON public.results;
CREATE TRIGGER on_result_inserted
    AFTER INSERT ON public.results
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_bitrix_on_result();

-- NOTE: To disable this, run: DROP TRIGGER IF EXISTS on_result_inserted ON public.results;
