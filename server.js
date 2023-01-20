const DEBUG = false

var myArgs = process.argv.slice(2)
if (myArgs.length < 2) {
    console.log("Error: Please, provide power meter Id's ")
    return
}


var PowerMeterA_Id = myArgs[0]
var PowerMeterB_Id = myArgs[1]

if (!myArgs[2]) {
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


AntPlusStick.on('startup', function () {
    console.log("Ant+ device ready")
    console.log("Averaging measures to " + average_factor + " seconds \n")

})

if (!AntPlusStick.open()) {
    console.log("Ant+ device not found!")
}

PowerMeterA.on('powerData', AntData => {
    let timeA = Date.now(); //Time of measure
    measureBufferA.push(AntData.Power)
    if (timeA - start_timeA > average_factor * 1000) {
        if(measureBufferA.length > 0) {
            AntData.timestamp = timeA;
            AntData.Power = average(measureBufferA)
            AntData.Averaging = average_factor
            let data2send = JSON.stringify({ "measures0": AntData })
            if (DEBUG) console.log("[" + new Date(start_timeA) + "] " + data2send)
            if (sockets[0]) sockets[0].send(data2send)
            start_timeA = timeA
            measureBufferA = []
        }
    } 
})

PowerMeterA.on('error', err => {

})

PowerMeterB.on('powerData', AntData => {
    let timeB = Date.now(); //Time of measure
    measureBufferB.push(AntData.Power)
    if (timeB - start_timeB > average_factor * 1000) {
        if(measureBufferB.length > 0) {
            AntData.timestamp = timeB;
            AntData.Power = average(measureBufferB)
            AntData.Averaging = average_factor
            let data2send = JSON.stringify({ "measures1": AntData })
            if (DEBUG) console.log("[" + new Date(start_timeB) + "] " + data2send)
            if (sockets[0]) sockets[0].send(data2send)
            start_timeB = timeB
            measureBufferA = []
        }
    } 
})

PowerMeterB.on('error', err => {

})
// HTTP server
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const multer = require('multer')
const fs = require('fs');

//MULTER Config

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        
        cb(null, file.originalname)
    }

})

var upload = multer({ storage: storage })

const port = 8090
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static(__dirname + "/public"))

app.get('/', function (req, res) {

    res.sendFile('index.html')
})
app.get('/filecompare', function (req, res) {
    res.sendFile(__dirname + '/public/filecompare.html')
})

app.post('/upload', upload.array('inputfit', 12), (req, res, next) => {
    console.log(req)
    const files = req.files
    if (!files) {
        const error = new Error('No files')
        error.httpStatusCode = 400
        return next(error)
    }
    res.json(files);
})

app.get('/docompare/:file', function (req, res) {
    
    console.log("Do Compare")
    
    const PwrParser = require("./pwrParser");
    var file = __dirname+'/uploads/'+req.params.file;
    var pwrParser = new PwrParser.FitParser(file);
    let rawBuffer = pwrParser.getRawData();

    pwrParser.parseRawData(rawBuffer).then(function (data) {
        pwrParser
            .getPower(data)
            .then(function (data) {
                //console.log(data)
                var sum = 0;
                var elem = data.length
                data.forEach(entry => {
                    sum += entry.power
                })
                res.json(data);
            })
    });

    

})

app.listen(port, function () {
    console.log("App running http://localhost:" + port)
});

//WebSocket Server
const sockets = [];
const WebSocket = require('ws')
const ws_port = 8091;
const wss = new WebSocket.Server({
    port: ws_port
});

wss.on('connection', function connection(ws) {
    console.log('Client connected')
    sockets[0] = ws
    ws.on('message', function incoming(message) {
        console.log('Received: %s', message)
        switch(message){
            case 'start':
                console.log("Attaching devices")
                PowerMeterA.attach(0, PowerMeterA_Id)
                PowerMeterB.attach(1, PowerMeterB_Id)
                break;
            case 'stop':
                
                console.log("Dettaching devices")
                PowerMeterA.detach()
                PowerMeterB.detach()
                break;
        }
    })
    ws.send(JSON.stringify({ "devices": [PowerMeterA_Id, PowerMeterB_Id] }))
})

function average(powerData) {

    const checkEqual = powerData => powerData.every(v => v === powerData[0])
    var measures = powerData.length
    var sum = 0;
    for (var i = 0; i < measures; i++) {
        sum += powerData[i]
    }
    if (checkEqual(powerData) === true) {
        frozenWatts++;
    } else {
        frozenWatts = 0;
    }
    if (frozenWatts > 1) {
        //Favero Assioma curiosity 
        //Asuming if two buffers have all the measures equal we are not pedaling.
        return 0
    } else {
        return (sum / measures)
    }
}



