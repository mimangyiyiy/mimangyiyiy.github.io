// functions/api/kv-delete/[key].js
export async function onRequest(context) {
  const { request, env, params } = context;
  const key = decodeURIComponent(params.key);
  
  try {
    await env.HTML_FILES.delete(key);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}