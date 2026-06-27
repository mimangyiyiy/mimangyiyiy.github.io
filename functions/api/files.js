export async function onRequest(context) {
  const { env } = context;
  try {
    const result = await env.DB.prepare(
      "SELECT filename, LENGTH(content) as size, created_at FROM html_files ORDER BY created_at DESC"
    ).all();
    const files = result.results.map(f => ({
      filename: f.filename,
      size: f.size,
      url: `/cody/${f.filename}`,
      created_at: f.created_at
    }));
    return new Response(JSON.stringify(files), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
