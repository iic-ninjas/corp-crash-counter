var Crashes = {
	all: [],
	reasons: [],
	findAll: function(){
		var query = new Parse.Query(Crash);
		return query.find().then(function(crashes) {
			Crashes.all = crashes
			crashes.forEach(function(crash){
				var reason = crash.get('reason')
				if (!_.includes(Crashes.reasons, reason)){
					Crashes.reasons.push(reason);
				}
			});
			if ($('#crash-reason')[0].selectize) {
				$('#crash-reason')[0].selectize.addOption(Crashes.selectizeOptions())
			}
			return crashes
		});
	},
	selectizeOptions: function(){
		return _.map(Crashes.reasons, function(r){
			return { text: r, value: r}
		});
	}
}

var CrashPerDayChart = {
	daysToShow: 14,
	crashesPerDay: {},
	chart: null,
	labels: [],
	dataPoints: [],
	ctx: null,
	calculateDays: function(daysToGoBack){
		var result = []
		var day = moment()
		_.times(daysToGoBack, function(){
			result.push(day._d.toDateString());
			day = day.subtract(1, 'days');
		});
		return result.reverse();
	},
	setup: function(ctx) {
		CrashPerDayChart.ctx = ctx
		CrashPerDayChart.getAllCrashes().then(function(){
			CrashPerDayChart.createChart()
		});
	},
	getAllCrashes: function() {
		return Crashes.findAll().then(function(crashes) {
			crashes.forEach(function(crash){
				CrashPerDayChart.incCrashesOnDay(crash.createdAt)
			});
		});
	},
	createChart: function(){
		var data = CrashPerDayChart.createChartData()
		var chartData = {
			labels: data.labels,
			datasets: [
				{
						label: "Crash Dates",
						fillColor: "rgba(151,187,205,0.2)",
						strokeColor: "rgba(151,187,205,1)",
						pointColor: "rgba(151,187,205,1)",
						pointStrokeColor: "#fff",
						pointHighlightFill: "#fff",
						pointHighlightStroke: "rgba(151,187,205,1)",
						data: data.points
				}
		]};
		CrashPerDayChart.chart = new Chart(CrashPerDayChart.ctx).Line(chartData, {responsive: true});
	},
	incCrashesOnDay: function(date){
		var key = date.toDateString()
		var currentCount = CrashPerDayChart.crashesPerDay[key] || 0
		CrashPerDayChart.crashesPerDay[key] = currentCount + 1
		return CrashPerDayChart.crashesPerDay[key]
	},
	updateCrash: function(){
		if (CrashPerDayChart.chart == null) return
		var newValue = CrashPerDayChart.incCrashesOnDay(moment()._d);
		_.last(CrashPerDayChart.chart.datasets[0].points).value = newValue
		CrashPerDayChart.chart.update();
	},
	update: function(days){
		CrashPerDayChart.daysToShow = days || CrashPerDayChart.daysToShow
		CrashPerDayChart.chart.destroy();
		CrashPerDayChart.createChart();
	},
	createChartData: function(){
		var days = CrashPerDayChart.calculateDays(CrashPerDayChart.daysToShow)
		var dataPoints = []
		_.each(days, function(day){
			dataPoints.push(CrashPerDayChart.crashesPerDay[day] || 0);
		});
		return {
			labels: days,
			points: dataPoints
		};
	}
}

$(function() {
	Parse.initialize("QiBm2HnPMQX3YGfoEPQ9GH6PY8CVfWjmVjKjSd2a", "2KarZTUNIPakmdrBnngGXqfbg2Tfy7f6Rubo2swv");

	var Crash = Parse.Object.extend("Crash", {}, {
		record: function(reason) {
			var crash = new Crash();
			crash.set('user', Parse.User.current());
			crash.set('reason', reason)
			crash.save(null, {
				success: updateCrashes,
				error: function(crash, error) {
					console.log(error);
				}
			});
		}
	});
	window.Crash = Crash

	var updateCrashes = function() {
		new Parse.Query(Crash).count({
			success: function(newCount) {
				var currentCount = $('#crashes').text();
				if (currentCount != newCount) {
					$('#crashes').text(newCount).addClass('bounce').on('animationend webkitAnimationEnd mozAnimationEnd', function() {
						$(this).removeClass('bounce');
					});
					CrashPerDayChart.updateCrash();
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

	var crashDayCtx = $("#crash-per-day-chart").get(0).getContext("2d");
	CrashPerDayChart.setup(crashDayCtx)

	setInterval(updateCrashes, 5000);

	$('#crash-reason').selectize({
    create: true,
    sortField: 'text',
		maxItems: 1,
		create: function(input) {
		    return {
		        value: input,
		        text: input
		    }
		},
		options: Crashes.selectizeOptions()

});

	$('#record-crash').on('click', function() {
		Crash.record($("#crash-reason").val());
	});

	$('#crash-per-day-count').on('change', function(ev){
		var days = parseInt(ev.target.value);
		CrashPerDayChart.update(days);
	})

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
