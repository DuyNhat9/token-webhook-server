export default {
  async fetch(req, env) {
    return new Response('Worker alive', { status: 200 });
  },

  async scheduled(event, env, ctx) {
    const BASE = 'https://token-webhook-server-production.up.railway.app';

    try {
      // Chỉ gọi auto-refresh - server sẽ tự động lấy token mới và gửi Telegram
      await fetch(`${BASE}/auto-refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret: env.CRON_SECRET }),
      }).catch(() => {});
      
      console.log('Auto-refresh triggered');
    } catch (e) {
      console.error('Scheduled error:', e && (e.stack || e.message || e));
    }
  }
}
