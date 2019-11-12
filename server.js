const DEBUG = false

var myArgs = process.argv.slice(2)
if(myArgs.length < 2){
    console.log("Error: Please, provide power meter Id's ")
    return
}


var PowerMeterA_Id = myArgs[0]
var PowerMeterB_Id = myArgs[1]

if(!myArgs[2]){
    var average_factor = 3 //3 sec averaging default
} else {
    var average_factor = myArgs[2]
}
var start_timeA = Date.now()
var start_timeB = Date.now()
var measureBufferA = []
var measureBufferB = []
var frozenWatts = 0;
//ANT+ receiver
const Ant = require('ant-plus')
let AntPlusStick = new Ant.GarminStick2()
let PowerMeterA = new Ant.BicyclePowerSensor(AntPlusStick)
let PowerMeterB = new Ant.BicyclePowerSensor(AntPlusStick)


AntPlusStick.on('startup', function(){
    console.log("Ant+ device ready")
    console.log("Averaging measures to " + average_factor + " seconds \n")
    PowerMeterA.attach(0,PowerMeterA_Id)
    PowerMeterB.attach(1,PowerMeterB_Id)

})

if(!AntPlusStick.open()){
    console.log("Ant+ device not found!")
}

PowerMeterA.on('powerData', AntData =>{
    let timeA = Date.now(); //Time of measure
    if(timeA - start_timeA > average_factor*1000){
        AntData.timestamp = timeA;
        AntData.Power = average(measureBufferA)
        AntData.Averaging = average_factor
        let data2send = JSON.stringify({"measures0":AntData})
        if(DEBUG) console.log("["+ new Date(start_timeA) + "] " + data2send)
        if(sockets[0]) sockets[0].send(data2send)
        start_timeA = timeA
        measureBufferA = []
    } else {
        measureBufferA.push(AntData.Power)
    }
    
})

PowerMeterA.on('error', err =>{
    
})

PowerMeterB.on('powerData', AntData =>{
    //console.log(AntData);
    let timeB = Date.now(); //Time of measure
    if(timeB - start_timeB > average_factor*1000){
        AntData.timestamp = timeB;
        AntData.Power = average(measureBufferB);
        AntData.Averaging = average_factor
        let data2send = JSON.stringify({"measures1":AntData})
        if(DEBUG) console.log("["+ new Date(start_timeB) + "] " + data2send)
        if(sockets[0]) sockets[0].send(data2send);
        start_timeB = timeB
        measureBufferB = []
    } else {
        measureBufferB.push(AntData.Power)
    }
})

PowerMeterB.on('error', err =>{

})
// HTTP server
const express = require('express')
const app = express()
const port = 8090
app.use(express.static(__dirname + "/public"))
app.use('*', function(req, res){
    //Static Server
})

app.listen(port, function(){
    console.log("App running http://localhost:" + port)
});

//WebSocket Server
const sockets = [];
const WebSocket = require('ws')
const ws_port = 8091;
const wss = new WebSocket.Server({
    port:ws_port
});

wss.on('connection', function connection(ws){
    console.log('Client connected')
    sockets[0] = ws
    ws.on('message', function incoming(message){
        console.log('Received: %s', message)
    })
    ws.send(JSON.stringify({"devices":[PowerMeterA_Id, PowerMeterB_Id]}))
})

function average(powerData){

    const checkEqual = powerData => powerData.every( v => v === powerData[0] )
    var measures = powerData.length
    var sum = 0;
    for(var i=0;i<measures;i++){
        sum += powerData[i]
    }
    if (checkEqual(powerData) === true){
        frozenWatts ++;
    } else {
        frozenWatts = 0;
    }
    if(frozenWatts > 1) {
        //Favero Assioma curiosity 
        //Asuming if two buffers have all the measures equal we are not pedaling.
        return 0 
    } else {
        return(sum/measures)
    }
}
