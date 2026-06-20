// functions/api/admin/categories.js

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
    const { name } = await request.json();
    if (!name || name.trim() === "") {
      return new Response(JSON.stringify({ error: "分类名称不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO categories (name, sort_order) 
      VALUES (?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
    `).bind(name.trim()).run();

    return new Response(JSON.stringify({ id: result.meta.last_row_id, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e.message.includes("UNIQUE")) {
      return new Response(JSON.stringify({ error: "分类已存在" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
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