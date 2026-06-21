// functions/api/admin/downloads.js
// 处理 POST /api/admin/downloads 请求，用于添加新的下载项

export async function onRequest(context) {
  const { request, env } = context;

  // 1. 验证管理员身份
  const auth = request.headers.get("Authorization");
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: "未授权，请先登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. 只允许 POST 方法
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 3. 解析请求体
    const { title, description, link, link_text } = await request.json();

    // 4. 验证必填字段
    if (!title || !link) {
      return new Response(JSON.stringify({ error: "标题和链接为必填项" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. 插入数据库
    const result = await env.DB.prepare(`
      INSERT INTO downloads (title, description, link, link_text, sort_order) 
      VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM downloads))
    `).bind(title, description || "", link, link_text || "下载").run();

    // 6. 返回成功响应
    return new Response(JSON.stringify({ 
      id: result.meta.last_row_id, 
      success: true 
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    // 7. 返回错误信息
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 辅助函数：验证管理员 Token
function isAdmin(auth) {
  try {
    const token = auth.replace("Bearer ", "");
    const payload = JSON.parse(atob(token));
    // 检查 Token 是否过期 (exp 字段)
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}