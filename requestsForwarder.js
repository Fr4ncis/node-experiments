// FIXME: there is an issue with non-JSON payload (urlencoded)

// modules
var https = require('https');
var http = require('http');
var express = require('express');
var app;

var targetProto, targetServer, listenPort = 3000;
var statuscode, body, headers; // make them 

var start = function(target, port) {
	targetProto = target.split("://")[0];
	targetServer = target.split("://")[1];
	listenPort = port;
	
	
	// express
	app = express();

	// does not support multipart
	app.use(express.json());
	app.use(express.urlencoded());

	// forwards the request
	app.use(requestForwarder);
	
	// forward response to client
	app.use(responseForwarder);

	app.listen(listenPort);
}

var addHandle = function(path, myfunc) {
	app.stack.splice(app.stack.length-1, 0, {route: path, handle: myfunc});
	console.log(app.stack);
};

exports.start = start;
exports.addHandle = addHandle;

var requestForwarder = function requestForwarder(req, res, next) {
	request(req, function(response,data) {
		statuscode = response.statusCode;
		body = data;
		headers = response.headers;
		next();
	});
};

var responseForwarder = function responseForwarder(req, res, next) {
	res.status(statuscode).header(headers).write(body);
	res.end();
}

function request(request, callback) {
	var postData = JSON.stringify(request.body);
	if (['POST','PUT','PATCH'].indexOf(request.method) != -1) request.headers['content-Length'] = postData.length; // should test with PUT, DELETE, PATCH
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