	function switchToPage(pageId) {
		$(".page").hide();
		$("#header").show();
		$("#" + pageId).show();
	}

	$("#companies").change(function() {
		$companies = $(this);
		var companyId = $companies.val();
		localStorage.selectedCompany = companyId;
		simplecrew.getCompaigns(companyId, function(err, compaigns) {
			if (!err) {
				$compaigns = $("#compaigns");
				$compaigns.empty();
				for (var i=0, compaign; compaign = compaigns[i]; i++) {
					$compaigns.append("<option value='" + compaign._id + "'>" + compaign.name + "</option>");
				}
				switchToPage("submissionPage");
				$compaigns.find("option[value='" + localStorage.selectedCompaign + "']").attr('selected', true);
			}
			else {
				switchToPage("loginPage");
			}
		});
	});

	$("#compaigns").change(function() {
		$compaigns = $(this);
		localStorage.selectedCompaign = $compaigns.val();
	});

	function loadSubmissionPage() {
		simplecrew.getCompaniesData(function(err, companies) {
			if (!err) {
				$companies = $("#companies");
				for (var i=0, company; company = companies[i]; i++) {
					$companies.append("<option value='" + company._id + "'>" + company.name + "</option>");
				}
				switchToPage("submissionPage");
				$companies.find("option[value='" + localStorage.selectedCompany + "']").attr('selected', true);
				$companies.change();
			}
			else {
				switchToPage("loginPage");
			}
		});
	}

	$("#loginForm").submit(function(e) {
		e.preventDefault();

		var $form = $(this);
		var username = $form.find(".username").val();
		var password = $form.find(".password").val();

		simplecrew.login(username, password, function(err, data) {
			if (!err) {
				loadSubmissionPage();
			}
			else {
				alert("Could not login!");
			}
		});

		return true;
	});

	function sendScreenShotMessage(cb) {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {msg: "capture-area"}, function(response) {
			});
			if (cb)
				cb();
		});
	}

	$("#submissionForm").submit(function(e) {
		e.preventDefault();

		var companyId 	= $("#companies").val(), 
			compaignId 	= $("#compaigns").val(), 
			commentText = $("#comment").val();

		localStorage.setItem("temp_logData", JSON.stringify({ companyId: companyId, compaignId: compaignId, commentText: commentText }));
		sendScreenShotMessage(function() {
			window.close();
		});

		return true;
	});

	$("#signout").click(function() {
		simplecrew.signout();
		switchToPage("loginPage");
	});

	function showError(msg) {
		$(".page").hide();
		$("#header").hide();
		$("#error").text(msg).show();	
	}

	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
		if (tabs && tabs.length > 0) {
			var index = tabs[0].url.indexOf("http");
			if (index == 0) {
				loadSubmissionPage();
				return;
			}
		}

		// if got so far then there's an error
		showError("Sorry, but we are unable to clip from this page.");
	});
