// functions/_middleware.js
export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // ============================================================
  // 1. 公开路径列表（完全不需要登录）
  // ============================================================
  const publicPaths = [
    '/',
    '/admin.html',
    '/admin',
    '/api/projects',
    '/api/categories',
    '/api/downloads',
    '/api/health',
    '/api/admin/login',
    '/cody/',        // 作品文件目录
    '/cody',         // 精确匹配
    '/image/',
    '/images/'
  ];

  // 检查当前路径是否在公开列表中
  const isPublic = publicPaths.some(p => path === p || path.startsWith(p + '/'));

  // 如果是公开路径，直接放行（不检查 token）
  if (isPublic) {
    const response = await next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

  // ============================================================
  // 2. 处理 OPTIONS 预检请求
  // ============================================================
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // ============================================================
  // 3. 需要登录的路径（/api/admin/*）
  // ============================================================
  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    console.log('❌ 未授权请求:', path);
    return new Response(JSON.stringify({ error: '未授权，请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = await next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}

// ============================================================
// 验证 Token
// ============================================================
function isAdmin(auth) {
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
