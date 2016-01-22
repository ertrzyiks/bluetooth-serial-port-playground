var inquirer = require('inquirer');
var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var express = require("express");
var bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.json());
app.use('/', express.static('public'));

btSerial.listPairedDevices(function (devices) {
    var choices = devices.map(function (device) {
        return {
            name: device.address + " (" + device.name + ")",
            value: device.address
        }
    });

    var prompts = [{
        name: "device",
        type: "list",
        message: "Select device",
        choices: choices
    }];

    inquirer.prompt(prompts, function (res) {
        var address = res.device;

        btSerial.findSerialPortChannel(address, function (channel) {
            btSerial.connect(address, channel, function () {

                app.post("/signal", function (req, res) {
                    btSerial.write(new Buffer("" + req.body.state, 'utf-8'), function(err, bytesWritten) {
                        if (err) console.log(err);

                        res.send("OK " + JSON.stringify(req.body.state))
                    });
                });

                btSerial.on('data', function(buffer) {
                    console.log(buffer.toString('utf-8'));
                });

                console.log("Listening on localhost:3000");
                app.listen(3000);
            }, function (err) {
                console.log("CANNOT CONNECT", err);
            });

            btSerial.close();
        }, function () {
            console.log("NOTHING FOUND");
        });
    });
});


