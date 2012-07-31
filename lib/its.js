// Include modules
var http = require('http')
	, util = require('util')
 	, EventEmitter = require('events').EventEmitter
	, request = require('request')
	, xml2js = require('xml2js');
	
var ITS = function(username, password) {	
	// Set class variables
	this.username = username;
	this.password = password;
	
	// Inherit EventEmitter
	EventEmitter.call(this);

	return this;
}

util.inherits(ITS, EventEmitter);
module.exports = ITS;

ITS.prototype.runInstantTest = function(monitorId, siteId, callback) {
	var self = this;
	
	if (callback != null && typeof callback === "function") {
		self.on('error', function(err) {
			self.removeAllListeners();
			return callback(err);
		});
	
		self.on('sessionId', function(sessionId, testTime) {
			self.removeAllListeners();
			return callback(null, sessionId, testTime);
		});
	}
	
	var uri = "http://gpn.webservice.gomez.com/GpnInstantTestService_40/GpnInstantTestService.asmx/RunMonitorFromIdUsingOverride_Async?"
			+ "sUserName=" + this.username
			+ "&sPassword=" + this.password
			+ "&iMonitorId=" + monitorId
			+ "&iSiteId=" + siteId;
	
	request(uri, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			// Parse response body
			var parser = new xml2js.Parser();

			parser.parseString(body, function (err, result) {
				if(!err) {
					var status = result.status.status;
					
					if (status === 'SUCCESS') {
						var sessionId = result.sessionId
							, testTime = result.testTime;
						
						self.emit('sessionId', sessionId, testTime);
					} else {
						var errMsg = result.status.errorMessage;

						self.emit('error', new Error(errMsg));
					}
				} else {
					self.emit('error', new Error(err));
				}
			});
		}
	});
}

ITS.prototype.queryTestResults = function(sessionId, callback) {
	var self = this;
	
	if ((callback != null) && typeof callback === "function") {
		self.on('error', function(err) {
			self.removeAllListeners();
			return callback(err);
		
		});
	
		self.on('results', function(data) {
			self.removeAllListeners();
			return callback(null, data);
		});
	}
	
	var uri = "http://gpn.webservice.gomez.com/GpnInstantTestService_40/GpnInstantTestService.asmx/QueryAsyncResult?"
			+ "sUserName=" + this.username
			+ "&sPassword=" + this.password
			+ "&sSessionId=" + sessionId;
			
	request(uri, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			// Parse response body
			var parser = new xml2js.Parser();

			parser.parseString(body, function (err, result) {
				if(!err) {
					var status = result.status.status;

					if (status == 'SUCCESS') {
						var data = result.responseMsg;
						
						parser.parseString(data, function(err, result) {
							if (!err) {
								self.emit('results', result);
							} else {
								self.emit('error', err);
							}
						});	
					} else {
						var errMsg = result.status.errorMessage;
						
						self.emit('error', new Error(errMsg));
					}
				} else {
					self.emit('error', err);
				}
			});
		}
	});
}