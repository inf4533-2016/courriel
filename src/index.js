var express = require("express");
var bp = require('body-parser');

var app = express();

app.locals.pretty = true;

app.get("/", function(req,res) {
    console.log("Une requette est là...");
    res.send("OK!!");
});
app.get("/2", function(req,res) {
    res.send("2");
});
app.get("/4", function(req,res) {
    res.send("4");
});
app.get("/3/123/akaka/qq", function(req,res) {
    res.send("3");
});

app.get("/nums/:n", function(req,res) {
    res.send(" -> " + req.params.n);
});

app.get("/jade", function(req,res) {
    res.render("fichier.jade", {
        nom: "Fraczak",
        prenom: "Wojtek",
        toto: [1,2,3,4],
        f: function(x){ return x+x;}
    });
});

app.use(bp.json());

app.post("/post", function(req,res) {
    console.log("iiiiiiiii");
    res.json({
        status: true,
        body: req.body
    });
});

app.listen(8888);
