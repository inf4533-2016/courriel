var express = require("express");
var app = express();
app.use("/", function(req,res) {
    console.log("Une requette est là...");
    res.send("OK!!");
});
app.listen(8888);
