// functions/api/files.js
export async function onRequest(context) {
  const { env } = context;
  
  try {
    // 先检查表是否存在
    const tableCheck = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='html_files'"
    ).first();
    
    if (!tableCheck) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare(
      "SELECT filename, LENGTH(content) as size, created_at FROM html_files ORDER BY created_at DESC"
    ).all();
    
    const files = (result.results || []).map(f => ({
      filename: f.filename,
      size: f.size || 0,
      url: `/cody/${f.filename}`,
      created_at: f.created_at
    }));
    
    return new Response(JSON.stringify(files), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('文件列表加载失败:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
