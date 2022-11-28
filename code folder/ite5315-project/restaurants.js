var express  = require('express');
var path = require('path');
var mongoose = require('mongoose');
var app      = express();
var database = require('./config/altas');
var bodyParser = require('body-parser');  
var exphbs = require('express-handlebars');       
app.use(express.static(path.join(__dirname, 'public')));
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
var port     = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json


mongoose.connect(database.url);

var RESTAURANT = require('./models/restaurant');
const restaurant = require('./models/restaurant');

app.post('/api/restaurants', function(req, res){
	var data = {
		name : req.body.name,
		address : req.body.address,
		rate : req.body.rate,
		description : req.body.description

	}
	RESTAURANT.create(data, function(err, restaurant) {
		if (err) throw err;
	
		res.send('Successfully! RESTAURANT added - '+restaurant.name);
		});

});

app.get('/api/restaurants', function(req, res) {
	let page = req.query.page;
	let perPage = req.query.perPage;
	let boroug = req.query.borough; 
	if (boroug){  
	RESTAURANT.find({borough:boroug}, null, {limit:perPage, skip:(page-1)*perPage}, function(err, docs){
	if (err){
        console.log(err);
    }
    else{
       res.send(docs)
    }
})}
else {
	RESTAURANT.find(null, null, {limit:perPage, skip:(page-1)*perPage}, function(err, docs){
		if (err){
			console.log(err);
		}
		else{
		   res.send(docs)
		}
	})}
}
	);

app.get('/api/:restaurant_id', function(req, res) {
	let id = req.params.restaurant_id;
	RESTAURANT.findById(id, function(err, restaurant) {
		if (err)
			res.send(err)
 
		res.json(restaurant);
	});
 
});

app.delete('/api/:restaurant_id', function(req, res) {
	console.log(req.params.restaurant_id);
	let id = req.params.restaurant_id;
	RESTAURANT.remove({
		_id : id
	}, function(err) {
		if (err)
			res.send(err);
		else
			res.send('Successfully! RESTAURANT has been Deleted.');	
	});
});

app.put('/api/:restaurant_id', function(req, res) {
	// create mongose method to update an existing record into collection
    console.log(req.body);

	let id = req.params.restaurant_id;
	var data = {
		name : req.body.name,
		address : req.body.address,
		rate : req.body.rate,
		description : req.body.description

	}

	// save the user
	RESTAURANT.findByIdAndUpdate(id, data, function(err, restaurant) {
	if (err) throw err;

	res.send('Successfully! RESTAURANT updated - '+restaurant.name);
	});
});


app.listen(port);
console.log("App listening on port : " + port);