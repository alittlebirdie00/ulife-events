// Package Requires
var express     = require("express"),
    session     = require("express-session"),
    MySQLStore  = require("express-mysql-session")(session),
    bcrypt      = require("bcrypt"),
    bodyParser  = require("body-parser"),
    cookieParser = require("cookie-parser"),
    passport    = require("passport"),
    request     = require('request'),
    path        = require('serve-static'),
    dbconnection = require('./db-connection');

var LocalStrategy = require('passport-local').Strategy;

var app = express();
app.use(express.static('public'));

// use bodyParser for reading forms
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

var options = {
    host: 'localhost',
    user: 'blue9',
    // Comment-out if the database doesn't exist yet
    database: 'ulife_db'
};

var sessionStore = new MySQLStore(options);

// Express-session creates a session for our visiting user on the backend,
// and also returns a session ID which once we integrate passport the user
// will be able to use this cookie and its value in order to access data specific to their session.
app.use(session({
  secret: 'akjbqcWLDcnqnNSlwl',
  store: sessionStore,
  resave: false,
  // only create cookies and sessions for users who have signed in to the app
  saveUninitialized: false
  //cookie: { secure: true }
}));

// initialize passport and integrate with express session
app.use(passport.initialize());
app.use(passport.session());

// so you don't have to type .ejs after calling to render an ejs file
app.set("view engine", "ejs");

app.use(function(req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.userInSession = req.user;
    next();
});

passport.use(new LocalStrategy( function(username, password, done) {
    console.log(username);
    console.log(password);
    
    let sql = 'SELECT * FROM students WHERE user_id = ?';
    dbconnection.query(sql, [username], function(err, results, fields) {
        if (err) {
            done(err);
        } else {
            // check if the users username actually exists in database
            if (results.length === 0) {
                return done(null, false);
            }
            
            console.log(results[0]);
            console.log("end passport.use()");

            const hash = results[0].password.toString();
            
            bcrypt.compare(password, hash, function(err, response) {
                if (err || response == false) {
                    console.log("ERROR");
                    return done(null, false);
                }
                else {
                    // this function goes ahead and saves the object surrounded by {}
                    // to the req.user object. 
                    // Now this object and its properties can be accessed.
                    // convention - camelCase for object notation: database schema notation
                    return done(null, 
                    {   user_id: results[0].id,
                        firstName: results[0].firstname,
                        lastName: results[0].lastname,
                        schoolName: results[0].schoolname,
                        userLevel: results[0].user_level
                    });
                }
            });
        }

    });
 }));

passport.serializeUser(function(user_id, done) {
    //console.log("serializeUser()");

    done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    //console.log("deserializeUser()");

    done(null, user_id);
});

/* ===================== "ulife_db" Database creation ======================= 
 *
 *                  Call this route to create the database 
 *                      if it doesn't yet exist in MySQL       
 *
 * ========================================================================== */ 

app.get('/createDB', (req, res) => {
    var sql = 'CREATE DATABASE ulife_db';
    dbconnection.query(sql, (err, results) => {
        if (err) throw err;
        console.log(results);
        res.send("Database Created..");
    });
});

/* ========================================================================== */ 

/* ================ "events" Table sample data population ===================
 *
 *               Call this route to populate the database 
 *              if it doesn't yet have anything to play with. 
 *                  Populates from events.ucf.edu/feed.json
 *
 * ========================================================================== */ 
app.get("/populateDB", function(req, res) {
    
    var endpoint = 'https://events.ucf.edu/feed.json';
    request(endpoint, function(err, response, body){
        if (!err & response.statusCode == 200) {
            var data = JSON.parse(body);
            
            data.forEach(function(object) {
                var eventTitle = object["title"];
                var schoolName = "University of Central Florida";
                var eventScope = "public";
                var contactName = object["contact_name"];
                var contactEmail = object["contact_email"];
                var starts = object["starts"];
                var ends = object["ends"];
                var subtitle = object["subtitle"];
                var description = object["description"];
                var location = object["location"];
                var category = object["category"];
                var contactPhone = object["contact_phone"];
                
                // Object (row) to be inserted into the DB
                var eventObject = 
                {
                    title: eventTitle,
                    schoolname: schoolName,
                    event_scope: eventScope,
                    contact_name: contactName,
                    starts: starts,
                    ends: ends,
                    subtitle: subtitle,
                    description: description,
                    location: location,
                    category: category,
                    contact_phone: contactPhone
                };
                
                let sql = 'INSERT INTO events SET ?';
                let query = dbconnection.query(sql, eventObject, function(err, result) {
                    if (err) throw err;
                    console.log("Inserted an event into the db..");
                });
            });
            res.send("success");
        }
    });
    
});
// ============================================================================= // 

// INDEX
app.get("/", function(req, res) {
    //console.log(req.user);
    //console.log(req.isAuthenticated());
    res.render('landing');
});



// List all EVENTS
app.get("/events", authenticationMiddleware(), function(req, res) {
    
    let sql = 'SELECT * FROM events';
    
    let query = dbconnection.query(sql, function(err, results) {
        if (err) throw err;
        res.render('events', {events: results})
    });
    
});

// List all EVENTS from a certain school
app.get("/events/search", authenticationMiddleware(), function(req, res) {
    
    
    let sql = 'SELECT * FROM events WHERE schoolname=?';
    
    let query = dbconnection.query(sql, req.query.school, function(err, results) {
        if (err) throw err;
        
        if (results[0] == undefined)
            res.send("No events for " + req.query.school);
        else
         res.render('events', {events: results})
    });
    
});




 
 
// Post an EVENT 
app.post("/events", function(req, res) {
    
    // Create the events properties with the request body
    var title = req.body.title;
    var subtitle = req.body.subtitle;
    var school = req.body.schoolname;
    var description = req.body.description;
    var contactName = req.body.contact_name;
    var contactEmail = req.body.contact_email;
    var contactPhone = req.body.contact_phone;
    var location = req.body.location;
    var scope = req.body.event_scope;
    
    
    var event = 
    {
        title: title,
        schoolname: school,
        event_scope: scope,
        contact_name: contactName,
        contact_email: contactEmail,
        subtitle: subtitle,
        description: description,
        location: location,
        contact_phone: contactPhone
    };
    
    let sql = 'INSERT INTO events SET ?';
    
    let query = dbconnection.query(sql, event, function(err, result) {
        if (err) throw err;
        console.log("Posted event!\n" + result);
        res.redirect('/events');
    });
    

});


// Show upload new event form
app.get("/events/new", function(req, res) {
    res.render('new-event');
});


// Show info about one specific event
app.get("/events/:id", function(req, res) {
    // id's for events are named in MY schema as 'event_id'
    let sql = 'SELECT * FROM events WHERE event_id=?';
    let query = dbconnection.query(sql, req.params.id, function(err, result) {
        if (err) throw err;
        console.log(result);
        res.render('event-detail', {event: result[0]});
    });
});

app.get("/vuedemo", function(req, res) {
    
    res.render('vuedemo');
});

// Show edit form for one event
app.get("/events/:id/edit", function(req, res) {
    
});

// Update a particular event, then redirect somewhere
app.put("/events/:id", function(req, res) {
    
});

// Delete a particular event, then redirect somewhere
app.delete("/events/:id", function(req, res) {
    
});

app.get("/events/createEvent/:title/:school", function(req, res) {
    var eventTitle = req.params.title;
    var schoolName = req.params.school;
    
    var eventObject = {title: eventTitle, schoolname: schoolName};
    // similar to
    let sql = 'INSERT INTO events SET ?';
    let query = dbconnection.query(sql, eventObject, function(err, result) {
        if (err) throw err;
        res.send(result);
    });
    
});

// SIGNUP
app.get("/signup", function(req, res) {
    res.render('signup');
});

app.post("/signup", function(req, res) {
    
    var username   = req.body.username;
    var email      = req.body.email;
    var password   = req.body.password;
    var firstName  = req.body.firstname;
    var lastName   = req.body.lastname;
    var schoolName = req.body.schoolname;
    var gender, userLevel;
    
    if (req.body.gender_male)
        gender = 'M';
    else
        gender = 'F';
        
    if (req.body.level_student) 
        userLevel = 'Student';
    else if (req.body.level_admin)
        userLevel = 'Admin';
    else
        userLevel = 'Super';
    
    const saltRounds = 10;

    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
                // Store hash in your password DB.
                
                var newStudent = 
                {   user_id: username, 
                    password: hash, 
                    email: email, 
                    firstname: firstName, 
                    lastname: lastName, 
                    schoolname: schoolName,
                    gender: gender,
                    user_level: userLevel
                };
        
                let sql = 'INSERT INTO students SET ?';
                let query = dbconnection.query(sql, newStudent, function(err, result) {
                    console.log("User created to DB successfully");
                    
                    let sql = 'SELECT LAST_INSERT_ID() as user_id';
                    dbconnection.query(sql, function(err, results, fields) {
                        if (err) throw err;
                        
                        const user_id = results[0];
                        
                        // take user_id and store it within a session
                        // req.login only works if we have another function setup for sessions specifically
                        // function should take this user_id and store it within the session we're creating
                        req.login(user_id, function(err){
                            res.redirect('/');
                        });
                    });
                });
        });        
    });
});

// LOGIN
app.get("/login", function(req, res) {
    res.render('login');
});

app.post("/login", passport.authenticate('local', 
{successRedirect: '/events', failureRedirect: '/login'}));

// PROFILE
app.get("/profile/", function(req, res) {
    res.redirect(`/profile/${req.user.user_id}`);
});

app.get("/profile/:id", function(req, res) {
    
    res.render('profile', {user: req.user});
});

// LOGOUT
app.get("/logout", function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

// authentication code snippet
// it'll call a request/response function
function authenticationMiddleware () {  
	return (req, res, next) => {
		//console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

	    if (req.isAuthenticated()) return next();
	    res.redirect('/login')
	}
}

app.listen(process.env.PORT, process.env.IP,function() {
    console.log("Server has started on C9 environment port!"); 
});

