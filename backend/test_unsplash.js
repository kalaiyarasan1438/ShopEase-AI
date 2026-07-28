const https = require('https');

function fetchUnsplash(query) {
    const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const match = data.match(/"id":"([a-zA-Z0-9_\-]+)","slug":/);
            if (match) {
                console.log(`Query: ${query} -> ID: ${match[1]}`);
            } else {
                console.log(`Query: ${query} -> Not found`);
            }
        });
    }).on('error', err => console.error(err));
}

fetchUnsplash('smartwatch');
fetchUnsplash('gaming keyboard');
