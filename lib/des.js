// Include modules
var http = require('http')
	, util = require('util')
 	, EventEmitter = require('events').EventEmitter
	, request = require('request')
	, xml2js = require('xml2js');

var DSClient = function (username, password) {
	// Inherit EventEmitter
	EventEmitter.call(this);
	
	// Set class variables
	this.username = username;
	this.password = password;
	
	return this;
}

util.inherits(DSClient, EventEmitter);
module.exports = DSClient;

DSClient.prototype.getData = function(options, callback) {
	var self = this;
	var _sessionToken = null;

	// Open Data Feed
	self.openDataFeed(options);
	
	// Retrieve Data
	self.on('sessionOpened', function(sessionToken) {
		_sessionToken = sessionToken;
		self.getResponseData(_sessionToken);
	});
	
	// Close Feed
	self.on('dataReceived', function(data) {
		self.closeDataFeed(_sessionToken);
		if (callback) callback(null, data);
	});
	
	self.on('error', function(err) {
		if (_sessionToken) {
			self.closeDataFeed(_sessionToken);
		}
		
		if (callback) callback(err);
	});
}

DSClient.prototype.openDataFeed = function(options, callback) {
	var self = this;
	
	if (!options) options = {}
	
	if (options.monitors) {
		if (typeof options.monitors === 'number') {
			options.monitors = [options.monitors]; // convert to array
		}
		
		options.monitors = options.monitors.join();
	} else { 
		self.emit('error', new Error('Monitor option is a required argument'));
	}
	
	if (options.sites) {
		if (typeof options.sites === 'number') {
			options.sites = [options.sites]; // convert to array
		}
	}
	
	if (!options.startTime) {
		var d = new Date(); // Today's date
		options.startTime = d.toISOString(); 
	}
	
	if (!options.endTime) {
		var d = new Date();
		var nd = new Date(d.setDate(d.getDate() + 1)); // Tomorrow's date
		options.endTime = d.toISOString();
	}
	
	if (!options.class) options.class = 'BROWSERTX';
	if (!options.order) options.order = 'TIME';
	if (!options.data) options.data = 'ALL';
	
	var xml = '<?xml version="1.0" encoding="UTF-8"?>' + 
						'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://gomeznetworks.com/webservices/">' +
						   '<soapenv:Header/>' +
						   '<soapenv:Body>' +
						      '<web:OpenDataFeed3>' +
						         '<web:sUsername>' + this.username + '</web:sUsername>' +
						         '<web:sPassword>' + this.password + '</web:sPassword>' +
						         '<web:iMonitorIdSet>' +
						            '<web:int>' + options.monitors + '</web:int>' +
						         '</web:iMonitorIdSet>' +
						         '<web:sMonitorClassDesignator>' + options.class + '</web:sMonitorClassDesignator>' +
						         '<web:sStartTime>' + options.startTime + '</web:sStartTime>' +
						         '<web:sEndTime>' + options.endTime + '</web:sEndTime>' +
										 '<web:sOrderDesignator>' + options.order + '</web:sOrderDesignator>' +
						         '<web:sDataDesignator>' + options.data + '</web:sDataDesignator>' +
						      '</web:OpenDataFeed3>' +
						   '</soapenv:Body>' +
						'</soapenv:Envelope>';
	
	var reqOptions = {
		url: "http://gpn.webservice.gomez.com/DataExportService40/GpnDataExportService.asmx",
		method: "POST",
		headers: {
			"SOAPAction": "http://gomeznetworks.com/webservices/OpenDataFeed3",
			"Content-type": "text/xml;charset=UTF-8",
		},
		body: xml		
	}
	
	try {
		var req = request(reqOptions, function(err, response) {	
			if (!err && response.statusCode == 200) {
				var body = response.body;
			
				// Parse XML to object	
				var parser = new xml2js.Parser();
		
				parser.parseString(body, function (error, result) {
					if (status = result["soap:Body"]["OpenDataFeed3Response"]["GpnOpenUtaDataFeedResponse"]["Status"]["eStatus"]) {	
						if (status == "STATUS_SUCCESS") {
							var sessionToken = result["soap:Body"]["OpenDataFeed3Response"]["GpnOpenUtaDataFeedResponse"]["SessionToken"];
							var monitors = result["soap:Body"]["OpenDataFeed3Response"]["GpnOpenUtaDataFeedResponse"]["AcceptedMonitors"]["mid"];
							var sites = result["soap:Body"]["OpenDataFeed3Response"]["GpnOpenUtaDataFeedResponse"]["AcceptedSites"]["sid"];
							self.emit('sessionOpened', sessionToken, monitors, sites);
						} else {
							var errMsg = result["soap:Body"]["OpenDataFeed3Response"]["GpnOpenUtaDataFeedResponse"]["Status"]["sErrorMessage"];
							self.emit('error', new Error(errMsg));
						}
					}
				});
			} else {
				self.emit('error', new Error(err));
			}
		});
	} catch(e) {
		self.emit('error', e);
	}
	
	self.on('error', function(message) {
		if (callback) callback(message);
	});
	
	self.on('open', function(sessionToken) {
		if (callback) callback(null, sessionToken);
	});
}

DSClient.prototype.getResponseData = function(sessionToken, callback) {
	var self = this;
	
	var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
						'<env:Envelope xmlns:web="http://gomeznetworks.com/webservices/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ins0="http://gomeznetworks.com/webservices/" xmlns:ins1="http://gomeznetworks.com/webservices/AbstractTypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">' +
							'<env:Body>' + 
								'<ins0:GetResponseData>' +
									'<web:sSessionToken>' + sessionToken + '</web:sSessionToken>' +
								'</ins0:GetResponseData>' +
							'</env:Body>' +
						'</env:Envelope>';
	
	var reqOptions = {
		url: "http://gpn.webservice.gomez.com/DataExportService40/GpnDataExportService.asmx",
		method: "POST",
		headers: {
			"SOAPAction": "http://gomeznetworks.com/webservices/GetResponseData",
			"Content-type": "text/xml;charset=UTF-8"
		},
		body: xml
	}

	request(reqOptions, function(err, response) {
		if (!err && response.statusCode == 200) {
			var body = response.body;
			
			if (body.indexOf("<?xml") != -1) {
				// Parse XML to object	
				var parser = new xml2js.Parser();
			
				parser.parseString(body, function (err, result) {
					if(!err) {
						var status = result["soap:Body"]["GetResponseDataResponse"]["GpnResponseData"]["Status"]["eStatus"];
						
						if (status == "STATUS_SUCCESS") {
							var data = result["soap:Body"]["GetResponseDataResponse"]["GpnResponseData"]["XmlDocument"]["GpnResponseData"]["TXTEST"];
							self.emit('dataReceived', data);
						} else {
							var errorMsg = result["soap:Body"]["GetResponseDataResponse"]["GpnResponseData"]["Status"]["sErrorMessage"];
							self.emit('error', errorMsg);
						}
					} else {
						self.emit('error', err);
					}
				});				
			}
		} else {
			self.emit('error', new Error(err));
		}
	});

	self.on('error', function(err) {
		if (callback) callback(err);
	})
	
	self.on('dataReceived', function(data) {
		if (callback) callback(null, data);
	});
}

DSClient.prototype.closeDataFeed = function(sessionToken, callback) {
	var self = this;
	
	var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
						'<env:Envelope xmlns:web="http://gomeznetworks.com/webservices/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ins0="http://gomeznetworks.com/webservices/" xmlns:ins1="http://gomeznetworks.com/webservices/AbstractTypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">' +
							'<env:Body>' +
								'<ins0:CloseDataFeed>' +
									'<web:sSessionToken>' + sessionToken + '</web:sSessionToken>' +
								'</ins0:CloseDataFeed>' +
							'</env:Body>' +
						'</env:Envelope>';

	var reqOptions = {
		url: "http://gpn.webservice.gomez.com/DataExportService40/GpnDataExportService.asmx",
		method: "POST",
		headers: {
			"SOAPAction": "http://gomeznetworks.com/webservices/CloseDataFeed",
			"Content-type": "text/xml;charset=utf-8",
		},
		body: xml
	}

	request(reqOptions, function(err, response) {
		self.emit('sessionClosed');
	});
	
	self.on('sessionClosed', function() {
		if (callback) callback();
	})
}