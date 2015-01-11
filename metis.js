// dependencies
Date.prototype.getWeekNumber = function(){
		var d = new Date(+this);
		d.setHours(0,0,0);
		d.setDate(d.getDate()+4-(d.getDay()||7));
		return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

Router.route('/', function () {
	this.render('home');
});
Router.route('/json', function () {
	this.render('json');
});

if (Meteor.isClient) {

	Template.json.rendered = function () {
		Session.set('commits', 'Retrieving From Github Api...');
		Meteor.call('getCommits', function (error, result) {
			Session.set('commits', result);
		});
	}

	Template.home.rendered = function () {
		Session.set('generated', false);
	};

	Template.answers.rendered = function () {
		Session.set('loading', true);
		Meteor.call('getData', function (error, result) {
			Session.set('loading', false);
			// var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "Novemeber", "December"];
			var data = {
					labels: [],
					datasets: [
							{
									label: "Commits Per Day",
									fillColor: "rgba(151,187,205,0.2)",
									strokeColor: "rgba(151,187,205,1)",
									pointColor: "rgba(151,187,205,1)",
									pointStrokeColor: "#fff",
									pointHighlightFill: "#fff",
									pointHighlightStroke: "rgba(151,187,205,1)",
									data: []
							}
					]
			};
			var data2 = {
					labels: [],
					datasets: [
							{
									label: "Commits Per Week",
									fillColor: "rgba(220,220,220,0.2)",
									strokeColor: "rgba(220,220,220,1)",
									pointColor: "rgba(220,220,220,1)",
									pointStrokeColor: "#fff",
									pointHighlightFill: "#fff",
									pointHighlightStroke: "rgba(220,220,220,1)",
									data: []
							}
					]
			};
			var data3 = {
					labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
					datasets: [
							{
									label: "Commits Per Week",
									fillColor: "rgba(220,220,220,0.2)",
									strokeColor: "rgba(220,220,220,1)",
									pointColor: "rgba(220,220,220,1)",
									pointStrokeColor: "#fff",
									pointHighlightFill: "#fff",
									pointHighlightStroke: "rgba(220,220,220,1)",
									data: [0,0,0,0,0,0,0]
							}
					]
			};
			var count = 1;
			var mostCommits = 0;
			var mostCommitsDate = '';
			result.data.map(function (commit) {
				if (commit.total > mostCommits) {
					mostCommits = commit.total;
					mostCommitsDate = commit.total + ' commits the week of: ' + moment((new Date(commit.week*1000))).format('MMM DD YY')+'.';
				}
				data2.labels.push(moment((new Date(commit.week*1000))).format('MMM DD'));
				data2.datasets[0].data.push(commit.total);
				commit.days.map(function (total, index) {
					if (total > 0) {
						data.labels.push('Day '+count);
						data.datasets[0].data.push(total);
						data3.datasets[0].data[index]+=total;
					}
					count++;
				});
			});
			var greatestWeedayCommits = 0;
			var greatestWeedayindex = 0;
			data3.datasets[0].data.map(function (commits, index) {
				if (commits > greatestWeedayCommits) {
					greatestWeedayCommits = commits;
					greatestWeedayIndex = index;
				};
			});
			Session.set('gDOC', data3.labels[greatestWeedayIndex]);
			Session.set('gNOC', mostCommitsDate);
			Meteor.setTimeout(function(){
				if ($("#myChart").get(0)) {
					var ctx = $("#myChart").get(0).getContext("2d");
					var myLineChart = new Chart(ctx).Line(data);
					var ctx = $("#myChart2").get(0).getContext("2d");
					var myLineChart = new Chart(ctx).Line(data2);
					var ctx = $("#myChart3").get(0).getContext("2d");
					var myLineChart = new Chart(ctx).Bar(data3);
				}
			}, 100);

		});
	};

	Template.home.events({
		'click #getCommits': function () {
			window.open(Router.url('json'));
		},
		'click #generateAnswers': function () {
			Session.set('generated', true);
		}
	});

	Template.home.helpers({
		generated: function(){
			return Session.get('generated');
		}
	});
	Template.answers.helpers({
		gNOC: function(){
			return Session.get('gNOC');
		},
		gDOC: function(){
			return Session.get('gDOC');
		},
		loading: function(){
			return Session.get('loading');
		}
	});

	Template.json.helpers({
		commits: function(){
			return Session.get('commits');
		}
	});
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
	var fs = Npm.require('fs');

		Meteor.methods({
			getCommits: function () {

				var self = this;

				var now = new Date();
				var finish = new Date();
				var format = finish.setFullYear(finish.getFullYear()-1);
				var start = new Date(format);
				var results = {data: []};
				var page = 1;
				var count = 0;
				var returnValue = 'Loading...'

				var loopPagination = function(){
					var result = HTTP.get("https://api.github.com/repos/mbostock/d3/commits",{
						headers: {
							"User-Agent": "gbachik",
							"Authorization": "Basic " + Base64.encode("gbachik" + ":" + "freedom347")
						},
						params:{
							since: start.toISOString(),
							until: new Date(),
							per_page: 100,
							page: page
						}
					});
					console.log(result.headers.link);
					result.data.map(function (commit) {
						results.data.push(commit.commit);
					});

					if (result.headers.link.search("next") != -1) {
						page++
					}else{
						count++
					}

					if (count < 1) {
						loopPagination(page);
					}else{
						// var filePath = process.env.PWD + '/commits/commits_' + (new Date()).getTime() + '.txt';
						// fs.writeFileSync(filePath, JSON.stringify(results));
						returnValue = JSON.stringify(results);
					}
				};

				loopPagination(page);
				return returnValue;
			},
			getData: function(){
				var result = HTTP.get("https://github.com/mbostock/d3/graphs/commit-activity-data",{
					headers: {
						"User-Agent": "gbachik",
						"Authorization": "Basic " + Base64.encode("gbachik" + ":" + "freedom347")
					}
				});
				return result;
			}
		});

	});
};

/* For Teh Lulz */
// https://github.com/mbostock/d3/graphs/commit-activity
// https://github.com/mbostock/d3/graphs/commit-activity-data
// moment((new Date(1390089600*1000)))