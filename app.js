require('node-jsx').install({
    extension: '.jsx'
});

var express = require('express');
var app = express();
var React = require('react/addons');
var components = require('./public/components.jsx');
var orm = require('./modules/orm');
var HelloMessage = React.createFactory(components.HelloMessage);

app.set('port', (process.env.PORT || 8080));
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index', {
        react: React.renderToString(HelloMessage({
            name: "John"
        }))
    })
})

orm.logDB();

app.get('/name', function(req, res) {
    res.json({
        thing: "Hello World"
    })
})

app.listen(app.get('port'), function() {
    console.log('App Running')
})
