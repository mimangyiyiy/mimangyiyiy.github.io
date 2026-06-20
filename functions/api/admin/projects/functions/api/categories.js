// functions/api/categories.js

export async function onRequest(context) {
  const { env } = context;
  
  try {
    const result = await env.DB.prepare(
      "SELECT * FROM categories ORDER BY sort_order ASC"
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