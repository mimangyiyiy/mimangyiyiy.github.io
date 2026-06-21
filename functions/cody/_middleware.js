// functions/cody/_middleware.js
// 从 KV 读取 .html 文件

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const fileName = url.pathname.replace('/cody/', '');

  if (!fileName || !fileName.endsWith('.html')) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    // 从 KV 获取文件
    const content = await env.HTML_FILES.get(fileName);

    if (content === null) {
      return new Response('File Not Found', { status: 404 });
    }

    return new Response(content, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}