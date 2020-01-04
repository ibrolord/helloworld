var http = require("http")
var winston = require("winston")
var AWS = require("aws-sdk")

AWS.config.update({region:"us-east-1"})

var cwevents = new AWS.CloudWatchEvents({apiVersion: "2015-10-07"})
var cw = new AWS.Cloudwatch({apiVersion: "2010-08-01"})

var version = process.env.HELLOWORLD_VERSION 

var logger = new winston.Logger({ 
  transports: [new winston.transports.Console({ 
    timestamp: function() { 
       var d = new Date()
       return d.toISOString()
    }, 
  })] 
}) 

var metric = {
  MetricData: [{
    MetricName: "page_viewed",
    Dimensions: [{
      Name: "Version",
      Value: version
    }],
   Namespace: "Helloworld/traffic"
  }

logger.rewriters.push(function(level, msg, meta) { 
  meta.version = version 
  return meta 
}) 

http.createServer(function (request, response) {
   var event = {
     Entries: [{
       Detail: JSON.stringify(request.headers),
       DetailType: "helloworld application access request",
       Source: "helloworld.app"
}]
}
   // Send the HTTP header
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   response.writeHead(200, {'Content-Type': 'text/plain'})

   // Send the response body as "Hello World"
   response.end('Hello World\n')
   cwevents.putEvents(event, function(err, data) {
     if (err) {
	logger.error("error", "an error occurred when creating an event", {error: err})
     } else {
	    logger.info("created event", {entries: data.Entries})
     }
   })
   cw.putMetricData(metric, function(err, data) {
     if (err) {
       logger.error("an error occured when creating a metric", {error: err});
     } else {
	 logger.info("created metric", {data: JSON.stringify(data)});
     }
   })
}).listen(3000)

// Console will print the message
logger.info("Server running") 
