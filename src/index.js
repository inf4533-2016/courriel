var express = require("express");
var body_parse  = require('body-parser');

var app = express();

var encryptedKey = null;

app.locals.pretty = true;

app.get("/", function(req,res) {
    res.render("courriel.jade", {
        encryptedKey:encryptedKey 
    });
});

app.post("/storeEncryptedKey", body_parse.json(), function(req,res) {
    encryptedKey = req.body.encryptedKey;
    console.log(encryptedKey);
    res.json({msg:"ok"});
});

app.use(express.static('public'));
app.listen(8888);
