if (Meteor.isClient) {

	Template.hello.rendered = function () {
		Session.set('commits', 'Press the button to get them homie');
	};

	Template.hello.events({
		'click button': function () {
			$('.loader').text('Loading...');
			Meteor.call('getCommits', function (error, result) {
				Session.set('commits', result);
			});
		}
	});

	Template.hello.helpers({
		commits: function(){
			return Session.get('commits');
		}
	});
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup

		Meteor.methods({
			getCommits: function () {

				var now = new Date();
				var finish = new Date();
				var format = finish.setFullYear(finish.getFullYear()-1);
				var start = new Date(format);
				var results = {data: []};
				var page = 1;
				var count = 0;

				var loopPagination = function(){
					HTTP.get("https://api.github.com/repos/mbostock/d3/commits",{
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
					},function (error, result) {
						if (!error) {
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
								var fs = Npm.require('fs');
								var filePath = process.env.PWD + '/commits/commits_' + (new Date()).getTime() + '.txt';
								fs.writeFileSync(filePath, JSON.stringify(results));
								return 'Done!';
							}

						}else{
							console.log("err:", error);
						}
					});
				};

				loopPagination(page);
			}
		});

	});
}
