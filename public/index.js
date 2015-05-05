$(function() {
	Parse.initialize("QiBm2HnPMQX3YGfoEPQ9GH6PY8CVfWjmVjKjSd2a", "2KarZTUNIPakmdrBnngGXqfbg2Tfy7f6Rubo2swv");
	
	var Crash = Parse.Object.extend("Crash", {}, {
		record: function(description) {
			var crash = new Crash();
			crash.set('user', Parse.User.current());
			crash.save(null, {
				success: updateCrashes,
				error: function(crash, error) {
					console.log(error);
				}
			});
		}
	});

	var updateCrashes = function() {
		new Parse.Query(Crash).count({
			success: function(newCount) {
				var currentCount = $('#crashes').text();
				if (currentCount != newCount) {
					$('#crashes').text(newCount).addClass('bounce').on('animationend webkitAnimationEnd mozAnimationEnd', function() {
						$(this).removeClass('bounce');
					});
				}
			},
			error: function(error) {
				console.log(error);
			}
		});
	}

	var updateLogin = function() {
		if (Parse.User.current()) {
		    $('#login-container').hide()
		    $('#record-container').show()
		} else {
		    $('#login-container').show()
		    $('#record-container').hide()
		}
	}

	updateLogin();
	updateCrashes();

	setInterval(updateCrashes, 5000);

	$('#record-crash').on('click', function() {
		Crash.record('test crash');
	});

	$('#login').on('click', function() {
		Parse.FacebookUtils.logIn(null, {
		  success: function(user) {
		  	updateLogin()
		  	FB.api('/me', function(response) {
		  		var user = Parse.User.current();
		  		user.set('name', response.name);
		  		user.save();
		  	});
		  }
		});
	});
});
