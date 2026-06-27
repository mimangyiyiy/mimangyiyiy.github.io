// functions/api/admin/kv/[key].js
// 查看或删除单个 KV 键

export async function onRequest(context) {
  const { request, env, params } = context;

  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const key = decodeURIComponent(params.key);

  // GET：获取键值内容
  if (request.method === 'GET') {
    try {
      const value = await env.HTML_FILES.get(key);
      if (value === null) {
        return new Response(JSON.stringify({ error: '键不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({
        key: key,
        value: value,
        size: value.length,
        sizeKB: (value.length / 1024).toFixed(1) + ' KB'
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

  // DELETE：删除键值
  if (request.method === 'DELETE') {
    try {
      await env.HTML_FILES.delete(key);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}