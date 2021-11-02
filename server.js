var   express = require('express')
    , http = require('http')
    , https = require('https')
    , fs = require('fs')
    , path = require('path');

var app = express();

app.set('title','OpenFin appseed test');
app.use(express.static(path.join(__dirname, 'src')));

/* serves main page  */
app.get('/', function (req, res) {
    res.sendFile("src/index.html", {"root": __dirname});
});

/* process.env.PORT is used in case you want to push to Heroku, for example, here the port will be dynamically allocated */
var port = process.env.PORT || 9070;

app.get(`/redirect`, function (req, res) {
    res.redirect(`/redirect/to.html`);
});

console.log(`host: ${process.env.HOST}; ${app.get('port')}`);

http.createServer(app).listen(port, '0.0.0.0', function(){
    console.log('Express server listening on port ' + port);
});

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app)
.listen(3000, function () {
  console.log('Example app listening on port 3000! Go to https://localhost:3000/')
})
