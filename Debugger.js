/**
 * Created by Steven Houben (s.houben@ucl.ac.uk) - 2016
 */

//Debug purposes
var moment = require('moment');
var fs = require('fs');
var colors = require('colors');
var sprintf=require("sprintf-js").sprintf;

exports.output = false;
exports.details = false;
exports.disablePhysikitCalls = false;
exports.dataLog = function(source,type,msg){
    var data = {};
    data.sender = source;
    data.type = type;
    data.msg = msg;
    data.time = moment().format("D MMM HH:mm:ss:ms");
}

exports.log = function(text,source,type) {

    var time = moment().format("D MMM HH:mm:ss") + " - ";

    var cLength= process.stdout.columns;
    var tLength = time.length;

    var sender = source != undefined ? "[" + source + "] ":"";

    var msg = sender + text;

    switch(type) {
        case "Error":
            msg = msg.red;
            time = time.bgRed;
            break;
        case "Success":
            msg = msg.green;
            time = time.bgGreen;
            break;
        case "Danger":
            msg = msg.yellow;
            time = time.bgYellow;
        default:
            msg = msg.white;
            time =  time.bgBlack;
    }

    var length = cLength-tLength-1;
    var msgs = msg.chunk(length);

    for (var i = 0, len = msgs.length; i < len; i++) {
        if(i==0)
            console.log(time + msgs[i]);
        else console.log(new Array(tLength+1).join( " " ) + msgs[i]);
    }


}
String.prototype.chunk = function(size) {
    return [].concat.apply([],
        this.split('').map(function(x,i){ return i%size ? [] : this.slice(i,i+size) }, this)
    )
}
exports.spacer = function() {
    console.log(moment().format("D MMM HH:mm:ss") + " - " + "---------------------------------------");
}