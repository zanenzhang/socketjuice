require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const cookieSession = require("cookie-session");
const { logger } = require('./middleware/logEvents');
const { errorHandler } = require('./middleware/errorHandler');

const verifyJWT = require('./middleware/verifyJWT');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const socketioJwt = require('socketio-jwt');

const rateLimiter = require("express-rate-limit");
const slowDown = require("express-slow-down");
const helmet = require("helmet");
const hpp = require("hpp");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");

const http = require('http').createServer(app);

const PORT = process.env.PORT_SJ || 5500;

const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max:350,
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
app.use(express.urlencoded({ extended: true }));

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
app.use('/.well-known/apple-developer-merchantid-domain-association', cors(), express.static(path.join(__dirname, '/domain-association-file-live')));

// routes
app.use('/api', cors(), require('./routes/root'));
app.use('/api/hostregister', cors(corsOptions), require('./routes/hostregister'));
app.use('/api/auth', cors(corsOptions), require('./routes/auth'));
app.use('/api/refresh', cors(corsOptions), require('./routes/refresh'));
app.use('/api/logout', cors(corsOptions), require('./routes/logout'));
app.use('/api/activate', cors(), require('./routes/activate'));
app.use('/api/resendverification', cors(corsOptions), require('./routes/resendverification'));
app.use('/api/resetpassword', cors(), require('./routes/resetpassword'));
app.use('/api/inputnewpassword', cors(), require('./routes/inputnewpassword'));
app.use('/api/userdata', cors(), require('./routes/userdata'));

app.use('/api/chats', cors(corsOptions), require('./routes/chats')); 
app.use('/api/singlechat', cors(corsOptions), require('./routes/singlechat')); 
app.use('/api/messages', cors(corsOptions), require('./routes/messages')); 
app.use('/api/twilio', cors(corsOptions), require('./routes/twilio')); 
app.use('/api/google', cors(corsOptions), require('./routes/google')); 

app.use('/api/profile', cors(corsOptions), require('./routes/profile'));
app.use('/api/bookmark', cors(corsOptions), require('./routes/bookmarks')); 
app.use('/api/appointment', cors(corsOptions), require('./routes/appointments'));  
app.use('/api/public', cors(corsOptions), require('./routes/public')); 
app.use('/api/verifyuser', cors(corsOptions), require('./routes/verifyuser')); 
app.use('/api/checkuser', cors(corsOptions), require('./routes/checkuser')); 
app.use('/api/flag', cors(corsOptions), require('./routes/flags')); 

app.use('/api/emails', cors(corsOptions), require('./routes/emails')); 
app.use('/api/payments', cors(corsOptions), require('./routes/payments'));
app.use('/api/reviews', cors(corsOptions), require('./routes/reviews'));

app.use('/api/notification', cors(corsOptions), require('./routes/notifications')); 

app.use('/api/s3', cors(corsOptions), require('./routes/s3route'));
app.use('/api/nsfw', cors(corsOptions), require('./routes/nsfw'));
app.use('/api/recaptcha', cors(corsOptions), require('./routes/recaptcha'));
app.use('/api/warnings', cors(corsOptions), require('./routes/warnings'));

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

        if(auth.userId !== socket.decoded_token.UserInfo.userId){
            console.log("Auth error!")
            return
        }
        // authenticatedUserIds[userId] = userId
        socket.join(auth.userId);
        socket.emit("connected")
    }) 

    socket.on("join", (data) => {
        console.log("Joining here")
        console.log(data)
        console.log(`Joining chat ${data?.chatId}`);
        socket.join(data.chatId);
        // io.to(data.chatId).emit("Testing room connection")
    })

    socket.on("leave", (data) => {
        console.log(`Leaving chat ${data.chatId}`)
        socket.leave(data.chatId)
    })

    socket.on("typingStart", (data) => {
        io.to(data.chatId).emit("othersTypingStart", data.userId)
    });

    socket.on("typingStop", (data) => {
        io.to(data.chatId).emit("othersTypingStop", data.userId)
        //Can add broadcast if not in testing
    });
});


const connection = mongoose.connection;

connection.once('open', () => {
    
    console.log('Connected to MongoDB');
    console.log("Setting change streams");

    const chatsChangeStream = connection.collection("chats").watch();

    chatsChangeStream.on("change", (change) => {
        switch (change.operationType) {
            case "update":
                const chatUpdate = {
                    // _chatId: change.fullDocument._id,
                    // participants: change.fullDocument.participants,
                    // mostRecentMessage: change.fullDocument.mostRecentMessage,
                };

                //sends update to chatId room key
                io.to(change.documentKey._id.toString()).emit("updatedChats", change.documentKey._id);                
                
                break;
            
            case "insert":
            
                console.log(change)

                //For participant in chat.participants, emit update

                change.fullDocument.participants?.forEach(function(participant){

                    io.to(participant._userId).emit("newChat", change.fullDocument);                
                })

                break;
        };
    });

    const messageChangeStream = connection.collection("messages").watch();

    messageChangeStream.on("change", (change) => {
        switch (change.operationType) {
            case "insert":
                // const newMessage = {
                //     _messageId: change.fullDocument._id,
                //     _chatId: change.fullDocument._chatId,
                //     _userId: change.fullDocument._userId,
                //     content: change.fullDocument.content,
                //     username: change.fullDocument.username,
                //     createdAt: change.fullDocument.createdAt,
                // };

                console.log("New message")
                console.log(change.fullDocument)

                io.to(change.fullDocument._chatId.toString()).emit("newMessage", change.fullDocument);
                break;
        };
    });

    
    const notificationChangeStream = connection.collection("notifications").watch();

    notificationChangeStream.on("change", (change) => {
        switch (change.operationType) {
            case "insert":
                // const newMessage = {
                //     _messageId: change.fullDocument._id,
                //     _chatId: change.fullDocument._chatId,
                //     _userId: change.fullDocument._userId,
                //     content: change.fullDocument.content,
                //     username: change.fullDocument.username,
                //     createdAt: change.fullDocument.createdAt,
                // };

                io.to(change.fullDocument._receivingUserId.toString()).emit("newNotiication", change.fullDocument);
                break;
        };
    });

})

    


// // //schedule deletion of thoughts at midnight
// // cron.schedule("0 0 0 * * *", async () => {
// //     await connection.collection("thoughts").drop();
  
// //     io.of("/api/socket").emit("thoughtsCleared");
// //   });
  
// //   connection.on("error", (error) => console.log("Error: " + error));