// functions/api/admin/categories/[id].js
// 删除分类，支持将作品转移到其他分类

export async function onRequest(context) {
  const { request, env, params } = context;
  
  // 验证管理员身份
  const auth = request.headers.get("Authorization");
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: "未授权，请先登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const categoryId = params.id;
  if (!categoryId || isNaN(categoryId)) {
    return new Response(JSON.stringify({ error: "无效的分类ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 获取请求体（包含转移目标分类ID）
    const body = await request.json().catch(() => ({}));
    const { transferToId } = body;

    // 检查该分类下有多少作品
    const check = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM projects WHERE category_id = ?"
    ).bind(categoryId).first();

    if (check.count > 0) {
      // 如果有作品，必须指定转移目标
      if (!transferToId || isNaN(transferToId)) {
        // 获取所有分类，供前端选择
        const categories = await env.DB.prepare(
          "SELECT id, name FROM categories WHERE id != ? ORDER BY sort_order"
        ).bind(categoryId).all();
        
        return new Response(JSON.stringify({
          error: "该分类下还有作品，请选择转移目标分类",
          hasProjects: true,
          projectCount: check.count,
          availableCategories: categories.results || []
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 验证目标分类是否存在
      const targetExists = await env.DB.prepare(
        "SELECT id FROM categories WHERE id = ?"
      ).bind(transferToId).first();

      if (!targetExists) {
        return new Response(JSON.stringify({ error: "目标分类不存在" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 转移作品到目标分类
      await env.DB.prepare(
        "UPDATE projects SET category_id = ? WHERE category_id = ?"
      ).bind(transferToId, categoryId).run();
    }

    // 删除分类
    await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(categoryId).run();

    return new Response(JSON.stringify({ success: true }), {
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