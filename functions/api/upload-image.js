// functions/api/admin/upload-image.js
// 上传图片到 KV
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
    const { fileName, data, contentType } = await request.json();

    if (!fileName || !data) {
      return new Response(JSON.stringify({ error: '文件名和数据不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 将 base64 转为 Uint8Array
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 保存到 KV
    await env.HTML_FILES.put(fileName, bytes, {
      httpMetadata: {
        contentType: contentType || 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    return new Response(JSON.stringify({
      success: true,
      fileName: fileName,
      url: `/api/kv-get/${fileName}`
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
