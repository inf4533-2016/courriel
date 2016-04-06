var $ = require('jquery');
var ld = require('lodash');
var NodeRSA = require('node-rsa');
var CryptoJS = require('crypto-js');
var superagent = require('superagent');

var header = $('#header');
var body = $('#body');
var footer = $('#footer');

header.append("c'est entête...");

body.append( $('<div>').append('... eh body'));

footer.append('... footer');

var password = prompt("Pass phrase");

var key = null;
if (ld.isEmpty(encryptedKey)) {
    key = new NodeRSA({b: 512});
    encryptedKey = CryptoJS.AES.encrypt(key.exportKey(), password).toString();
    superagent
        .post("/storeEncryptedKey")
        .send({encryptedKey: encryptedKey} )
        .end(console.log.bind(console));
} else {
    !function (pem) {
        key = new NodeRSA(pem);
    } (CryptoJS.AES.decrypt(encryptedKey, password).toString(CryptoJS.enc.Utf8));
}
console.log(key.exportKey());

