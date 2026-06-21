// functions/api/cody/[file].js
// 动态返回上传的 .html 文件

export async function onRequest(context) {
  const { request, env, params } = context;
  const fileName = params.file;

  if (!fileName || !fileName.endsWith('.html')) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const result = await env.DB.prepare(
      'SELECT content FROM html_files WHERE filename = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(fileName).first();

    if (!result) {
      return new Response('File Not Found', { status: 404 });
    }

    return new Response(result.content, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}