const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/indexDB_Operations.js",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0"
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

//handling install event

self.addEventListener("install", function(evt){
    console.log("install event triggered");
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Cache opened");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

//handling activate event

self.addEventListener("activate", function(evt){
    console.log("activate event triggered")
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if(key != CACHE_NAME && key != DATA_CACHE_NAME){
                        console.log("Removing the old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// handling any fetches
self.addEventListener("fetch", function(evt){
    console.log("fetch event triggered");
    console.log(evt);
    if(evt.request.url.includes("/api/")){
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request).then(response => {
                    if(response.status === 200){
                        cache.put(evt.request.url, response.clone())
                    }
                    return response;
                })
                .catch(err => {
                    console.log("Serving from service worker")
                    return cache.match(evt.request);
                });
            }).catch(err => {
                console.log(err);
            })
        );

        return;
    }

    evt.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(evt.request).then(response => {
                return response || fetch(evt.request);
            });
        })
    );
    
});
