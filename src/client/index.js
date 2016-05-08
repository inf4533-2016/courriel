var $          = require('jquery');
var NodeRSA    = require('node-rsa');
var CryptoJS   = require('crypto-js');
var superagent = require('superagent');

//état de navigation
var Navigation = {
	COMPOSE			: 0,
	INBOX			: 1,
	INBOX_READ_MSG	: 2,
	OUTBOX			: 3,
	OUTBOX_READ_MSG	: 4,
	YP				: 5
};

var focus =  Navigation.INBOX;

var key = null;
var etat = null;
var inboxLetters = [];
var outboxLetters = [];

var from = "";
var to   = "";
var date = "";
var msg  = "";

var decryptMessage = function( msg) {
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
    inboxLetters = [];
	outboxLetters = [];
    etat.letters.forEach( function( letter ) {
        if (letter.to == myPublicKey) {
            inboxLetters.push( {
				'to':letter.to,
				'from':letter.from,
                'date': letter.date,
                'msg': decryptMessage(letter.msgTo)
            });
        }
		else if(letter.from == myPublicKey) {
			outboxLetters.push( {
				'to':letter.to,
				'from':letter.from,
                'date': letter.date,
                'msg': decryptMessage(letter.msgFrom)
            });
		}
    });
};

var onReload = function( cb ) {
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
        .post("/add_save")
        .send({pem:pem, name:name})
        .end(console.log.bind(console));
};

var newMessage = function(text, address) {
    var pubKey = new NodeRSA(address);
	var myPubKey = new NodeRSA(myPublicKey);
    var msg = {'date': getCurrentDateTimeText(), 'from': myPublicKey,'to': address, 'msgTo': pubKey.encrypt(text,'base64'), 'msgFrom': myPubKey.encrypt(text,'base64')};
    console.log(JSON.stringify(msg, null, 2));
    superagent
        .post("/compose_send")
        .send(msg)
        .end(console.log.bind(console));
}


var onRedrawView = function() {
    var content = [];
    switch(focus) {
    case Navigation.COMPOSE:
		content.push("<table>");
		content.push(" 	<tr>");
		content.push(" 		<td class='bold'> To: </td>");
		content.push(" 		<td>");
		content.push("       	<select name='compose-select-to'>");

		Object.keys(etat.yp).map( function( addr ) {
			content.push("          		<option value='" + addr + "'>" + etat.yp[addr].name + "</option>");
        });
		
		content.push("       	</select>");
		content.push("     	</td>");
		content.push("  </tr>");
		content.push("  <tr>");
		content.push("    	<td class='bold'> Message: </td>");
		content.push("    	<td>");
		content.push("      	<textarea name='compose-textarea-message' cols='40' rows='5' placeholder='Type your message here...'></textarea>");
		content.push("    	</td>");
		content.push("  </tr>");
		content.push("  <tr>");
		content.push("    	<td></td>");
		content.push("    	<td>");
		content.push("      	<a id='compose-link-send' class='blue-theme' href='#'>Send</a>");
		content.push("    	</td>");
		content.push("  </tr>");
		content.push("</table>");
		
		$('#top-right-region').html('Compose new message');		
		$('#bottom-right-region').html(content.join("\n"));
		
		$('#compose-link-send').click(function() {
			stopPeriodicalRefresh();
			$textarea = $('[name="compose-textarea-message"]');
			$to = $('[name="compose-select-to"]');
			newMessage($textarea.val(), $to.val());
			$textarea.val("");
			onReload( populateDecryptedLetters );
		});
		
        break;
    case Navigation.INBOX:
		if(inboxLetters.length > 0) {
			content.push("<table>");
			content.push(" <thead>");
			content.push("   <tr>");
			content.push("     <td>From</td>");
			content.push("     <td>Date</td>");
			content.push("     <td>Action</td>");
			content.push("   </tr>");
			content.push(" </thead>");
			content.push(" <tbody>");
			
			inboxLetters.forEach( function(letter) {
				content.push("    <tr>");
				content.push("		<td>" + etat.yp[letter.from].name + "</td>");
				content.push("		<td>" + letter.date + "</td>");
				content.push("      <td><a class='inbox-link-letter' href='#' data-from='"  + etat.yp[letter.from].name + "' data-date='" + letter.date + "' data-msg='" + letter.msg + "' >Read</a></td>");
				content.push("    </tr>");
			});
					
			content.push(" </tbody>");
			content.push("</table>");
		}
		else {
			content.push("Your inbox is empty");
		}

		$('#top-right-region').html('Inbox');	
		$('#bottom-right-region').html(content.join("\n"));
		
		$('.inbox-link-letter').click(function() {
			stopPeriodicalRefresh();
			from = $(this).data('from');
			date = $(this).data('date');
			msg  = $(this).data('msg');
			
			focus =  Navigation.INBOX_READ_MSG;
			onRedrawView();
		});
        break;
	case Navigation.INBOX_READ_MSG:
		content.push("<table>");
		content.push(" <tr>");
		content.push("   <td class='bold'>From:</td>");
		content.push("   <td>" + from + "</td>");
		content.push("	</tr>");
		content.push(" <tr>");
		content.push("   <td class='bold'>Date:</td>");
		content.push("   <td>" + date + "</td>");
		content.push("	</tr>");
		content.push(" <tr>");
		content.push("   <td class='bold'>Message:</td>");
		content.push("   <td>" + msg + "</td>");
		content.push("	</tr>");
		content.push("</table>");
		
		$('#top-right-region').html('Inbox message');	
		$('#bottom-right-region').html(content.join("\n"));
		
		break;
    case Navigation.OUTBOX:
		if(outboxLetters.length > 0) {
			content.push("<table>");
			content.push(" <thead>");
			content.push("   <tr>");
			content.push("     <td>To</td>");
			content.push("     <td>Date</td>");
			content.push("     <td>Action</td>");
			content.push("   </tr>");
			content.push(" </thead>");
			content.push(" <tbody>");
			
			outboxLetters.forEach( function(letter) {
				content.push("    <tr>");
				content.push("		<td>" + etat.yp[letter.to].name + "</td>");
				content.push("		<td>" + letter.date + "</td>");
				content.push("      <td><a class='outbox-link-letter' href='#' data-to='"  + etat.yp[letter.to].name + "' data-date='" + letter.date + "' data-msg='" + letter.msg + "' >Read</a></td>");
				content.push("    </tr>");
			});
					
			content.push(" </tbody>");
			content.push("</table>");
		}
		else {
			content.push("Your outbox is empty");
		}
		
		$('#top-right-region').html('Outbox');	
		$('#bottom-right-region').html(content.join("\n"));
		
		$('.outbox-link-letter').click(function() {
			stopPeriodicalRefresh();
			to   = $(this).data('to');
			date = $(this).data('date');
			msg  = $(this).data('msg');
			
			focus =  Navigation.OUTBOX_READ_MSG;
			onRedrawView();			
		});
		
        break;
	case Navigation.OUTBOX_READ_MSG:
		content.push("<table>");
		content.push(" <tr>");
		content.push("   <td class='bold'>To:</td>");
		content.push("   <td>" + to + "</td>");
		content.push("	</tr>");
		content.push(" <tr>");
		content.push("   <td class='bold'>Date:</td>");
		content.push("   <td>" + date + "</td>");
		content.push("	</tr>");
		content.push(" <tr>");
		content.push("   <td class='bold'>Message:</td>");
		content.push("   <td>" + msg + "</td>");
		content.push("	</tr>");
		content.push("</table>");
		
		$('#top-right-region').html('Outbox message');	
		$('#bottom-right-region').html(content.join("\n"));
	
		break;
    case Navigation.YP:
		content.push("<table>");
		content.push(" <thead>");
		content.push("   <tr>");
		content.push("     <td>Address</td>");
		content.push("   </tr>");
		content.push(" </thead>");
		content.push(" <tbody>");

		Object.keys(etat.yp).forEach( function(pem) {
            var entry = etat.yp[pem];
			
			content.push("    <tr>");
			content.push("      <td>" + entry.name + "</td>");
			content.push("    </tr>");
        });

		content.push(" </tbody>");
		content.push("</table>");
		
		$('#top-right-region').html('Address Book');	
		$('#bottom-right-region').html(content.join("\n"));

        break;
    };
};


$('#compose-link').click(function() {
	stopPeriodicalRefresh();
	focus =  Navigation.COMPOSE;
	
	onReload( function() {
	  populateDecryptedLetters();
	  onRedrawView();
	});
	
	$('#compose-link').addClass('active');
	$('#inbox-link').removeClass('active');
	$('#outbox-link').removeClass('active');
	$('#yp-link').removeClass('active');
});

$('#inbox-link').click(function() {
	startPeriodicalRefresh();
	focus =  Navigation.INBOX;
	onReload( function() {
	  populateDecryptedLetters();
	  onRedrawView();
	});
	
	$('#compose-link').removeClass('active');
	$('#inbox-link').addClass('active');
	$('#outbox-link').removeClass('active');
	$('#yp-link').removeClass('active');
});

$('#outbox-link').click(function() {
	stopPeriodicalRefresh();
	focus =  Navigation.OUTBOX;
	onReload( function() {
	  populateDecryptedLetters();
	  onRedrawView();
	});
	
	$('#compose-link').removeClass('active');
	$('#inbox-link').removeClass('active');
	$('#outbox-link').addClass('active');
	$('#yp-link').removeClass('active');
});

$('#yp-link').click(function() {
	stopPeriodicalRefresh();
	focus =  Navigation.YP;
	onReload( function() {
	  populateDecryptedLetters();
	  onRedrawView();
	});
	
	$('#compose-link').removeClass('active');
	$('#inbox-link').removeClass('active');
	$('#outbox-link').removeClass('active');
	$('#yp-link').addClass('active');
});

onReload( function(err) {
    if (err) return console.error(err);
    if (! etat.encryptedKey) {
        // we do not have our key yet
        key = new NodeRSA({b: 512});
        var name = prompt("Please enter your name","");
        password = prompt("Please enter your new password","");
        etat.encryptedKey = CryptoJS.AES.encrypt(key.exportKey(), password)
            .toString();
        superagent
            .post("/storeEncryptedKey")
            .send({encryptedKey: etat.encryptedKey})
            .end(console.log.bind(console));
        // add my public key to the yp
        addAddress((name || "me"), key.exportKey('public'));
		startPeriodicalRefresh();
    } else while (true) {
        var pem = null;
        try {
            password = prompt("Please enter your password to proceed","");
            pem = CryptoJS.AES.decrypt(etat.encryptedKey, password)
                .toString(CryptoJS.enc.Utf8);
            key = new NodeRSA(pem);
			startPeriodicalRefresh();
            break;
        } catch (e) {
            alert("Please try again...");
        }
    }

    // build decrypted list of messages
    populateDecryptedLetters();
    onRedrawView();
});

var timer = null;

var startPeriodicalRefresh = function() {
	if (timer !== null) return;
	timer = setInterval(function () {
		onReload( function() {
		  populateDecryptedLetters();
		  onRedrawView();
		});
	}, 2000); 
}

var stopPeriodicalRefresh = function() {
	clearInterval(timer);
	timer = null;
}


/**
 * Fonction pour arranger l'affichage de la date de cet instant.
 *
 * @return {String} la data bien arrangé selon le format "yyyy MM dd hh:mm:ss"
 */
var getCurrentDateTimeText = function (){
	var today = new Date();
	var yyyy = today.getFullYear();
	var mm = today.getMonth()+1;
	var dd = today.getDate();
	var hh = today.getHours();
	var MM = today.getMinutes();
	var ss = today.getSeconds();
	
	if(dd < 10) {
		dd = '0' + dd;
	}
	
	if(mm < 10) {
		mm = '0' + mm;
	} 
	
	if(hh < 10) {
		hh = '0' + hh;
	}
	
	if(MM < 10) {
		MM = '0' + MM;
	} 
	
	if(ss < 10) {
		ss = '0' + ss;
	} 
	
	return yyyy + " " +  mm + " " + dd + " " + hh + ":" + MM + ":" + ss;     
};