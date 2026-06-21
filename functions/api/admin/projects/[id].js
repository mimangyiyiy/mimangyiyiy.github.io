// functions/api/admin/projects/[id].js
export async function onRequest(context) {
  const { request, env, params } = context;

  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = params.id;
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ error: '无效的ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PUT 请求：编辑作品
  if (request.method === 'PUT') {
    try {
      const { title, description, image, link, category_id } = await request.json();
      if (!title || !link) {
        return new Response(JSON.stringify({ error: '标题和链接为必填项' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await env.DB.prepare(`
        UPDATE projects 
        SET title = ?, description = ?, image = ?, link = ?, category_id = ?
        WHERE id = ?
      `).bind(title, description || '', image || '', link, category_id || null, id).run();

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

  // DELETE 请求：删除作品
  if (request.method === 'DELETE') {
    try {
      await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
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

function isAdmin(auth) {
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
