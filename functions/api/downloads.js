// functions/api/downloads.js
export async function onRequest(context) {
  const { env } = context;

  try {
    // 从数据库获取所有下载项，按 sort_order 排序
    const result = await env.DB.prepare(
      "SELECT * FROM downloads ORDER BY sort_order ASC"
    ).all();

    return new Response(JSON.stringify(result.results || []), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}