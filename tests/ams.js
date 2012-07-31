var gws = require('../lib/gws');
var ams = new gws.AMS(process.argv.USERNAME, process.argv.PASSWORD);

ams.getAccountInfo(function(err, results) {
	if (!err) {
		console.log(results);
	} else {
		console.log(err);
	}
});

ams.getMonitorInfo('backbone', function(err, results) {
	if (!err) {
		console.log(results);
	} else {
		console.log(err);
	}
});