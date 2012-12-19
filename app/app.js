var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , twitter = require('twitter_api')
  
//twitter.getTweets('japan',processTweets);

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

function processTweets(tweet_data) {

}

io.sockets.on('connection', function (socket) {
  console.log("Client Connected with ID: [" + socket.id + "]");

  socket.on('trackTag', function(data) {
    twitter.getTweets(data['tagName'], function(data) {
      socket.emit('tweetData',data);
      console.log("sent tweet data");
    })
  })
});