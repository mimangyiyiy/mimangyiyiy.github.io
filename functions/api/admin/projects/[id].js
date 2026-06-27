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

  // --- PUT 编辑 ---
  if (request.method === 'PUT') {
    try {
      const { title, description, image, link, category_id } = await request.json();
      if (!title || !link) {
        return new Response(JSON.stringify({ error: '标题和链接为必填项' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 获取旧链接，用于解除旧文件的标记
      const old = await env.DB.prepare('SELECT link FROM projects WHERE id = ?').bind(id).first();
      
      await env.DB.prepare(`
        UPDATE projects 
        SET title = ?, description = ?, image = ?, link = ?, category_id = ?
        WHERE id = ?
      `).bind(title, description || '', image || '', link, category_id || null, id).run();

      // 更新文件使用状态
      // 如果旧链接指向文件，解除标记
      if (old && old.link) {
        const oldMatch = old.link.match(/\/cody\/([^\/?#]+)/);
        if (oldMatch) {
          await env.DB.prepare(
            'UPDATE file_usage SET project_id = NULL WHERE filename = ? AND project_id = ?'
          ).bind(oldMatch[1], id).run();
        }
      }
      // 如果新链接指向文件，标记为已使用
      const newMatch = link.match(/\/cody\/([^\/?#]+)/);
      if (newMatch) {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO file_usage (filename) VALUES (?)'
        ).bind(newMatch[1]).run();
        await env.DB.prepare(
          'UPDATE file_usage SET project_id = ? WHERE filename = ?'
        ).bind(id, newMatch[1]).run();
      }

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

  // --- DELETE 删除 ---
  if (request.method === 'DELETE') {
    try {
      // 获取作品使用的文件
      const project = await env.DB.prepare('SELECT link FROM projects WHERE id = ?').bind(id).first();
      
      // 删除作品
      await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();

      // ✅ 解除文件的使用标记
      if (project && project.link) {
        const match = project.link.match(/\/cody\/([^\/?#]+)/);
        if (match) {
          await env.DB.prepare(
            'UPDATE file_usage SET project_id = NULL WHERE filename = ? AND project_id = ?'
          ).bind(match[1], id).run();
        }
      }

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
