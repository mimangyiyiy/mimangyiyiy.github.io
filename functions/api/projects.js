// functions/api/projects.js

export async function onRequest(context) {
  const { env } = context;
  
  try {
    const result = await env.DB.prepare(`
      SELECT p.*, c.name as category_name 
      FROM projects p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.sort_order ASC, p.created_at DESC
    `).all();
    
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