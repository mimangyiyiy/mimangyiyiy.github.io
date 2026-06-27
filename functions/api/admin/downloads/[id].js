export async function onRequest(context) {
  const { request, env, params } = context;
  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
  }

  const id = params.id;
  if (request.method === 'PUT') {
    try {
      const { title, description, link, link_text } = await request.json();
      if (!title || !link) {
        return new Response(JSON.stringify({ error: '标题和链接为必填项' }), { status: 400 });
      }
      await env.DB.prepare(
        'UPDATE downloads SET title = ?, description = ?, link = ?, link_text = ? WHERE id = ?'
      ).bind(title, description || '', link, link_text || '下载', id).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }
  // ... 原有的 DELETE 逻辑
}

function isAdmin(auth) {
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch { return false; }
}
