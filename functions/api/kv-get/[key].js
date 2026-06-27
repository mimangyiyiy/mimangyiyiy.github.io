// functions/api/kv-get/[key].js
export async function onRequest(context) {
  const { env, params } = context;
  const key = decodeURIComponent(params.key);
  
  try {
    const value = await env.HTML_FILES.get(key);
    if (value === null) {
      return new Response(JSON.stringify({ error: '文件不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ext = key.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const isImage = imageExts.includes(ext);
    
    if (isImage) {
      return new Response(value, {
        headers: {
          'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          'Cache-Control': 'public, max-age=31536000',
          'Content-Length': value.length.toString()  // ✅ 添加这一行
        }
      });
    } else {
      const text = await env.HTML_FILES.get(key);
      const jsonData = JSON.stringify({
        key: key,
        value: text,
        size: text ? text.length : 0,
        sizeKB: (text ? text.length / 1024 : 0).toFixed(1) + ' KB'
      });
      return new Response(jsonData, {
        headers: { 
          'Content-Type': 'application/json',
          'Content-Length': jsonData.length.toString()  // ✅ 添加这一行
        }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
