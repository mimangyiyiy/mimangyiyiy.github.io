// functions/_middleware.js
// 修复版：只保护 /api/admin/* 路径，其他路径公开

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1. 定义不需要登录的公开路径
  const publicPaths = [
    '/',                 // 首页
    '/admin.html',       // 管理后台页面本身（登录界面）
    '/api/projects',     // 作品列表 API
    '/api/categories',   // 分类列表 API
    '/api/downloads',    // 下载列表 API
    '/api/health',       // 健康检查
    '/cody/',            // 你的作品子页面目录
    '/image/',           // 你的图片目录
    '/images/'           // 如果有图片目录
  ];

  // 检查当前请求路径是否在公开列表中
  const isPublic = publicPaths.some(path => url.pathname === path || url.pathname.startsWith(path + '/'));

  // 如果是公开路径，直接放行
  if (isPublic) {
    const response = await next();
    // 为公开路径添加 CORS 头（允许跨域）
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

  // 2. 以下代码仅对非公开路径生效（即 /api/admin/*）
  // 处理预检请求（OPTIONS）
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
    return new Response(JSON.stringify({ error: '未授权，请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 验证通过，执行请求
  const response = await next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}

// 验证 Token 的辅助函数
function isAdmin(auth) {
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
