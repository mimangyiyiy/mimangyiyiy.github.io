// functions/api/kv-list.js
// 公开的 KV 查看接口（需要在 _middleware.js 中公开 /api/kv-list）
export async function onRequest(context) {
  const { env } = context;
  
  try {
    // 获取所有键
    const keys = await env.HTML_FILES.list();
    const items = [];
    
    for (const key of keys.keys) {
      const value = await env.HTML_FILES.get(key.name);
      const preview = value ? value.slice(0, 200) + (value.length > 200 ? '...' : '') : '(空)';
      items.push({
        key: key.name,
        size: value ? value.length : 0,
        sizeKB: (value ? value.length / 1024 : 0).toFixed(1) + ' KB',
        preview: preview
      });
    }

    return new Response(JSON.stringify({
      total: items.length,
      keys: items
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}
