self.addEventListener('install', ev => {
    self.skipWaiting();
    ev.waitUntil(caches.open('cache').then(cache => cache.addAll(List.essential)));
});
self.addEventListener('activate', ev => ev.waitUntil(clients.claim()));
self.addEventListener('fetch', ev => ev.respondWith(
    (async () => 
        caches.match(ev.request.url, {ignoreSearch: true})
        .then(cached => cached ? cached : fetch(ev.request))
        .catch(er => console.error(er))
    )()
));    
const List = {
    sets: ["fury","endure","tolerance","will","focus","doom","fight","guard","enhance","shield","expert","javelin","resist","roar","grow","sage","limit","hunt","awaken","arena","affinity","recovery","resurrect","rage","overcome","punish","protect"]
}
Object.assign(List, {
    essential: [
        '/property.jpg',
        ...List.sets.map(s => `/rune/set/${s}.webp`),
        ...[0,3,4,5,6].map(s => `/rune/shape/${s}.webp`),
    ],
});