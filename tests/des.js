var gws = require('gomez-ws');

var gds = new gws.DataExport(process.argv.USERNAME, process.argv.PASSWORD);

var options = {
	"monitorIDs": process.argv.MONITOR_ID,
	"startTime": "2012-07-27 00:00:00",
	"endTime": "2012-07-28 00:00:00"
}

gds.getData(options, function(err, data) {
	if (!err) {
		console.log(data);
	} else {
		console.log(err);
	}
});

gds.on('sessionOpened', function(sessionToken) {
	console.log(sessionToken)
});

gds.on('dataReceived', function(data) {
	console.log('so');
});

gds.on('error', function(err) {
	console.log(err);
});