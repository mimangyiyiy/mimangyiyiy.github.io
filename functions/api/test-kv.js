// functions/api/test-kv.js
export async function onRequest(context) {
  const { env } = context;
  
  if (!env.HTML_FILES) {
    return new Response('❌ KV 未绑定！', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  try {
    // 写入测试数据
    await env.HTML_FILES.put('test-key', 'Hello from KV!');
    // 读取测试数据
    const value = await env.HTML_FILES.get('test-key');
    
    return new Response(`✅ KV 连接成功！\n写入并读取的值: ${value}`, {
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (e) {
    return new Response(`❌ 错误: ${e.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
