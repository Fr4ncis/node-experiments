var https = require('https');
var zlib = require('zlib');
var redis = require("redis").createClient();

redis.get("cookie", function(err,reply) {
	if (reply)
		requestMessages(reply);
	else
		login();
});


function login() {
	console.log("Logging in..");
	var postData = JSON.stringify({
	  "username":"mac@fr4ncis.net",
	  "password":"miaomiao"
	});

	var options = {
		host: 'api.couchsurfing.org',
	 	path: '/sessions',
		method: 'POST',
		port: 443,
		headers: {
		  'Content-Type':'application/json',
		  'Content-Length': postData.length,
		  'Accept-Language': 'en-gb',
		  'X-Client-Version':'platform=iphone;version=1.4.3',
		  'Accept':'application/vnd.couchsurfing-v1+json',
		  'Accept-Encoding':'gzip, deflate',
		  'User-Agent':'CouchSurfing/1.4.3 CFNetwork/672.0.8 Darwin/14.0.0',
		}
	};
	
	var req = https.request(options, function(res) {
	  console.log("Login status: ", res.statusCode);

	  res.on('data', function(d) {
	    if (res.statusCode == 200) {
			var cookieString = "";
			for(var i = 0; i < res.headers['set-cookie'].length; i++)
				cookieString += res.headers['set-cookie'][i].split(";").shift()+ "; ";

			redis.set("cookie",cookieString.substr(0,cookieString.length-2));
			requestMessages(cookieString);
		}
	  });
	});
	
	req.write(postData);
	req.end();

	req.on('error', function(e) {
	  console.error(e);
	});
}

function requestMessages(cookie)
{	
	console.log("Cookie: "+cookie);
	var optionsGet = {
		host: 'api.couchsurfing.org',
	 	path: '/users/1004052548/messages?since=0&type=pm',
		method: 'GET',
		port: 443,
		headers: {
		  'Content-Type':'application/json',
		  'Accept-Language': 'en-gb',
		  'Cookie':cookie,
		  'X-Client-Version':'platform=iphone;version=1.4.3',
		  'Accept':'application/vnd.couchsurfing-v1+json',
		  'Accept-Encoding':'gzip, deflate',
		  'User-Agent':'CouchSurfing/1.4.3 CFNetwork/672.0.8 Darwin/14.0.0'
		}
	};
	
	var req2 = https.request(optionsGet, function(res) {
		console.log("Messages status: ", res.statusCode);

		res.on('data', function(chunk) {
			if (res.statusCode == 200) {
				zlib.gunzip(chunk, function(err, decoded) {
				    console.log("Response: "+decoded.toString());
					process.exit(code=0);
				});
			}
		});
	});

	req2.end();	
}