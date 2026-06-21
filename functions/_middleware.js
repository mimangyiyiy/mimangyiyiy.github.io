// functions/_middleware.js
// 修复版：未登录时返回登录页面，而不是 401 错误

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // 1. 定义公开路径（不需要登录）
  const publicPaths = [
    '/',                 // 首页
    '/admin.html',       // 登录页面本身（注意：不是 /admin）
    '/api/projects',     // 公开 API
    '/api/categories',
    '/api/downloads',
    '/api/health',
    '/api/admin/login'
    '/cody/',
    '/image/',
    '/images/'
  ];

  const isPublic = publicPaths.some(path => url.pathname === path || url.pathname.startsWith(path + '/'));

  // 如果是公开路径，直接放行
  if (isPublic) {
    const response = await next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

  // 2. 处理需要登录的路径（如 /admin 页面或 /api/admin/*）

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

  // 检查 Token
  const auth = request.headers.get('Authorization');
  const tokenValid = auth && isAdmin(auth);

  // 如果请求的是 /admin 页面（非 API），且未登录，返回登录页面
  if (url.pathname === '/admin' && !tokenValid) {
    // 读取 admin.html 的内容并返回
    try {
      // 尝试从 Pages 的静态资源中获取 admin.html
      // 如果获取失败，直接返回一个内联的登录页面
      const adminPage = await env.ASSETS.fetch(new URL('/admin.html', request.url));
      if (adminPage.ok) {
        return adminPage;
      }
    } catch (e) {
      // 如果无法获取，返回一个简单的内联登录页面
      return new Response(getLoginPageHTML(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }

  // 如果是 API 请求（/api/admin/*）且未登录，返回 401
  if (url.pathname.startsWith('/api/admin/') && !tokenValid) {
    return new Response(JSON.stringify({ error: '未授权，请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 其他情况：验证通过，执行请求
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

// 内联登录页面（如果无法读取 admin.html 时的备用方案）
function getLoginPageHTML() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>登录</title>
<style>
body{background:#0a0a1a;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;}
.card{background:#1a1a2e;padding:40px;border-radius:16px;width:100%;max-width:400px;}
input{width:100%;padding:10px;margin:10px 0;border-radius:8px;border:1px solid #333;background:#2a2a4e;color:#fff;}
.btn{width:100%;padding:10px;background:#4C97FF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;}
.btn:hover{background:#3a7be0;}
</style>
</head>
<body>
<div class="card">
<h2>🔐 管理员登录</h2>
<input id="user" placeholder="用户名">
<input id="pass" type="password" placeholder="密码">
<button class="btn" onclick="login()">登录</button>
<script>
async function login(){const u=document.getElementById('user').value;const p=document.getElementById('pass').value;if(!u||!p){alert('请输入用户名和密码');return;}try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});const d=await r.json();if(r.ok){localStorage.setItem('adminToken',d.token);location.href='/admin';}else{alert('登录失败：'+(d.error||'请重试'));}}catch(e){alert('网络错误');}}
</script>
</div>
</body>
</html>`;
}
