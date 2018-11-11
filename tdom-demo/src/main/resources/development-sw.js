
const urlSuffix = '!tdom';
let parserModule = null;

self.addEventListener('install', function(event) {
	event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', function(event) {
	event.waitUntil(self.clients.claim());
	parserModule = null;
});

self.addEventListener('fetch', function(event) {
	var url = event.request.url;
	if (event.clientId == null || url.indexOf(urlSuffix) != url.length - urlSuffix.length) {
		return;
	}
	event.respondWith(new Promise((resolve, reject) => {
		(async () => {
			if (parserModule == null) {
				parserModule = await importModule('./lib/tdom/parser.js');
			}
			var realUrl = url.substring(0, url.length - urlSuffix.length);
			var originalResponse = await fetch(realUrl);
			if (originalResponse.status !== 200) {
				resolve(originalResponse);
				return;
			}
			var newHeaders = {};
			for (var [k, v] of originalResponse.headers) {
				if (k.toLowerCase() === 'content-type') {
					v = 'application/javascript';
				}
				newHeaders[k] = v;
			}
			var responseText = await originalResponse.text();
			resolve(new Response(parserModule.parse(responseText), {
				status : originalResponse.status,
				statusText : originalResponse.statusText,
				headers : newHeaders
			}));

		})().catch(e => reject(e));
	}));
});

async function importModule(url) {
	var moduleText = await (await fetch(url)).text();
	moduleText = moduleText.replace(/export default \{/g, 'return {');
	return new Function(moduleText)();
}