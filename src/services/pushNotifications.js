import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Convert VAPID public key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── Register service worker ────────────────────────────────────────────────
export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        return reg;
    } catch (err) {
        console.warn('[Push] SW registration failed:', err);
        return null;
    }
};

// ── Subscribe user to push ─────────────────────────────────────────────────
export const subscribeToPush = async (userId) => {
    if (!VAPID_PUBLIC_KEY || !('PushManager' in window)) return false;
    try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
        }

        const subJson = sub.toJSON();
        await supabase.from('push_subscriptions').upsert(
            { userId, endpoint: subJson.endpoint, subscription: subJson },
            { onConflict: 'endpoint' }
        );
        return true;
    } catch (err) {
        console.warn('[Push] Subscribe failed:', err);
        return false;
    }
};

// ── Request permission + subscribe ────────────────────────────────────────
export const requestAndSubscribe = async (userId) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    // Already granted — just subscribe silently
    if (Notification.permission === 'granted') {
        return subscribeToPush(userId);
    }

    // Don't ask again if already denied
    if (Notification.permission === 'denied') return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') return subscribeToPush(userId);
};

// ── Unsubscribe ────────────────────────────────────────────────────────────
export const unsubscribeFromPush = async () => {
    try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return;
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    } catch (err) {
        console.warn('[Push] Unsubscribe failed:', err);
    }
};
