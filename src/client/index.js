var $ = require('jquery');
var ld = require('lodash');
var NodeRSA = require('node-rsa');
var CryptoJS = require('crypto-js');
var superagent = require('superagent');

var $header = $('#header');
var $focus = $('#focus'); 
var $body = $('#body');

var key = null;
var etat = null;


var addAddress = function() {
    var name = prompt("Name");
    var pem = prompt("Public key");
    if (ld.isEmpty(pem)) {
        var randomKey = new NodeRSA({b: 512});
        pem = randomKey.exportKey('public');
    }
    etat.yp[pem] = {name: name};
    superagent
        .post("/addAddress")
        .send({pem:pem, name:name})
        .end(console.log.bind(console));
};

var newMessage = function($textarea) {
    var text = $textarea.val();
    var address = Object.keys(etat.yp)[0];
    var pubKey = new NodeRSA(address);
    var msg = {date:new Date(), to: address, msg: pubKey.encrypt(text,'base64')};
    console.log(JSON.stringify(msg, null, 2));
    superagent
        .post("/postMessage")
        .send(msg)
        .end(console.log.bind(console));
}

var redraw_view = function() {
    var $content;
    var $newAddress;
    var $newMessage;
    var $textarea;
    switch($focus.val()) {
    case "inbox" :
        $content =  ["List of messages..."];
        break;
    case "write" :
        $textarea = $('<textarea>');
        $newMessage = $('<button>').append("New Message").click(newMessage.bind(null, $textarea) );
        $content = [ "Compose a new message...", $textarea, $newMessage ];
        break;
    case "yp" :
        $newAddress = $('<button>').append("New Address").click(addAddress);
        $content =  ["Address book...", $newAddress ];
        break;
    };
    $body.empty().append($content);
};

$focus.change( redraw_view );

superagent
    .get("/etat")
    .send()
    .end( function(err, res) {
        if (err) {
            console.error(err);
        } else {
            etat = res.body;
            var password = null;
            if (ld.isEmpty(etat.encryptedKey)) {
                key = new NodeRSA({b: 512});
                password = prompt("New pass phrase");
                etat.encryptedKey = CryptoJS.AES.encrypt(key.exportKey(), password).toString();
                superagent
                    .post("/storeEncryptedKey")
                    .send({encryptedKey: etat.encryptedKey} )
                    .end(console.log.bind(console));
            } else {
                while (true) {
                    var pem = null;
                    try {
                        password = prompt("Your pass phrase");
                        pem = CryptoJS.AES.decrypt(etat.encryptedKey, password).toString(CryptoJS.enc.Utf8);
                        key = new NodeRSA(pem);
                        break;
                    } catch (e) {
                        alert("Try again...");
                    }
                }
            }
            console.log(key.exportKey());
        };
        redraw_view();
    });
