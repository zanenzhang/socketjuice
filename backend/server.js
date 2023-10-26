require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const passport = require('passport');
const passportSetup = require("./config/passportSetup.js");
const cookieSession = require("cookie-session");
const socialAuth = require('./socialauthentication.js');
const elasticClient = require('./elastic/clientsetup.js');
const { logger } = require('./middleware/logEvents');
const { errorHandler } = require('./middleware/errorHandler');

const verifyJWT = require('./middleware/verifyJWT');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');

const connectDB = require('./config/dbConn');
const socketioJwt = require('socketio-jwt');
// const { createAdapter } = require("@socket.io/redis-adapter");
// const { createClient } = require("redis");

const rateLimiter = require("express-rate-limit");
const slowDown = require("express-slow-down");
const helmet = require("helmet");
const hpp = require("hpp");
const xss = require("xss-clean");
var CronJob = require('cron').CronJob;

const http = require('http').createServer(app);

const PORT = process.env.PORT || 5000;

const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 350,
});

const speedLimiter = slowDown({
    windowMs: 10 * 60 * 1000, // 10 minutes
    delayAfter: 250, // allow 200 requests per 10 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 120:
  });

// Connect to MongoDB
connectDB();

// custom middleware logger
app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing, setting on a route by route basis
app.use(cors(corsOptions)); 

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

app.use(
    cookieSession({
      name: "session",
      keys: [process.env.EXPRESS_SESSION_KEY],
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
  );

// initalize passport
app.use(passport.initialize());
// deserialize cookie from the browser
app.use(passport.session());

app.use(bodyParser.json({ limit: "21mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "21mb", extended: true }));

app.use(limiter);
app.use(speedLimiter);
app.use(xss()); // santize body, params, url
app.use(hpp()); // To prevent HTTP parameter pollution attack
app.use(helmet()); // To secure from setting various HTTP headers
app.use(mongoSanitize());


//serve static files
app.use(express.static(path.join(__dirname,'client','build'))); 
app.use('/', cors(), express.static(path.join(__dirname, '/public')));
// app.use('/.well-known/microsoft-identity-association.json', cors(), express.static(path.join(__dirname, '/microsoft-identity-association.json')));

// routes
app.use('/api', cors(), require('./routes/root'));
app.use('/api/register', cors(corsOptions), require('./routes/register'));
app.use('/api/hostregister', cors(corsOptions), require('./routes/hostregister'));
app.use('/api/auth', cors(corsOptions), require('./routes/auth'));
app.use('/api/refresh', cors(corsOptions), require('./routes/refresh'));
app.use('/api/logout', cors(corsOptions), require('./routes/logout'));
app.use('/api/activate', cors(), require('./routes/activate'));
app.use('/api/resendverification', cors(corsOptions), require('./routes/resendverification'));
app.use('/api/resetpassword', cors(corsOptions), require('./routes/resetpassword'));
app.use('/api/inputnewpassword', cors(), require('./routes/inputnewpassword'));
app.use('/api/userdata', cors(), require('./routes/userdata'));

app.use('/api/posts', cors(corsOptions), require('./routes/postsbyuser'));
app.use('/api/viewed', cors(corsOptions), require('./routes/viewed'));
app.use('/api/linkclicks', cors(corsOptions), require('./routes/linkclicks'));
app.use('/api/advertisements', cors(corsOptions), require('./routes/advertisements'));
app.use('/api/visited', cors(corsOptions), require('./routes/visited'));
app.use('/api/reels', cors(corsOptions), require('./routes/reels'));
app.use('/api/recentusers', cors(corsOptions), require('./routes/recentusers'));
app.use('/api/singlepost', cors(corsOptions), require('./routes/singlepost'));
app.use('/api/comments', cors(corsOptions), require('./routes/comments')); 
app.use('/api/chats', cors(corsOptions), require('./routes/chats')); 
app.use('/api/singlechat', cors(corsOptions), require('./routes/singlechat')); 
app.use('/api/messages', cors(corsOptions), require('./routes/messages')); 

app.use('/api/blockedlist', cors(corsOptions), require('./routes/blockedlist'));
app.use('/api/autocomplete', cors(corsOptions), require('./routes/autocomplete'));
// app.use('/api/search', cors(corsOptions), require('./routes/search'));
app.use('/api/elasticsearch', cors(corsOptions), require('./routes/elasticsearch'));
app.use('/api/profile', cors(corsOptions), require('./routes/profile')); 
app.use('/api/publicdata', cors(corsOptions), require('./routes/publicdataroutes')); 
app.use('/api/checkuser', cors(corsOptions), require('./routes/checkuser')); 
app.use('/api/product', cors(corsOptions), require('./routes/product')); 
app.use('/api/orders', cors(corsOptions), require('./routes/orders')); 
app.use('/api/cart', cors(corsOptions), require('./routes/cart')); 
app.use('/api/cities', cors(corsOptions), require('./routes/cities')); 
app.use('/api/ownedproduct', cors(corsOptions), require('./routes/ownedproduct')); 
app.use('/api/avatar', cors(corsOptions), require('./routes/avatar')); 
app.use('/api/username', cors(corsOptions), require('./routes/username')); 
app.use('/api/invite', cors(corsOptions), require('./routes/invitation')); 
app.use('/api/emails', cors(corsOptions), require('./routes/emails')); 
app.use('/api/payments', cors(corsOptions), require('./routes/payments'));
app.use('/api/paymentsuser', cors(corsOptions), require('./routes/paymentsuser')); 

app.use('/api/notification', cors(corsOptions), require('./routes/notifications')); 

app.use('/api/s3', cors(corsOptions), require('./routes/s3route'));
app.use('/api/nsfw', cors(corsOptions), require('./routes/nsfw'));
app.use('/api/recaptcha', cors(corsOptions), require('./routes/recaptcha'));
app.use('/api/warnings', cors(corsOptions), require('./routes/warnings'));

app.use('/api/speech', cors(corsOptions), require('./routes/speech'));


app.get("/*", (req, res) => { res.sendFile(path.join(__dirname ,'/frontend/public/index.html')); })

app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.json({ "error": "404 Not Found" });
    } else {
        res.type('txt').send("404 Not Found");
    }
});

app.use(errorHandler);


var authenticatedUserIds = {}

const io = require('socket.io')(http,
    {
        path:'/mysocket',
        cors: {
            origin: "*",
            methods: ["GET"]
        },
        allowEIO4: true
    }       
)

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));


io.use(socketioJwt.authorize({
    secret: process.env.ACCESS_TOKEN_SECRET,
    handshake: true
  }));
  
io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('User Disconnected');
    //if userId in hashmap, remove
  });

  socket.on("setup", (auth) => {

    if(auth.username !== socket.decoded_token.UserInfo.username){
        console.log("Auth error!")
        return
    }
    // authenticatedUserIds[userId] = userId
    socket.join(auth.userId);
    socket.emit("connected")

  }) 

  socket.on("notifications", (account) =>{

    if(account.username !== socket.decoded_token.UserInfo.username){
        console.log("Auth error!")
        return
    }

        console.log("Setting up main room")
        console.log(account.username)
        socket.join(account.username);
        socket.emit("linkedNotis")
    })

    socket.on("join", (data) => {
        console.log("Chat id here");
        console.log(data.userId)
        console.log(`Joining chat ${data.chatId}`);
        socket.join(data.chatId);
        // io.to(data.chatId).emit("Testing room connection")
    })

    socket.on("leave", (data) => {
        console.log("Chat id here")
        console.log(`Leaving chat ${data.chatId}`)
        socket.leave(data.chatId)
    })

    socket.on("openPost", (data) => {
        console.log(`Joining post ${data.postId}`);
        socket.join(data.postId);

        socket.emit("connectedPost")
    })

    socket.on("closePost", (data) => {
        console.log(`Leaving post ${data.postId}`)
        socket.leave(data.postId)
    })

    socket.on("inStore", (data) => {
        console.log(`Joining store ${data.storeId}`);
        socket.join(data.storeId);

        socket.emit("connectedStore")
    })

    socket.on("leftStore", (data) => {
        console.log(`Leaving store ${data.storeId}`)
        socket.leave(data.storeId)
    })

    socket.on("typingStart", (data) => {
        io.to(data.chatId).emit("othersTypingStart", data.username)
    });

    socket.on("typingStop", (data) => {
        io.to(data.chatId).emit("othersTypingStop", data.username)
        //Can add broadcast if not in testing
    });

});

    