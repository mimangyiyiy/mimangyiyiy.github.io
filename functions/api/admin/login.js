// functions/api/admin/login.js

export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "用户名和密码不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await env.DB.prepare(
      "SELECT * FROM admins WHERE username = ?"
    ).bind(username).first();

    if (user && user.password_hash === password) {
      const token = btoa(JSON.stringify({
        username,
        exp: Date.now() + 86400000
      }));
      return new Response(JSON.stringify({ token, success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ error: "用户名或密码错误" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}