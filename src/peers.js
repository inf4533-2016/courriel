var request = require("superagent");
var ld = require("lodash");

var get_state = function( etat, url ) {
  request
    .get(url)
    .send()
    .end( function(err, data) {
      if (err) return console.warn(err);
      var remoteEtat = data.body;
      etat.letters = ld.map( ld.assign( {},
        ld.keyBy(remoteEtat.letters, "msg"),
        ld.keyBy(etat.letters, "msg")
      ));
      etat.yp = ld.assign({}, remoteEtat.yp, etat.yp);
    });
}

module.exports = function( etat, peers, everySecs) {
  var everyMillisecs = (everySecs || 20) * 1000;
  peers.forEach( function(url) {
    setInterval(get_state.bind(null, etat, url), everyMillisecs);
  });
}
