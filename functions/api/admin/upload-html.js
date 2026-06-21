// functions/api/admin/upload-html.js
// 使用 KV 存储 .html 文件

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

    // 检查文件大小（10MB）
    const fileSize = new Blob([content]).size;
    if (fileSize > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: '文件大小不能超过 10MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uniqueName = `${timestamp}-${safeName}`;

    // 保存到 KV
    await env.HTML_FILES.put(uniqueName, content);

    // 返回访问 URL
    const url = `/cody/${uniqueName}`;

    return new Response(JSON.stringify({
      success: true,
      url: url,
      fileName: uniqueName
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
