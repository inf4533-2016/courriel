var $          = require('jquery');
var NodeRSA    = require('node-rsa');
var CryptoJS   = require('crypto-js');
var superagent = require('superagent');

var $focus = $('#focus');
var $body  = $('#body');

var key = null;
var etat = null;
var decryptedLetters = [];

var decryptMessage = function( msg ) {
    var resultat = "Failed to decrypt";
    try {
        resultat = key.decrypt(msg, 'utf8');
    } catch (e) {
        console.warn("Problem: " + e);
    }
    return resultat;
}

var populateDecryptedLetters = function() {
    myPublicKey = key.exportKey('public');
    decryptedLetters = [];
    etat.letters.forEach( function( letter ) {
        if (letter.to == myPublicKey) {
            decryptedLetters.push( {
                date: letter.date,
                msg: decryptMessage(letter.msg)
            });
        }
    });
};
var reload = function( cb ) {
    if (! cb )
        cb = function(){};
    superagent
        .get("/etat")
        .send()
        .end( function(err, res) {
            if (err) return cb(err);
            etat = res.body;
            cb(null);
        });
}

var addAddress = function(name, pem) {
    // var pem = prompt("Public key");
    if (! pem ) {
        var randomKey = new NodeRSA({b: 512});
        pem = randomKey.exportKey('public');
    }
    etat.yp[pem] = {name: name, pem: pem};
    superagent
        .post("/addAddress")
        .send({pem:pem, name:name})
        .end(console.log.bind(console));
};

var newMessage = function(text, address) {
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
    switch($focus.val()) {
    case "inbox" :
        var $list = $('<ul>');
        decryptedLetters.forEach( function(letter) {
            $list.append($('<li>').append(
                $('<a href="#">').append("Date: "+letter.date).click(function(){
                    alert("Sent: "+letter.date+"\n\n"+ letter.msg);
                }))
            );
        });
        var $reload = $('<button>').append("Reload")
            .click(function(){ reload( populateDecryptedLetters ) });
        $content =  [$list, $reload];
        break;
    case "write" :
        var $textarea = $('<textarea>');
        var $newMessage = $('<button>').append("New Message")
            .click(function(){
                newMessage($textarea.val(), key.exportKey('public'));
                $textarea.val("");
                reload( populateDecryptedLetters );
            } );
        $content = [ "Compose a new message...", $textarea, $newMessage ];
        break;
    case "yp" :
        var $list = $('<ul>');
        Object.keys(etat.yp).forEach( function(pem) {
            var entry = etat.yp[pem];
            $list.append($('<li>').append(
                $('<a href="#">').append(entry.name).click(function(){
                    alert(JSON.stringify(entry));
                }))
            );
        });
        var $newAddress = $('<button>').append("New Address")
            .click(function(){ addAddress("user_" + Object.keys(etat.yp).length); redraw_view(); });
        $content =  ["Address book...", $list, $newAddress ];
        break;
    };
    $body.empty().append($content);
};

$focus.change( redraw_view );


reload( function(err) {
    if (err) return console.error(err);
    if (! etat.encryptedKey) {
        // we do not have our key yet
        key = new NodeRSA({b: 512});
        password = prompt("New password");
        etat.encryptedKey = CryptoJS.AES.encrypt(key.exportKey(), password)
            .toString();
        superagent
            .post("/storeEncryptedKey")
            .send({encryptedKey: etat.encryptedKey})
            .end(console.log.bind(console));
        // add my public key to the yp
        addAddress("me", key.exportKey('public'));
    } else while (true) {
        var pem = null;
        try {
            password = prompt("Password check:");
            pem = CryptoJS.AES.decrypt(etat.encryptedKey, password)
                .toString(CryptoJS.enc.Utf8);
            key = new NodeRSA(pem);
            break;
        } catch (e) {
            alert("Try again...");
        }
    }

    // build decrypted list of messages
    populateDecryptedLetters();
    redraw_view();
});
