// functions/api/files.js
export async function onRequest(context) {
  const { env } = context;
  
  try {
    // 1. 获取所有上传的 HTML 文件（从 KV 或 html_files 表）
    // 这里假设你的文件列表存在 html_files 表中
    const filesResult = await env.DB.prepare(
      "SELECT filename, LENGTH(content) as size, created_at FROM html_files ORDER BY created_at DESC"
    ).all();
    
    // 2. 获取所有作品使用的文件链接
    const projectsResult = await env.DB.prepare(
      "SELECT link FROM projects WHERE link LIKE '/cody/%'"
    ).all();
    
    // 提取所有被引用的文件名
    const usedFiles = new Set();
    projectsResult.results.forEach(p => {
      // 从 /cody/xxx.html 中提取文件名
      const match = p.link.match(/\/cody\/(.+)$/);
      if (match) {
        usedFiles.add(match[1]);
      }
    });
    
    // 3. 组装返回数据
    const files = filesResult.results.map(f => {
      const filename = f.filename;
      const isUsed = usedFiles.has(filename);
      return {
        filename: filename,
        size: f.size || 0,
        url: `/cody/${filename}`,
        created_at: f.created_at,
        used: isUsed,
        status: isUsed ? '✅ 使用中' : '📭 未使用'
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
