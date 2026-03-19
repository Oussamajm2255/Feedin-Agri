fetch('https://feedin-agri-production.up.railway.app/api/v1/auth/csrf').then(res => {
    console.log('Status:', res.status);
    console.log('Headers:');
    res.headers.forEach((value, name) => console.log(name, ':', value));
}).catch(console.error);
