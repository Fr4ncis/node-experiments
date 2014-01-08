// modules
var https = require('https');
var http = require('http');

// handle arguments
var targetProto, targetServer, listenPort = 3000;
(function () {
	var processArgs = process.argv.splice(2);
	if (processArgs.length > 0) {
		targetProto = processArgs[0].split("://")[0];
		targetServer = processArgs[0].split("://")[1];
	}
	if (processArgs.length > 1)  {
		listenPort = processArgs[1];
	}
})();

// express
var express = require('express');
var app = express();

// does not support multipart
app.use(express.json());
app.use(express.urlencoded());

app.all('*', function(req, res) {
	request(req, function(response,data) {
		res.status(response.statusCode).header(response.headers).write(data);
		res.end();
	});
});

app.listen(listenPort);

function request(request, callback) {
	var postData = JSON.stringify(request.body);
	if (request.method == 'POST') request.headers['content-Length'] = postData.length; // should test with PUT, DELETE, PATCH
	var options = baseOptions(request);
	var requester = (targetProto=="http"?http:https);
			
	process.stdout.write("("+targetProto+"://"+targetServer+options.path+") request..");
	
	var req = requester.request(options, function(res) {
		console.log(res.statusCode);
		res.on('data', function(data) {
			callback(res,data);
		});
	});
	
	req.write(postData);
	req.end();
	
	// in case of various errors (usually errors lower than HTTP)
	req.on('error', function(e) {
	  console.error(e);
	  callback({statusCode: 500, headers: ""}, "");
	});
}

function baseOptions(request) {
	var options = {
		host: targetServer,
		method: request.method,
		path: request.url,
		port: (targetProto=="http"?80:443)
	};
	
	delete request.headers.host;
	options.headers = request.headers;
			
	return options;
}