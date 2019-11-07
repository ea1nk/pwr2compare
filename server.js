// HTTP server
const express = require('express');
const app = express();
const port = 8090;
app.use(express.static(__dirname + "/public"));
app.use('*', function(req, res){
    //Static Server
})

app.listen(port, function(){
    console.log("App running http://localhost:" + port);
});

//WebSocket Server

const WebSocket = require('ws');
const ws_port = 8091;
const wss = new WebSocket.Server({
    port:ws_port
});

wss.on('connection', function connection(ws){
    console.log('Client connected');

    ws.on('message', function incoming(message){
        console.log('Received: %s', message);
    })
})