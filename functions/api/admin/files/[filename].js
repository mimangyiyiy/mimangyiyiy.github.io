// functions/api/admin/files/[filename].js
export async function onRequest(context) {
  const { request, env, params } = context;
  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
  }
  
  const filename = decodeURIComponent(params.filename);
  
  try {
    // 检查文件是否正在被使用
    const usage = await env.DB.prepare(
      'SELECT project_id FROM file_usage WHERE filename = ? AND project_id IS NOT NULL'
    ).bind(filename).first();
    
    if (usage && usage.project_id) {
      return new Response(JSON.stringify({ 
        error: '该文件正在被作品使用，请先删除对应的作品' 
      }), { status: 400 });
    }
    
    // 从 KV 删除文件
    await env.HTML_FILES.delete(filename);
    // 从数据库删除记录
    await env.DB.prepare('DELETE FROM html_files WHERE filename = ?').bind(filename).run();
    // 从 file_usage 删除记录
    await env.DB.prepare('DELETE FROM file_usage WHERE filename = ?').bind(filename).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

function isAdmin(auth) {
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch { return false; }
}
