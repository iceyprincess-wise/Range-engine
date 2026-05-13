const https = require('https');

// NOTE: YOU MUST PASTE YOUR RAPIDAPI KEY IN THE OPTIONS BELOW
const options = {
  hostname: 'basketapi1.p.rapidapi.com',
  path: '/api/basketball/match/16056532/statistics',
  method: 'GET',
  headers: {
    'x-rapidapi-key': 'f0f8830be9msh33c27594430acdbp174a46jsn212686e527a0', 
    'x-rapidapi-host': 'basketapi1.p.rapidapi.com'
  }
};

const req = https.request(options, (res) => {
  let chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.on('error', (e) => console.error(e));
req.end();
