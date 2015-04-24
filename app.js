var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require('express');
var app = express();
var React = require('react/addons');
var components = require('./public/components.js');
var orm = require('./modules/orm');
var Comments = React.createFactory(components.Comments);
var cookie = require('cookie');
var FB = require('fb');
FB.options({ 'appSecret': 'a0767c9a11d66a3118e4fc8e83920f6e'});

app.set('port', (process.env.PORT || 5000));
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

orm.init();

var signedRequestValue = 'signed_request_value';

app.get('/', function(req, res) {

    var userId = false;
    if(req.headers.cookie) {
        var cookies = cookie.parse(req.headers.cookie);
        var signedRequestValue;
        for(var a in cookies) {
            if(a.indexOf('fbsr') > -1) {
                signedRequestValue = cookies[a];
            }
        }

        var signedRequest = FB.parseSignedRequest(signedRequestValue);
        var userId = (signedRequest) ? signedRequest.user_id : false;
    }

    orm.getDiscussion(1, function(data) {
        data.facebookID = userId;
        res.render('index', {
            react: React.renderToString(Comments({
                commentData: data
            })),
            staticContent: "var staticContent = " + JSON.stringify(data)
        })
    });
})

app.get('/discussions', function(req, res) {
    var discussionID = 1;
    orm.getDiscussion(discussionID, function(data) {
        res.json(data);
    });
})

app.listen(app.get('port'), function() {
    console.log('App Running')
})
