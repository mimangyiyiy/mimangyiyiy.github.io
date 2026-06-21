// functions/api/admin/upload-file.js
// 上传 .html 作品文件到 Pages 的 assets 目录

export async function onRequest(context) {
  const { request, env } = context;

  // 验证管理员身份
  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const fileName = formData.get('fileName') || file.name;

    // 只允许 .html 文件
    if (!file.name.endsWith('.html') && !fileName.endsWith('.html')) {
      return new Response(JSON.stringify({ error: '只允许上传 .html 文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 限制文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: '文件大小不能超过 2MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 读取文件内容
    const content = await file.text();

    // 这里你需要将文件内容保存到某个存储中
    // 由于 Pages Functions 无法直接写入文件系统，你需要使用 KV 或 R2
    // 或者存到数据库的 TEXT 字段中

    // 方案A：存到 D1 数据库（适合小文件）
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
