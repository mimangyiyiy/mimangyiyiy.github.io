// functions/api/files.js
export async function onRequest(context) {
  const { env } = context;
  
  try {
    // 获取所有文件及其使用状态
    const result = await env.DB.prepare(`
      SELECT 
        h.filename,
        LENGTH(h.content) as size,
        h.created_at,
        f.project_id,
        p.title as project_title
      FROM html_files h
      LEFT JOIN file_usage f ON h.filename = f.filename
      LEFT JOIN projects p ON f.project_id = p.id
      ORDER BY h.created_at DESC
    `).all();
    
    const files = (result.results || []).map(f => {
      const isUsed = f.project_id !== null && f.project_id !== undefined;
      return {
        filename: f.filename,
        size: f.size || 0,
        url: `/cody/${f.filename}`,
        created_at: f.created_at,
        used: isUsed,
        status: isUsed ? `✅ 使用中（${f.project_title || '作品'}）` : '📭 未使用',
        project_id: f.project_id,
        project_title: f.project_title
      };
    });
    
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
