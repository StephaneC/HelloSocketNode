//initialize redis
var Redis = require('redis');
//redis to get messages
var redisSub;
//redis to send messages
var redisPub;
//redis to store data
var redis;

var port = process.env.REDIS_PORT_6379_TCP_PORT;
var host = process.env.REDIS_PORT_6379_TCP_ADDR;
var pwd = process.env.REDIS_PWD;

var subscribed = {};

var MESSAGE_KEY = "MESSAGES";


/**
 * Exports this method in all bus implemented.
 */
module.exports = {
    saveMessage : function(message){
      redis.sadd(MESSAGE_KEY, JSON.stringify(message), function(err){
                //try again
                if(err){
                    redis.sadd(MESSAGE_KEY, JSON.stringify(message));
                }
            });
    },
    getMessages : function(){
      redis.smembers(MESSAGE_KEY, function(err, res){
        return res;
    });

    },
    sendMessage : function(path, json){
        console.log("Send message on channel " + path + " - message : " + JSON.stringify(json));
        redisPub.publish(path, JSON.stringify(json));
    },
    psubscribe: function(channel, callback){
        if(!subscribed[channel]){
            subscribed[channel] = [];
        }
        //add callback
        subscribed[channel].push(callback);
        redisSub.psubscribe(channel);
        console.log("subscribed channel:"+channel);
    },

    redisSub:redisSub
};



var connectRedis = function(){
    try {
        //if env var exist, user it
        if(port && host){
            var options = {
                auth_pass : pwd
            };
            redisSub = Redis.createClient(port, host, options);
            redisPub = Redis.createClient(port, host, options);
            redis = Redis.createClient(port, host, options);
        } else {
            //else give a try to default
            redisSub = Redis.createClient();
            redisPub = Redis.createClient();
            redis = Redis.createClient();
        }
    }catch(e){
        console.log("couldn't connect to redis Sub", e);
    }
    if(redisSub){
        manageRedisSub();
    }
};

/** manage redis pub/sub. */
var manageRedisSub = function(){
    redisSub.on("pmessage", function(pattern, channel, message) {
        console.log('received message from bus : ' + channel);
        if(subscribed[pattern]){
          console.log("registered pattern ");
          //let's find the callback
            for(var i = 0; i<subscribed[pattern].length; i++){
                try {
                  console.log("call associated cb");
                    subscribed[pattern][i](pattern, message);
                } catch(e){
                    console.log(e);
                }
            }
        }
    });
    redisSub.on("error", function(message){
        //Deal with error
        console.log('error redis disconnected ' + message);
    });

    redisSub.on("end", function(message){
        //Deal with error
        console.log('redis end ' + message);
    });
};
connectRedis();

function evalProcessVar(data){
   if(data.indexOf('process.' > 0)){
       console.log(data + ' -> ' + eval(data));
        return eval(data);
    }
    return data;
}
