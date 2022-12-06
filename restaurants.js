require("dotenv").config();
require("./config/altas").connect();
var cookieParser = require('cookie-parser')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var express  = require('express');
var path = require('path');
var app  = express();
var bodyParser = require('body-parser');  
var exphbs = require('express-handlebars');       
app.use(express.static(path.join(__dirname, 'public')));
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(cookieParser()); // parse application/vnd.api+json as json

const User = require("./model/user");
const auth = require("./middleware/auth");
var RESTAURANT = require('./model/restaurant');

//new route for searching restaurant details (STEP 3)
app.get('/info/search', auth,(req, res, next) => {
res.render("search", {title : "Search Page"});
});

app.post("/info/search/result", auth,(req, res) => {
//display results
	let page = req.body.pgno;
	let perPage = req.body.perpg;
	let boroug = req.body.borough; 
	console.log(boroug);
	if (boroug){  
	RESTAURANT.find({borough:boroug}, null, {limit:perPage, skip:(page-1)*perPage}, function(err, docs){
	if (err){
        console.log(err);
    }
    else{
		console.log(docs);
		res.render("result", {title : "Result Page", objects : docs});
    }
}).lean()}
else {
	RESTAURANT.find(null, null, {limit:perPage, skip:(page-1)*perPage}, function(err, docs){
		if (err){
			console.log(err);
		}
		else{
			console.log(docs);
		    res.render("result", {title : "Result Page", objects : docs});
		}
	}).lean()}
});

app.get('/login', (req, res, next) => {
	res.send(`<form method="POST" action="/login">
	<input type="text" name="email" placeholder="email">
	<input type="text" name="password" placeholder="password">
	<input type="submit">
	</form>`);
	});
app.get('/register', (req, res, next) => {
	res.send(`<form method="POST" action="/register">\
	<input type="text" name="first_name" placeholder="first_name">
	<input type="text" name="last_name" placeholder="last_name">
	<input type="text" name="email" placeholder="email">
	<input type="text" name="password" placeholder="password">
	<input type="submit">
	</form>`);
	});
app.get('/createnewrestaurant', auth,(req, res, next) => {
		res.send(`<form method="POST" action="/api/restaurants">\
		<input type="text" name="name" placeholder="name">
		<input type="text" name="address" placeholder="address">
		<input type="text" name="rate" placeholder="rate">
		<input type="text" name=" borough" placeholder= "borough">
		<input type="submit">
		</form>`);
		});

app.post("/register", async (req, res) => {
	try {
	  // Get user input
	  let first_name = req.body.first_name;
	  let last_name = req.body.last_name;
	  let email = req.body.email;
	  let password = req.body.password;

  
	  // Validate user input
	  if (!(email && password && first_name && last_name)) {
		console.log(email);
		console.log(req.body.email);
		res.status(400).send("All input is required");

	  }
  
	  // check if user already exist
	  // Validate if user exist in our database
	  const oldUser = await User.findOne({ email });
  
	  if (oldUser) {
		return res.status(409).send("User Already Exist. Please Login");
	  }
  
	  //Encrypt user password
	  encryptedPassword = await bcrypt.hash(password, 10);
  
	  // Create user in our database
	  const user = await User.create({
		first_name,
		last_name,
		email: email.toLowerCase(), // sanitize: convert email to lowercase
		password: encryptedPassword,
	  });
  
	  // Create token
	  const token = jwt.sign(
		{ user_id: user._id, email },
		process.env.TOKEN_KEY,
		{
		  expiresIn: "2h",
		}
	  );
	  // save user token
	  res.cookie('auth',token);
      res.send('ok');
	} catch (err) {
	  console.log(err);
	}
  });
  
  app.post("/login", async (req, res) => {
	try {
	  // Get user input
	  let email = req.body.email;
	  let password = req.body.password;
	  // Validate user input
	  if (!(email && password)) {
		res.status(400).send("All input is required");
	  }
	  // Validate if user exist in our database
	  const user = await User.findOne({ email });
  
	  if (user && (await bcrypt.compare(password, user.password))) {
		// Create token
		const token = jwt.sign(
		  { user_id: user._id, email },
		  process.env.TOKEN_KEY,
		  {
			expiresIn: "2h",
		  }
		);
  
		// save user token
		res.cookie('auth',token);
		res.send('ok');
	  }
	  res.status(400).send("Invalid Credentials");
	} catch (err) {
	  console.log(err);
	}
  });
app.post('/api/restaurants', auth, function(req, res){
	var data = {
		name : req.body.name,
		address : req.body.address,
		rate : req.body.rate,
		description : req.body.description,
		boroughs : req.body.boroughs
	}
	RESTAURANT.create(data, function(err, restaurant) {
		if (err) throw err;
	
		res.send('Successfully! RESTAURANT added - '+restaurant.name);
		});

});



app.get('/api/:restaurant_id', auth,function(req, res) {
	let id = req.params.restaurant_id;
	RESTAURANT.findById(id, function(err, restaurant) {
		if (err)
			res.send(err)
 
		res.json(restaurant);
	});
 
});

app.delete('/api/:restaurant_id', auth, function(req, res) {
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

app.put('/api/:restaurant_id', auth, function(req, res) {

    console.log(req.body);

	let id = req.params.restaurant_id;
	var data = {
		name : req.body.name,
		address : req.body.address,
		rate : req.body.rate,
		description : req.body.description,
		borough : req.body.borough

	}

	// save the user
	RESTAURANT.findByIdAndUpdate(id, data, function(err, restaurant) {
	if (err) throw err;

	res.send('Successfully! RESTAURANT updated - '+restaurant.name);
	});
});
app.get("/welcome", auth, (req, res) => {
	res.status(200).send("Welcome 🙌");
  });
module.exports = app;