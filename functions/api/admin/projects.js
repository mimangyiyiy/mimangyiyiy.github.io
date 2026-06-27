// functions/api/admin/projects.js
export async function onRequest(context) {
  const { request, env } = context;

  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { title, description, image, link, category_id } = await request.json();

    if (!title || !link) {
      return new Response(JSON.stringify({ error: '标题和链接为必填项' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 插入作品
    const result = await env.DB.prepare(`
      INSERT INTO projects (title, description, image, link, category_id, sort_order) 
      VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM projects))
    `).bind(title, description || '', image || '', link, category_id || null).run();

    const projectId = result.meta.last_row_id;

    // ✅ 新增：如果链接指向 /cody/ 文件，标记为已使用
    const match = link.match(/\/cody\/([^\/?#]+)/);
    if (match) {
      const filename = match[1];
      await env.DB.prepare(
        'UPDATE file_usage SET project_id = ? WHERE filename = ?'
      ).bind(projectId, filename).run();
    }

    return new Response(JSON.stringify({ id: projectId, success: true }), {
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
