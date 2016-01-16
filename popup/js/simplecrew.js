function Simplecrew() {
	var self = this;
	this.domain 	= "http://app.simplecrew.com/";
	this.apiVersion = "api/v2/";

	this.login = function(username, password, cb) {
		$.ajax({
			method: "post", 
			url: 	self.domain + self.apiVersion + "mobile/login", 
			data: 	{ email: username, password: password }
		}).done(function(data, textStatus, jqXHR) {
			if (!data) {
				cb({ code: jqXHR.status, error: "Email or password is not correct!" });
			}
			else {
				cb(null, data);
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			cb({ code: jqXHR.status, error: "Oops! Could not login. Please try again." });
		});
	};

	this.getCompaniesData = function(cb) {
		$.ajax({
			method: "get", 
			url: 	self.domain + self.apiVersion + "companies.json", 
		}).done(function(data, textStatus, jqXHR) {
			cb(null, data);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			cb({ code: jqXHR.status, error: "Oops! Could not login. Please try again." });
		});	
	};

	this.getCompaigns = function(companyId, cb) {
		$.ajax({
			method: "get", 
			url: 	self.domain + self.apiVersion + "companies/" + companyId + "/campaigns.json", 
		}).done(function(data, textStatus, jqXHR) {
			cb(null, data);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			cb({ code: jqXHR.status, error: "Oops! Could not login. Please try again." });
		});	
	};

	this.createLog = function(companyId, compaignId, cb) {
		$.ajax({
			method: "post", 
			url: 	self.domain + self.apiVersion + "companies/" + companyId + "/campaigns/" + compaignId + "/logs", 
			data: { "content_type": "image/png", "type": "clipper" }
		}).done(function(data, textStatus, jqXHR) {
			if (jqXHR.status == 200 && data) {
				cb(null, data);
			}
			else {
				cb({ code: jqXHR.status, error: "Could not submit! Please try again." });
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			cb({ code: jqXHR.status, error: "Could not submit! Please try again." });
		});
	};

	this.addComment = function(companyId, compaignId, logId, commentText, cb) {
		$.ajax({
			method: "post", 
			url: 	self.domain + self.apiVersion + "companies/" + companyId + "/campaigns/" + compaignId + "/logs/" + logId + "/comments", 
			data: 	{ comment: commentText }
		}).done(function(data, textStatus, jqXHR) {
			if (jqXHR.status == 200 && data) {
				cb(null, data);
			}
			else {
				cb({ code: jqXHR.status, error: "Could not submit! Please try again." });
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			cb({ code: jqXHR.status, error: "Could not submit! Please try again." });
		});
	};

	this.uploadPicture = function(companyId, compaignId, logId, dataUrl, cb) {
		alert(self.domain + self.apiVersion + "companies/" + companyId + "/campaigns/" + compaignId + "/logs/" + logId + "/upload");
		$.ajax({
          method: "post", 
          url: self.domain + self.apiVersion + "companies/" + companyId + "/campaigns/" + compaignId + "/logs/" + logId + "/upload", 
          data: { image: dataUrl }, 
        }).done(function(data, textStatus, jqXHR) {
          if (jqXHR.status == 200 && data) {
          	cb(null);
          }
          else {
          	cb({ code: jqXHR.status, error: 'Could not submit! Please try again.' });
          }
        }).fail(function(jqXHR, textStatus, errorThrown) {
          cb({ code: jqXHR.status, error: 'Could not submit! Please try again.' });
        });
	};

	this.signout = function() {
		$.ajax({
			method: "post", 
			url: 	self.domain + self.apiVersion + "mobile/logout", 
		});
	};
}

var simplecrew = new Simplecrew();
