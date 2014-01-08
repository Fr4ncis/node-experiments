var http = require('http');
var postData = "";
	
var req = http.request({host: 'www.google.it', method: 'get', path: '/', port: 80}, function(res) {
	res.on('data', function(data) {
		console.log("response.. "+data);
	});
	
	res.on('end', function(data) {
		console.log("response.. "+res.statusCode);
	});
});

if (postData) req.write(postData);
req.end();

req.on('error', function(e) {
  console.error(e);
});