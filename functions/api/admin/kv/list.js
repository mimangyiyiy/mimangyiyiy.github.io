// functions/api/admin/kv/list.js
// 查看 KV 中所有键值对（仅管理员）

export async function onRequest(context) {
  const { request, env } = context;

  // 验证管理员身份
  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 获取所有键
    const keys = await env.HTML_FILES.list();
    
    const items = [];
    for (const key of keys.keys) {
      // 获取每个键的值（只获取前 200 字符用于预览）
      const value = await env.HTML_FILES.get(key.name);
      const preview = value ? value.slice(0, 200) + (value.length > 200 ? '...' : '') : '(空)';
      const size = value ? value.length : 0;
      
      items.push({
        key: key.name,
        preview: preview,
        size: size,
        sizeKB: (size / 1024).toFixed(1) + ' KB',
        modified: key.uploaded || key.metadata?.uploaded || null
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

function isAdmin(auth) {
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}