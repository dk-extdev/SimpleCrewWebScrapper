var screenshot = new Screenshot();

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
	if (request.msg == "capture-area") {
    	screenshot.showSelectionArea();
	}
});
