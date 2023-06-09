const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const path = require('path')
const db = require('./config/db')
const route = require('./routers')
const chalk = require('chalk');
const ip = require("ip");
const bodyParser = require('body-parser');
const session = require('express-session');
const { Server } = require('socket.io')
const cors = require('cors');
const app = express()
const loggerMiddleware = require('./middlewares/LoggerMiddleware')


// Configure the session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Using cors middleware
app.use(cors({
  origin: '*',
  method: ['POST, GET, PUT, DELETE']
}));

// Set the "public" folder as the static directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
// Parse JSON-encoded bodies
app.use(express.json())

// Use winston logger
app.use(loggerMiddleware);

db.connect();
db.config();

route(app)

const PORT = process.env.PORT || 8080

const server = app.listen(PORT, () => {
  console.log('Server is running');
  console.log('On local: ' + chalk.blue(`127.0.0.1:${PORT}`))
  console.log('On your network: ' + chalk.blue(`${ip.address()}:${PORT}`))
})

const io = new Server(server, {
  pingTimeout: 60000,
})

io.on("connection", (socket) => {

  socket.on('setup', (userData) => {
    if (userData) {
      socket.join(userData._id);
      socket.emit(`connected`)
      console.log("user connected to: ", userData._id)
    }
  })

  socket.on('join chat', (room) => {
    socket.join(room)
    console.log('user joined room: ', room);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessage) => {
    let chat = newMessage.chat;

    if (!chat.users) return console.log('chat.users not defined');

    chat.users.forEach(user => {

      if (user._id == newMessage.sender._id) return;

      socket.in(user._id).emit('message received', newMessage)
      console.log('send message to socket:', user._id)
    });
  })

})
