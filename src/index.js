var express = require("express");
var body_parse  = require('body-parser');

var app = express();

app.locals.pretty = true;

app.get("/", function(req,res) {
    res.render("courriel.jade", {
        encryptedKey: "Fraczak"
    });
});

app.use(express.static('public'));
app.listen(8888);
