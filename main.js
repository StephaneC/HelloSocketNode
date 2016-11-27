var app = require('express')();
var http = require('http').Server(app);
var bus = require('./bus/redis.js');
var sio = require('socket.io')(http,{origins:'*:*'});
var io = require('./routes/io.js')(bus,sio);

app.get('/', function(req, res){
  res.sendfile('html/test.html');
});

/**
 * enable CORS.
 */
var cors = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, token, Authentication, accept, Origin, Access-Control-Request-Method,Access-Control-Request-Headers,Authorization,Token');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

app.use(cors);


/**
 * Rest PART
 */
app.get('/v1/messages', bus.getMessages);

/**
 * Web socket
 */
sio.on('connection', io.connection);

console.log(bus);
bus.psubscribe('/add.message', function(channel, message){
  //let's sendToWebsocket
  console.log("send to ws");
  io.sendToWebsocket('/new.message', message);
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
