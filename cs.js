var reqforwarder = require('./requestsForwarder');
var utils = require('./utils');
var cookie; // stores cookie, not persistent

reqforwarder.start('https://api.couchsurfing.org',3019);

// session is stored on the proxy server
reqforwarder.appendHandler('/sessions', function getCookies(req,res,next) {
	if (reqforwarder.statusCode == 200) {
		var cookieString = "";
		for(var i = 0; i < reqforwarder.headers['set-cookie'].length; i++)
			cookieString += reqforwarder.headers['set-cookie'][i].split(";").shift()+ "; ";
		cookie = cookieString.substr(0,cookieString.length-2);
	}
	next();
});

var xpath = require('xpath'), dom = require('xmldom').DOMParser;
reqforwarder.appendHandler({match:/\/msearch.*/}, function getCookies(req,res,next) {	
	zlib.gunzip(reqforwarder.body, function(err, decoded) {
		// console.log(decoded);
		// console.log(typeof decoded);
		var doc = new dom().parseFromString(decoded.toString());
		var part = xpath.select("//*[@class="results"]", doc);
		var names = xpath.select("//h2", part);
		var images = xpath.select("//img", part);
		console.log(nodes); 
	});
	next();
});

// reqforwarder.appendHandler({unmatch:/users\/(\d*)\/.*/}, function getCookies(req,res,next) {	
// 	console.log('unmatch user');
// 	next();
// });

// for debugging purposes

var zlib = require('zlib');
// reqforwarder.appendHandler('', function printOut(req, res, next) {
// 	if (req.originalUrl == '/sessions') { next(); return; }
// 	
// 	zlib.gunzip(reqforwarder.body, function(err, decoded) {
// 	    console.log("Response: "+decoded);
// 	});
// 	
// 	next();
// });

reqforwarder.prependHandler({exclude: '/sessions'}, function setCookies(req,res,next) {
	req.headers = utils.headers;
	req.headers['Cookie'] = cookie;
	next();
});