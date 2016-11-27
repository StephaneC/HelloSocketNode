var bus;
var io;

module.exports = function(pbus, pio){
  bus = pbus;
  io = pio;
  var module = {};
  module.connection = connection;
  module.sendToWebsocket = sendToWebsocket;
  return module;
};

connection = function(socket){
  socket.auth = false;
  socket.on('/add.message', function(data){
    console.log("send /add.message with data : " + JSON.stringify(data));
    data = JSON.parse(data);

    //first add to redis
    bus.saveMessage(data);

    //then send back to clients
    bus.sendMessage('/add.message', data, function(err){
      console.log("error sendMessage : " + error);
      socket.emit('/new.message', '{"error", "500"}');
    });
  });

  socket.on('error', function(error){
    console.log("error occured on socket : " + error);
  });

  /*setTimeout(function(){
   //If the socket didn't authenticate, disconnect it
   if (!socket.auth) {
   console.log("Disconnecting socket ", socket.id);
   socket.disconnect('unauthorized');
   }
   }, 3000);*/
};


/**
 * Global scope,
 * Will be called from bus
 */
sendToWebsocket = function(channel, data){
  console.log("redirecto redis to ws. channel: " + channel + " data: " + data);
  io.emit(channel, data);
};


sendErrorToClient = function(message){
  io.sockets.connected[socketId].emit(message);
};
