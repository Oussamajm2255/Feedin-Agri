fetch('https://feedin-agri-production.up.railway.app/api/v1/auth/csrf', {
    method: 'OPTIONS',
    headers: { 'Origin': 'https://feedingreen.com', 'Access-Control-Request-Method': 'GET' }
}).then(r => {
    console.log("Status:", r.status);
    console.log("Headers:", Object.fromEntries(r.headers.entries()));
}).catch(e => console.error(e));
