// functions/api/admin/upload-html.js
export async function onRequest(context) {
  const { request, env } = context;

  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { fileName, content } = await request.json();

    if (!fileName || !content) {
      return new Response(JSON.stringify({ error: '文件名和内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!fileName.endsWith('.html')) {
      return new Response(JSON.stringify({ error: '只支持 .html 文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 保存到数据库
    const result = await env.DB.prepare(`
      INSERT INTO html_files (filename, content, created_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(fileName, content).run();

    return new Response(JSON.stringify({
      success: true,
      url: `/cody/${fileName}`,
      id: result.meta.last_row_id
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function isAdmin(auth) {
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
