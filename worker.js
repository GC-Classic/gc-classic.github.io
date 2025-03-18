self.addEventListener('install', ev => {
    self.skipWaiting();
    ev.waitUntil(caches.open('cache').then(cache => cache.addAll(List.essential)));
});
self.addEventListener('activate', ev => ev.waitUntil(clients.claim()));
self.addEventListener('fetch', ev => ev.respondWith(
    (async () => 
        caches.match(ev.request.url, {ignoreSearch: true})
        .then(cached => cached ? goFetch(ev.request.url) && cached : goFetch(ev.request.url))
        .catch(er => console.error(er))
    )()
));
const goFetch = url =>
    fetch(new Request(url, url.includes('google') ? {mode: 'no-cors'} : {}))
    .then(resp => resp.status == 200 && (url.includes(location.host) || url.includes('aeoq')) ? 
        caches.open('cache').then(cache => cache.add(url.replace(/[?#].*$/, ''), resp.clone())).then(() => resp) : 
        resp
    );
    
const List = {
    sets: ["fury","endure","tolerance","will","focus","doom","fight","guard","enhance","shield","expert","javelin","resist","roar","grow","sage","limit","hunt","awaken","arena","affinity","recovery","resurrect","rage","overcome","punish","protect"]
}
Object.assign(List, {
    essential: [
        ...List.sets.map(s => `/rune/set/${s}.webp`),
        ...[0,3,4,5,6].map(s => `/rune/shape/${s}.webp`),
    ],
});