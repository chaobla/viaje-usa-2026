/* USA 2026 - cuaderno de viaje offline
   Cachea la pagina y los recursos para que funcione sin conexion. */
var CACHE = 'usa2026-v3';
var CORE = ['./', './index.html'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(CORE).catch(function(){});
  }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  // Prevision del tiempo y tipo de cambio: siempre a la red (la pagina guarda su copia)
  if (/open-meteo\.com|currency-api/.test(req.url)) return;

  // El documento: red primero, cache como red de seguridad
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function(res){
        // Solo se guarda una respuesta buena: nunca un 401 de la contrasena
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        }
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(r){ return r || caches.match('./'); });
      })
    );
    return;
  }

  // Tipografias e imagenes: cache primero, y se guarda al vuelo
  e.respondWith(
    caches.match(req).then(function(hit){
      if (hit) return hit;
      return fetch(req).then(function(res){
        if (res && (res.status === 200 || res.type === 'opaque')) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
    })
  );
});
