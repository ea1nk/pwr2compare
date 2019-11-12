//ANT+ receiver
const Ant = require('ant-plus');
let AntPlusStick = new Ant.GarminStick2();
let PowerMeterA = new Ant.BicyclePowerSensor(AntPlusStick);
let PowerMeterB = new Ant.BicyclePowerSensor(AntPlusStick);
const PowerMeterA_Id = 847; //Tacx Neo
const PowerMeterB_Id = 22043; //Assioma Duo
var average_factor = 3 //3 sec averaging
var start_time = Date.now()
var measureBuffer = []

AntPlusStick.on('startup', function(){
    console.log("Ant+ device ready");
    console.log("Averaging measures to " + average_factor + " seconds \n")
    PowerMeterA.attach(0,PowerMeterA_Id);
    PowerMeterB.attach(1,PowerMeterB_Id);

})

if(!AntPlusStick.open()){
    console.log("Ant+ device not found!");
}

PowerMeterA.on('powerData', AntData =>{
    
    let time = Date.now(); //Time of measure
    if(time - start_time > average_factor*1000){
        AntData.timestamp = time;
        AntData.Power = average(measureBuffer)
        AntData.Averaging = average_factor
        let data2send = JSON.stringify({"measures0":AntData})
        console.log("["+ new Date(start_time) + "] " + data2send)
        if(sockets[0]) sockets[0].send(data2send)
        start_time = time
        measureBuffer = []
    } else {
        measureBuffer.push(AntData.Power)
    }
    
})

PowerMeterA.on('error', err =>{
    
})

PowerMeterB.on('powerData', AntData =>{
    
    let time = Date.now(); //Time of measure
    if(time - start_time > average_factor*1000){
        AntData.timestamp = time;
        AntData.Power = average(measureBuffer);
        AntData.Averaging = average_factor
        let data2send = JSON.stringify({"measures1":AntData})
        console.log("["+ new Date(start_time) + "] " + data2send)
        if(sockets[0]) sockets[0].send(data2send);
        start_time = time
        measureBuffer = []
    } else {
        measureBuffer.push(AntData.Power)
    }
})

PowerMeterB.on('error', err =>{

})
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
const sockets = [];
const WebSocket = require('ws');
const ws_port = 8091;
const wss = new WebSocket.Server({
    port:ws_port
});

wss.on('connection', function connection(ws){
    console.log('Client connected');
    sockets[0] = ws;
    ws.on('message', function incoming(message){
        console.log('Received: %s', message);
    })
    ws.send(JSON.stringify({"devices":[PowerMeterA_Id, PowerMeterB_Id]}))
})

function average(powerData){
    var measures = powerData.length;
    var sum = 0;
    for(var i=0;i<measures;i++){
        sum += powerData[i]
    }

    return(sum/measures);
}