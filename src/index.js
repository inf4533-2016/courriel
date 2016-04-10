var express = require("express");
var body_parse  = require('body-parser');
var json_file_object = require("json-file-object");

var app = express();

var etat = json_file_object({
    file: "etat.json",
    value: {
        encryptedKey: null,
        yp: {},
        letters: []
    }
});

app.locals.pretty = true;

app.get("/", function(req,res) {
    res.render("courriel.jade");
});

app.post("/storeEncryptedKey", body_parse.json(), function(req,res) {
    console.log(req.body.encryptedKey);
    etat.encryptedKey = req.body.encryptedKey;
    res.json("ok");
});

app.post("/addAddress", body_parse.json(), function(req,res) {
    etat.yp[req.body.pem] = req.body;
    res.json("Address added");
});


app.post("/postMessage", body_parse.json(), function(req,res) {
    etat.letters.push(req.body);
    res.json("Message posted");
});


app.get("/etat", function(req,res) {
    res.json(etat);
});

app.use(express.static('public'));

app.listen(8888);
