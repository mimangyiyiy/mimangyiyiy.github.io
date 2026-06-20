// functions/api/admin/projects/transfer.js
// 批量将多个作品转移到指定分类

export async function onRequest(context) {
  const { request, env } = context;
  
  const auth = request.headers.get("Authorization");
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: "未授权，请先登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { projectIds, targetCategoryId } = await request.json();

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return new Response(JSON.stringify({ error: "请选择要转移的作品" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!targetCategoryId || isNaN(targetCategoryId)) {
      return new Response(JSON.stringify({ error: "请选择目标分类" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 验证目标分类是否存在
    const targetExists = await env.DB.prepare(
      "SELECT id FROM categories WHERE id = ?"
    ).bind(targetCategoryId).first();

    if (!targetExists) {
      return new Response(JSON.stringify({ error: "目标分类不存在" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 批量更新（使用 ? 占位符）
    const placeholders = projectIds.map(() => '?').join(',');
    await env.DB.prepare(
      `UPDATE projects SET category_id = ? WHERE id IN (${placeholders})`
    ).bind(targetCategoryId, ...projectIds).run();

    return new Response(JSON.stringify({ 
      success: true, 
      count: projectIds.length 
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function isAdmin(auth) {
  try {
    const token = auth.replace("Bearer ", "");
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}