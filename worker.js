// ============================================================
// Cloudflare Worker - 作品集后端 API
// 支持分类动态管理
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // --- CORS 处理 ---
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // ============================================================
    // 公开 API
    // ============================================================

    // --- 获取所有作品（含分类名称） ---
    if (path === '/api/projects' && method === 'GET') {
      try {
        const result = await env.DB.prepare(`
          SELECT p.*, c.name as category_name 
          FROM projects p 
          LEFT JOIN categories c ON p.category_id = c.id 
          ORDER BY p.sort_order ASC, p.created_at DESC
        `).all();
        return jsonResponse(result.results);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- 获取所有分类 ---
    if (path === '/api/categories' && method === 'GET') {
      try {
        const result = await env.DB.prepare(
          'SELECT * FROM categories ORDER BY sort_order ASC'
        ).all();
        return jsonResponse(result.results);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // ============================================================
    // 管理员 API（需要认证）
    // ============================================================

    // --- 管理员登录 ---
    if (path === '/api/admin/login' && method === 'POST') {
      const { username, password } = await request.json();
      try {
        const result = await env.DB.prepare(
          'SELECT * FROM admins WHERE username = ?'
        ).bind(username).first();
        
        if (result && result.password_hash === password) {
          const token = btoa(JSON.stringify({ 
            username, 
            exp: Date.now() + 86400000 
          }));
          return jsonResponse({ token, success: true });
        }
        return jsonResponse({ error: '用户名或密码错误' }, 401);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- 管理员验证中间件 ---
    function isAdmin(request) {
      const auth = request.headers.get('Authorization');
      if (!auth) return false;
      try {
        const token = auth.replace('Bearer ', '');
        const payload = JSON.parse(atob(token));
        return payload.exp > Date.now();
      } catch {
        return false;
      }
    }

    // --- 添加分类 ---
    if (path === '/api/admin/categories' && method === 'POST') {
      if (!isAdmin(request)) return jsonResponse({ error: '未授权' }, 401);
      const { name } = await request.json();
      if (!name || name.trim() === '') {
        return jsonResponse({ error: '分类名称不能为空' }, 400);
      }
      try {
        const result = await env.DB.prepare(`
          INSERT INTO categories (name, sort_order) 
          VALUES (?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
        `).bind(name.trim()).run();
        return jsonResponse({ id: result.meta.last_row_id, success: true });
      } catch (e) {
        if (e.message.includes('UNIQUE')) {
          return jsonResponse({ error: '分类已存在' }, 400);
        }
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- 删除分类 ---
    if (path.startsWith('/api/admin/categories/') && method === 'DELETE') {
      if (!isAdmin(request)) return jsonResponse({ error: '未授权' }, 401);
      const id = path.split('/').pop();
      try {
        // 检查是否有作品属于该分类
        const check = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM projects WHERE category_id = ?'
        ).bind(id).first();
        if (check.count > 0) {
          return jsonResponse({ 
            error: '该分类下还有作品，请先删除或转移作品' 
          }, 400);
        }
        await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- 添加作品 ---
    if (path === '/api/admin/projects' && method === 'POST') {
      if (!isAdmin(request)) return jsonResponse({ error: '未授权' }, 401);
      const { title, description, image, link, category_id } = await request.json();
      if (!title || !link) {
        return jsonResponse({ error: '标题和链接为必填项' }, 400);
      }
      try {
        const result = await env.DB.prepare(`
          INSERT INTO projects (title, description, image, link, category_id, sort_order) 
          VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM projects))
        `).bind(title, description || '', image || '', link, category_id || null).run();
        return jsonResponse({ id: result.meta.last_row_id, success: true });
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- 删除作品 ---
    if (path.startsWith('/api/admin/projects/') && method === 'DELETE') {
      if (!isAdmin(request)) return jsonResponse({ error: '未授权' }, 401);
      const id = path.split('/').pop();
      try {
        await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- 404 ---
    return new Response('Not Found', { status: 404 });
  }
};

// ============================================================
// 工具函数
// ============================================================

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
