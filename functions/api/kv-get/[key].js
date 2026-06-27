// functions/api/kv-get/[key].js
export async function onRequest(context) {
  const { request, env, params } = context;
  const key = decodeURIComponent(params.key);
  
  try {
    const value = await env.HTML_FILES.get(key);
    if (value === null) {
      return new Response(JSON.stringify({ error: '键不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({
      key: key,
      value: value,
      size: value.length,
      sizeKB: (value.length / 1024).toFixed(1) + ' KB'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}