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

    // 判断是否是图片（根据扩展名）
    const ext = key.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const isImage = imageExts.includes(ext);
    
    if (isImage) {
      // 图片直接返回二进制数据
      return new Response(value, {
        headers: {
          'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          'Cache-Control': 'public, max-age=31536000'
        }
      });
    } else {
      // 文本文件返回 JSON
      const text = await env.HTML_FILES.get(key);
      return new Response(JSON.stringify({
        key: key,
        value: text,
        size: text ? text.length : 0,
        sizeKB: (text ? text.length / 1024 : 0).toFixed(1) + ' KB'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
