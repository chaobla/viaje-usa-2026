// Acceso con contrasena a viaje-usa-2026.vercel.app (Vercel Routing Middleware).
// Usuario y contrasena viven en las variables de entorno SITE_USER y SITE_PASS
// del proyecto en Vercel; nunca en este repositorio.
export const config = { matcher: '/(.*)' };

export default function middleware(request) {
  var user = process.env.SITE_USER;
  var pass = process.env.SITE_PASS;
  if (!user || !pass) return; // sin variables definidas, la web sigue abierta

  var auth = request.headers.get('authorization') || '';
  if (auth.indexOf('Basic ') === 0) {
    try {
      var decoded = atob(auth.slice(6));
      var i = decoded.indexOf(':');
      var u = decoded.slice(0, i), p = decoded.slice(i + 1);
      if (u === user && p === pass) return;
    } catch (e) {}
  }
  return new Response('Acceso restringido. Cuaderno de viaje privado.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="USA 2026 - Cuaderno de viaje", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
