// functions/api/downloads.js
// 公开 API：获取下载列表，无需登录

export async function onRequest(context) {
  const { env } = context;

  try {
    // 从数据库查询所有下载项，按排序字段升序排列
    const result = await env.DB.prepare(
      "SELECT * FROM downloads ORDER BY sort_order ASC"
    ).all();

    // 返回 JSON 数据
    return new Response(JSON.stringify(result.results || []), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    // 如果出错，返回错误信息
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
