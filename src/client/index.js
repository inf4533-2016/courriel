var $ = require('jquery');
var forge = require('./forge');

var header = $('#header');
var body = $('#body');
var footer = $('#footer');

header.append("c'est entête...");

body.append( $('<div>').append('... eh body'));

footer.append('... footer');

