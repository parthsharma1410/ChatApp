const path = require('path');
const mongo = require('mongodb').MongoClient;
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');
const { connect } = require('http2');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chatapp Bot';

mongo.connect('mongodb/127.0.0.1/Chatapp');

io.on('connection', socket=>{
    socket.on('joinRoom', ({ username, room }) =>{
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        console.log('New connction established');

        socket.emit('message', formatMessage(botName, 'Welcome'));
    
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));//emit to everybody except the user that is connecting
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
  


    socket.on('chatMessage', msg =>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
    socket.on('disconnect', () =>{
        const user = userLeave(socket.id);

        if(user)
        {

            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server started at port ${PORT}`));