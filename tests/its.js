var gws = require('../lib/gws');
var its = new gws.ITS(process.argv.USERNAME, process.argv.PASSWORD);
var queryCount = 0;

its.runInstantTest(4312306, 302, function(err, sessionId) {
	if (!err) {
		console.log(sessionId);
		queryTestResults(sessionId);
	} else {
		console.log(err);
	}
});

function queryTestResults(sessionId) {
	if (queryCount < 10) {		
		setTimeout(function() {
			its.queryTestResults(sessionId, function(err, results) {
				if (!err) {
					console.log(results);
				} else {
					console.log(err);
					
					if (err.message === 'DATA NOT READY') {
						queryTestResults(sessionId);
					}
				}
			});
			
			queryCount++;
			console.log('Query Results Try: ' + queryCount);
		}, 10000);
	} else {
		console.log('Unable to retreive results after ' + queryCount + ' tries.');
	}
}