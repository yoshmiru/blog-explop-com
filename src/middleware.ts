import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const url = new URL(context.request.url);

    // /admin または /api 配下のパスへのアクセスをチェック対象にする
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
        
        // Cloudflare Pages 環境でのIP取得 (CF-Connecting-IP)
        const clientIP = context.request.headers.get('CF-Connecting-IP');
        
        // 環境変数から許可されたIPを取得 (カンマ区切りで複数指定も可能にする)
        const env = (context.locals as any).runtime?.env || import.meta.env;
        const allowedIPs = (env.ALLOWED_IP || "").split(',').map((ip: string) => ip.trim());

        // ローカル開発環境 (localhost) での動作を許可
        const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

        if (!isLocal && (!clientIP || !allowedIPs.includes(clientIP))) {
            console.warn(`Access denied for IP: ${clientIP} to path: ${url.pathname}`);
            return new Response("Forbidden: Access denied for your IP address.", { status: 403 });
        }
    }

    // 制限をパスした、もしくはチェック対象外のパスなら次へ
    return next();
});
