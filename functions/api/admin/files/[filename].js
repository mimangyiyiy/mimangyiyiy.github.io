export async function onRequest(context) {
  const { request, env, params } = context;
  const auth = request.headers.get('Authorization');
  if (!auth || !isAdmin(auth)) {
    return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
  }
  
  const filename = decodeURIComponent(params.filename);
  try {
    await env.DB.prepare('DELETE FROM html_files WHERE filename = ?').bind(filename).run();
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