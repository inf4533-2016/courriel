var express = require("express");
var body_parse  = require('body-parser');
var json_file_object = require("json-file-object");
var peers = require("./peers");

var app = express();

var thisServerPort 	= 8888;	//first server
var peerServerPort 	= 8889;	//second server

var etat = json_file_object({
    file: "etat.json",
    value: {
        encryptedKey: null,
        yp: {},
        letters: []
    }
});

peers(etat, ['http://localhost:' + peerServerPort + '/etat'], 5);

app.locals.pretty = true;

app.get("/", function(req,res) {
    res.render("courriel.jade");
});

app.post("/storeEncryptedKey", body_parse.json(), function(req,res) {
    etat.encryptedKey = req.body.encryptedKey;
    res.json("ok");
});

app.post("/add_save", body_parse.json(), function(req,res) {
    etat.yp[req.body.pem] = req.body;
    res.json("Address added");
});


app.post("/compose_send", body_parse.json(), function(req,res) {
    etat.letters.push(req.body);
    res.json("Message posted");
});


app.get("/etat", function(req,res) {
    res.json(etat);
});

app.use(express.static('public'));

app.listen(thisServerPort);
console.log('Mini-serveur HTTP, courriel running on http://localhost:' + thisServerPort);