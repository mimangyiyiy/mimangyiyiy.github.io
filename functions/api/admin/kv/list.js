// functions/api/admin/kv/list.js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // ✅ 从 URL 参数获取 token（绕过中间件）
  const token = url.searchParams.get('token');
  
  // 验证 token
  if (!token || !isValidToken(token)) {
    return new Response(JSON.stringify({ error: '未授权，请提供有效 token' }), {
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
        sizeKB: (value ? value.length / 1024 : 0).toFixed(1) + ' KB',
        preview: value ? value.slice(0, 200) + (value.length > 200 ? '...' : '') : '(空)'
      });
    }

    return new Response(JSON.stringify({
      total: items.length,
      keys: items
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function isValidToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
