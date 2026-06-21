// functions/_middleware.js
// 这个文件会处理所有 API 请求的跨域问题

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1. 定义公开路径列表（不需要登录）
  const publicPaths = ['/api/projects', '/api/categories', '/api/downloads'];
  const isPublicPath = publicPaths.some(path => url.pathname.startsWith(path));

  // 2. 如果是公开路径，直接放行，不进行任何验证
  if (isPublicPath) {
    return await next();
  }

  // 3. 以下是需要验证的路径（如 /api/admin/...）
  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 验证管理员 Token
  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 执行实际请求
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
