// Include modules
var util = require('util')
 	, EventEmitter = require('events').EventEmitter
	, request = require('request')
	, xml2js = require('xml2js');
	
var AMS = function(username, password) {
	// Inherit EventEmitter
	EventEmitter.call(this);
	
	// Set class variables
	this.username = username;
	this.password = password;
	
	return this;	
}

util.inherits(AMS, EventEmitter);
module.exports = AMS;

AMS.prototype.getAccountInfo = function(callback) {
	var self = this;
	
	if (callback != null && typeof callback === "function") {
		self.on('error', function(err) {
			self.removeAllListeners();
			return callback(err);
		});
	
		self.on('results', function(results) {
			self.removeAllListeners();
			return callback(null, results);
		});
	}

	var xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://gomeznetworks.com/webservices">' +
	   '<soapenv:Header/>' +
	   '<soapenv:Body>' +
	      '<web:Retrieve>' +
	         '<web:request>' +
	            '<web:user>' +
	               '<web:username>' + this.username + '</web:username>' +
	               '<web:password>' + this.password + '</web:password>' +
	            '</web:user>' +
	         '</web:request>' +
	      '</web:Retrieve>' +
	   '</soapenv:Body>' +
	'</soapenv:Envelope>';
	
	var reqOptions = {
		url: "http://gpn.webservice.gomez.com/AccountManagementService40/AccountManagementWS.svc",
		method: "POST",
		headers: {
			"SOAPAction": "http://gomeznetworks.com/webservices/Retrieve",
			"Content-type": "text/xml;charset=UTF-8"
		},
		body: xml		
	}
	
	request(reqOptions, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			var parser = new xml2js.Parser();
			
			parser.parseString(body, function (err, result) {
				if (!err) {
					var status = result['s:Body']['RetrieveResponse']['RetrieveResult']['StatusType'];
					
					if (status === 'SUCCESS') {
						var results = result['s:Body']['RetrieveResponse']['RetrieveResult']['GPNData'];
						
						self.emit('results', results);	
					} else {
						var errMsg = result['s:Body']['RetrieveResponse']['RetrieveResult']['Message'];
						
						self.emit('error', new Error(errMsg));
					}
							
				} else {
					self.emit('error', err);
				}
			});
		}
	});
}

AMS.prototype.getMonitorInfo = function(monitorType, callback) {
	var self = this;
	
	if (callback != null && typeof callback === "function") {
		self.on('error', function(err) {
			self.removeAllListeners();
			return callback(err);
		});
	
		self.on('results', function(results) {
			self.removeAllListeners();
			return callback(null, results);
		});
	}
	
	monitorType = monitorType || 'backbone';
	
	var xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://gomeznetworks.com/webservices">' +
	   '<soapenv:Header/>' +
	   '<soapenv:Body>' +
	      '<web:Retrieve>' +
	         '<web:request>' +
	            '<web:user>' +
	               '<web:username>' + this.username + '</web:username>' +
	               '<web:password>' + this.password + '</web:password>' +
	            '</web:user>' +
	            '<web:accountRequest>' +
					'<web:productRequest>' +
						'<web:activeXFProductRequest>' +
							'<web:activeXFTestRequest>';
							
	if (monitorType == "lastmile") {
		xml +=					'<web:lastMileTestRequest>' +
							        '<web:lastMileTransactionTestFilter></web:lastMileTransactionTestFilter>' +
								'</web:lastMileTestRequest>';
	} else {
		xml +=					'<web:backboneTestRequest>' +
									'<web:backboneTransactionTestFilter></web:backboneTransactionTestFilter>' +
								'</web:backboneTestRequest>';
	}
	
	xml +=			  		'</web:activeXFTestRequest>' +
						'</web:activeXFProductRequest>'  +
					'</web:productRequest>' +
				'</web:accountRequest>' +
	         '</web:request>' +
	      '</web:Retrieve>' +
	   '</soapenv:Body>' +
	'</soapenv:Envelope>';
	
	var reqOptions = {
		url: "http://gpn.webservice.gomez.com/AccountManagementService40/AccountManagementWS.svc",
		method: "POST",
		headers: {
			"SOAPAction": "http://gomeznetworks.com/webservices/Retrieve",
			"Content-type": "text/xml;charset=UTF-8"
		},
		body: xml		
	}
	
	request(reqOptions, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			var parser = new xml2js.Parser();
			
			parser.parseString(body, function (err, result) {
				if (!err) {
					var status = result['s:Body']['RetrieveResponse']['RetrieveResult']['StatusType'];
					
					if (status === 'SUCCESS') {
						var results = result['s:Body']['RetrieveResponse']['RetrieveResult']['GPNData']['Monitors'];
						
						self.emit('results', results);	
					} else {
						var errMsg = result['s:Body']['RetrieveResponse']['RetrieveResult']['Message'];
						
						self.emit('error', new Error(errMsg));
					}
							
				} else {
					self.emit('error', err);
				}
			});
		}
	});
}