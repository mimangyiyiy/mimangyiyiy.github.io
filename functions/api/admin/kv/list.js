// functions/api/admin/kv/list.js
export async function onRequest(context) {
  const { request, env } = context;

  // 测试 KV 是否绑定
  console.log('🔍 env.HTML_FILES 是否存在:', !!env.HTML_FILES);
  
  if (!env.HTML_FILES) {
    return new Response(JSON.stringify({ 
      error: 'KV 未绑定，请检查 Pages 绑定设置',
      hint: '变量名应为 HTML_FILES'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const keys = await env.HTML_FILES.list();
    const items = [];
    for (const key of keys.keys) {
      const value = await env.HTML_FILES.get(key.name);
      items.push({
        key: key.name,
        size: value ? value.length : 0,
        preview: value ? value.slice(0, 100) + (value.length > 100 ? '...' : '') : '(空)'
      });
    }

    return new Response(JSON.stringify({
      total: items.length,
      keys: items,
      binding: 'HTML_FILES',  // 显示绑定名
      connected: true
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ 
      error: e.message,
      stack: e.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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
