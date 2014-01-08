// modules
var https = require('https');
var zlib = require('zlib');
var redis = require("redis").createClient();

// express
var express = require('express');
var app = express();

app.use(express.json());
app.use(express.urlencoded());

app.post('/login', function(req, res) {
	if (!(req.body.username && req.body.password)) {
		res.status(401).end();
		return;
	}
	
	loginReq(req.body, function(response,data) {
		res.status(response.statusCode).header(response.headers).write(data);
		res.end();
	});
});

app.listen(3000);

// var replay = require("replay");

//var credentials = {username: "mac@fr4ncis.net", password: "miaomiao"};

String.prototype.hashcode = function(){
	var string = this;
    var hash = 0;
    if (string.length == 0) return hash;
    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash;
    }

    return hash;
}


function extend(obj, x) {
	for (var i in x)
	{
		if (typeof(x[i]) != "object") {
			obj[i] = x[i];
		}
		else
		{
			extend(obj[i],x[i]);
		}
	}
};

var processArgs = process.argv.splice(2);
if (processArgs.length > 0) {
	for (var i in processArgs) {
		switch (processArgs[i]) {
		    case "login": login(); break;
		    case "messages": requestMessages(); break;
		    case "couchrequests": couchRequests(); break;
		    case "sendcouchreq": sendCouchRequest(); break;
		    case "friends": getFriends(); break;
			case "msearch": mobileSearch(); break;
		}
	}
}

function evalprocessArgs() {
	if (processArgs.indexOf("login") > -1) login();
}

function getCookie(callback) {
	var hash = JSON.stringify(credentials).hashcode();
	redis.mget('cookie'+hash, 'user'+hash, function(err,reply) {
	if (reply)
		callback.apply(this, reply);
	else
		login(callback);
	});
}

function log(arguments) {
	if (processArgs.indexOf("s") == -1) console.log(arguments);
}

function baseOptions(hashArgs) {
	var options = {
		host: 'api.couchsurfing.org',
		method: 'GET',
		port: 443,
		headers: {
		  'Content-Type':'application/json',
		  'Accept-Language': 'en-gb',
		  'X-Client-Version':'platform=iphone;version=1.4.3',
		  'Accept':'application/vnd.couchsurfing-v1+json',
		  'Accept-Encoding':'gzip, deflate',
		  'User-Agent':'CouchSurfing/1.4.3 CFNetwork/672.0.8 Darwin/14.0.0',
		}
	};
	
	extend(options, hashArgs);
	
	return options;
}

function loginReq(credentials, callback) {
	console.log("login request");
	console.log(credentials);
	var postData = JSON.stringify(credentials);
	var options = baseOptions({headers: {"Content-Length": postData.length}, method:"POST", path: "/sessions"});
	
	var req = https.request(options, function(res) {
		console.log(res.headers);
		res.on('data', function(data) {
			console.log("login response.. "+res.body);
			callback(res,data);
		});
	});
	
	req.write(postData);
	req.end();
}

function login(callback) {
	process.stdout.write("Login.. ");
	var postData = JSON.stringify(credentials);

	var options = baseOptions({headers: {"Content-Length": postData.length}, method:"POST", path: "/sessions"});
	
	var req = https.request(options, function(res) {
	  log(res.statusCode);

	  res.on('data', function(data) {
	    if (res.statusCode == 200) {
			var profileLink = JSON.parse(data.toString())["links"]["profile"];
			var userProfileId = profileLink.match(/[\D]*(\d+)[\D]*/)[1];

			var hash = JSON.stringify(credentials).hashcode();
			redis.set("cookie"+hash,parseCookie(res));
			redis.set("user"+hash,userProfileId);
			log("User: "+userProfileId);
			log("Cookie: "+parseCookie(res));
			if (callback) getCookie(callback);
		}
	  });
	});
	
	req.write(postData);
	req.end();

	req.on('error', function(e) {
	  console.error(e);
	});
}

function parseCookie(res) {
	var cookieString = "";
	
	for(var i = 0; i < res.headers['set-cookie'].length; i++)
		cookieString += res.headers['set-cookie'][i].split(";").shift()+ "; ";
		
	cookieString = cookieString.substr(0,cookieString.length-2);
	return cookieString;
}

function mobileSearch() {
	var options = baseOptions({})
}

function sendCouchRequest()
{
	getCookie(function(cookie, userId) {
		var postData = JSON.stringify({
			arrival_flexible: false,
			number: 1,
			threads: [{message: "this is a fake request", user_is_sender: true, date: (new Date()).toJSON()}],
			date_modified: (new Date()).toJSON(),
			departure_flexible: false,
			host_user: "https://api.couchsurfing.org/users/1088161",
			surfer_user: "https://api.couchsurfing.org/users/1004052548",
			departure: "2014-01-17T00:00:00Z",
			arrival: "2014-01-13T00:00:00Z"
		});
		
		var options = baseOptions({headers: {"Cookie": cookie, "Content-Length": postData.length}, method: 'POST', path: '/couchrequests'});
		process.stdout.write("Send couch request.. ");

		var req = https.request(options, function(res) {
			log(res.statusCode);

			res.on('data', function(chunk) {
				if (res.statusCode == 200) {
					zlib.gunzip(chunk, function(err, decoded) {
					    log("Response: "+decoded);
						process.exit(0);
					});
				}
			});
		});
		
		req.write(postData);
		

		req.end();	
	});
}

function couchRequests()
{
	getCookie(function(cookie, userId) {
		var options = baseOptions({headers: {"Cookie": cookie}, method: 'GET', path: '/users/'+userId+'/couchrequests?since=0&expand=couchrequests,users'});
		process.stdout.write("Get couch requests.. ");
		
		var req = https.request(options, function(res) {
			log(res.statusCode);

			res.on('data', function(chunk) {
				if (res.statusCode == 200) {
					zlib.gunzip(chunk, function(err, decoded) {
					    log("Response: "+decoded);
						process.exit(0);
					});
				}
			});
		});
		
		req.end();
	});
}

function getFriends()
{
	getCookie(function(cookie, userId) {
		var options = baseOptions({headers: {"Cookie": cookie}, method: 'GET', path: '/users/'+userId+'/friends?expand=users'});
		process.stdout.write("Get friends.. ");
		
		var req = https.request(options, function(res) {
			log(res.statusCode);

			res.on('data', function(chunk) {
				if (res.statusCode == 200) {
					zlib.gunzip(chunk, function(err, decoded) {
					    log("Response: "+decoded);
						process.exit(0);
					});
				}
			});
		});
		
		req.end();
	});
}

function requestMessages()
{	
	getCookie(function(cookie, userId) {
		var options = baseOptions({headers: {"Cookie": cookie}, method: 'GET', path: '/users/'+userId+'/messages?since=0&type=pm'});
		process.stdout.write("Get messages.. ");

		var req = https.request(options, function(res) {
			log(res.statusCode);

			res.on('data', function(chunk) {
				if (res.statusCode == 200) {
					zlib.gunzip(chunk, function(err, decoded) {
					    log("Response: "+decoded);
						process.exit(0);
					});
				}
			});
		});
		
		req.end();	
	});
}