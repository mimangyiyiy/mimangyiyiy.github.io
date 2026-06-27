// functions/api/kv-list.js
// 公开的 KV 查看接口（需要在 _middleware.js 中公开 /api/kv-list）
// functions/api/kv-list.js
export async function onRequest(context) {
  const { env } = context;
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
    const jsonData = JSON.stringify({ total: items.length, keys: items });
    return new Response(jsonData, {
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': jsonData.length.toString()  // ✅ 添加这一行
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
