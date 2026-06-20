// functions/api/admin/projects.js

export async function onRequest(context) {
  const { request, env } = context;
  
  // 验证管理员身份
  const auth = request.headers.get("Authorization");
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: "未授权，请先登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { title, description, image, link, category_id } = await request.json();
    
    if (!title || !link) {
      return new Response(JSON.stringify({ error: "标题和链接为必填项" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO projects (title, description, image, link, category_id, sort_order) 
      VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM projects))
    `).bind(title, description || "", image || "", link, category_id || null).run();

    return new Response(JSON.stringify({ id: result.meta.last_row_id, success: true }), {
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