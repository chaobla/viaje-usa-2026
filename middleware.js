// Acceso con contrasena a viaje-usa-2026.vercel.app (Vercel Routing Middleware).
// Usuario y contrasena viven en las variables de entorno SITE_USER y SITE_PASS
// del proyecto en Vercel; nunca en este repositorio.
// Se usa un formulario propio y una cookie firmada, no el dialogo Basic Auth del
// navegador: ese dialogo no aparece cuando un service worker atiende la pagina.
export const config = { matcher: '/(.*)' };

var COOKIE = 'usa2026_auth';

async function token(u, p) {
  var data = new TextEncoder().encode(u + ':' + p + ':usa2026-cuaderno');
  var h = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(h)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function getCookie(req, name) {
  var c = req.headers.get('cookie') || '';
  var m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}

function loginPage(error) {
  var html = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<meta name="robots" content="noindex,nofollow"><title>USA 2026 &middot; Cuaderno de viaje</title>' +
    '<style>' +
    'html{background:#14110f}body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:-apple-system,BlinkMacSystemFont,"Inter",Segoe UI,Roboto,sans-serif;color:#f4f0e6;padding:24px;box-sizing:border-box}' +
    '.card{width:min(100%,380px);background:#f4f0e6;color:#14110f;padding:36px 32px 30px;border:1px solid rgba(20,17,15,.2);box-shadow:0 30px 60px rgba(0,0,0,.45)}' +
    '.k{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#a83410;margin:0 0 14px}' +
    'h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:34px;line-height:1;margin:0 0 6px;letter-spacing:-.02em}h1 em{font-style:italic;color:#cf4318}' +
    'p{font-size:14px;line-height:1.5;color:#5a534b;margin:0 0 26px}' +
    'label{display:block;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7a7167;margin:0 0 6px}' +
    'input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:12px 12px;border:1px solid rgba(20,17,15,.35);background:#faf7ee;color:#14110f;margin:0 0 16px;border-radius:0}' +
    'input:focus{outline:2px solid #cf4318;outline-offset:1px}' +
    'button{width:100%;font:inherit;font-size:14px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:14px;border:0;background:#14110f;color:#f4f0e6;cursor:pointer}' +
    'button:hover{background:#cf4318}' +
    '.err{background:#cf4318;color:#fff;font-size:13px;padding:10px 12px;margin:-6px 0 18px}' +
    '.f{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#7a7167;margin:22px 0 0;text-align:center}' +
    '</style></head><body><form class="card" method="post" action="/login" autocomplete="on">' +
    '<p class="k">28 sept &mdash; 8 oct 2026 &middot; Madrid &middot; Orlando &middot; Nueva York</p>' +
    '<h1>Once d&iacute;as<br>en el <em>otro</em><br>continente.</h1>' +
    '<p>Cuaderno de viaje privado. Entra con tu usuario y tu contrase&ntilde;a.</p>' +
    (error ? '<div class="err">Usuario o contrase&ntilde;a incorrectos.</div>' : '') +
    '<label for="u">Usuario</label><input id="u" name="u" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" required>' +
    '<label for="p">Contrase&ntilde;a</label><input id="p" name="p" type="password" autocomplete="current-password" required>' +
    '<button type="submit">Entrar</button>' +
    '<p class="f">USA &middot; 2026 &middot; Cuaderno</p>' +
    '</form></body></html>';
  return new Response(html, {
    status: error ? 401 : 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export default async function middleware(request) {
  var user = process.env.SITE_USER;
  var pass = process.env.SITE_PASS;
  if (!user || !pass) return; // sin variables definidas, la web sigue abierta

  var url = new URL(request.url);
  var want = await token(user, pass);

  if (request.method === 'POST' && url.pathname === '/login') {
    var f;
    try { f = new URLSearchParams(await request.text()); } catch (e) { f = new URLSearchParams(''); }
    var u = (f.get('u') || '').trim();
    var p = f.get('p') || '';
    if (u.toLowerCase() === user.trim().toLowerCase() && p === pass) {
      return new Response(null, {
        status: 303,
        headers: {
          'Location': '/',
          'Set-Cookie': COOKIE + '=' + want + '; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax',
          'Cache-Control': 'no-store'
        }
      });
    }
    return loginPage(true);
  }

  if (getCookie(request, COOKIE) === want) return;
  return loginPage(false);
}
