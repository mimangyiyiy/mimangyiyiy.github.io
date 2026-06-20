// functions/_middleware.js
// 这个文件会处理所有 API 请求的跨域问题

export async function onRequest(context) {
  const { request, next } = context;
  
  // 处理预检请求（OPTIONS）
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 执行实际的请求
  const response = await next();
  
  // 给响应添加跨域头
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}