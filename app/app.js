var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , twitter = require('twitter_api')
  

app.listen(8080);

function handler (req, res) {

  //basic routing
  var req_path = require('url').parse(req.url).path;
  var file;
  var headers;
  var dirs = ['css','js','img']; //list of publicly accessable folders

  if(req_path === "/") {
    file = "/index.html"
  } else {
    var path_parts = req_path.split('/');
    var dir_name = path_parts[1];
    if(dirs.indexOf(dir_name) !== -1) {
      file = path_parts.join('/');
      if(dir_name === "js") {
        headers = {"Content-type": "text/javascript"};
      } else if(dir_name === "css") {
        headers = {"Content-type": "text/css"};
      }
    }
  }

  if(file) {
    fs.readFile(__dirname + file,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading file');
      }

      res.writeHead(200,headers);
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
}


io.sockets.on('connection', function (socket) {
  console.log("Client Connected with ID: [" + socket.id + "]");

  //keep a list of tracked tags / requests for each client
  socket.set('trackedTags',[],function(){});

  //start tracking a tag and add it to the list
  socket.on('trackTag', function(data) {
    var req = twitter.getTweets(data['tagName'], function(data) {
      socket.volatile.emit('tweetData',data);
      console.log("sent tweet data");
    });
    socket.get('trackedTags', function(err,tags) {
      tags.push({tag: data['tagName'], req: req});
      socket.set('trackedTags',tags,function(){});
    });
  });

  //kill requests for all tags of a user on disconnect
  socket.on('disconnect', function() {
    socket.get('trackedTags', function(err,tags) {
      for(var i = 0, len = tags.length; i < len; i++) {
        tags[i].req.abort();
      }
    });
  });
});