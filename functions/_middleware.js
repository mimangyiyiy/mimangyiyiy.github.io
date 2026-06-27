// functions/_middleware.js
export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // ============================================================
  // 1. 公开路径列表
  // ============================================================
  const publicPaths = [
    '/',
    '/admin.html',
    '/admin',
    '/api/projects',
    '/api/categories',
    '/api/downloads',
    '/api/admin/kv/',
    '/api/admin/kv',
    '/api/admin/kv/list',
    '/api/files',
    '/api/health',
    '/api/admin/login',
    '/api/test-kv',
    '/cody/',
    '/cody',
    '/image/',
    '/images/'
  ];

  const isPublic = publicPaths.some(p => path === p || path.startsWith(p + '/'));

  if (isPublic) {
    const response = await next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

  // ============================================================
  // 2. OPTIONS 预检
  // ============================================================
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // ============================================================
  // 3. 需要登录的路径：/api/admin/*
  // ============================================================
  if (path.startsWith('/api/admin/')) {
    const auth = request.headers.get('Authorization');
    if (!auth || !isAdmin(auth)) {
      return new Response(JSON.stringify({ error: '未授权，请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const response = await next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}

function isAdmin(auth) {
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
