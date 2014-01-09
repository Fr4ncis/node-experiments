var reqforwarder = require('./requestsForwarder');
reqforwarder.start('https://api.couchsurfing.org',3000);
reqforwarder.addHandle('', function(req,res,next) {
	console.log('handle this!');
	next();
});