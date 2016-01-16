"use strict"

var domain 	= "http://app.simplecrew.com/", 
	apiVersion = "api/v2/";


var plugin = {
  pluginObj: document.getElementById('pluginObj'),

  autoSave: function(data, title, path) {
    return this.pluginObj.AutoSave(data, title, path);
  },

  openSavePath : function(path) {
    this.pluginObj.OpenSavePath(path);
  },

  getDefaultSavePath: function() {
    return this.pluginObj.GetDefaultSavePath();
  },

  saveToClipboard: function(data) {
    return this.pluginObj.SaveToClipboard(data);
  },

  captureScreen: function() {
    this.pluginObj.CaptureScreen();
  },

  setMessage: function() {
    var ok = chrome.i18n.getMessage('ok');
    var cancel = chrome.i18n.getMessage('cancel');
    var tipMessage = chrome.i18n.getMessage('capture_tip');
    if (this.pluginObj.SetMessage)
	  {
	  this.pluginObj.SetMessage(ok, cancel, tipMessage);
	}
    
  },

  setHotKey: function(keyCode) {
    return this.pluginObj.SetHotKey(keyCode);
  },

  disableScreenCaptureHotKey: function() {
    return this.pluginObj.DisableHotKey();
  },

  getViewPortWidth: function() {
    try {
		return this.pluginObj.GetViewPortWidth();
    } catch (e) {
      return null;
    }
  }
};



var screenshot = {
  tab: 0,
  canvas: document.createElement("canvas"),
  startX: 0,
  startY: 0,
  scrollX: 0,
  scrollY: 0,
  docHeight: 0,
  docWidth: 0,
  visibleWidth: 0,
  visibleHeight: 0,
  scrollXCount: 0,
  scrollYCount: 0,
  scrollBarX: 17,
  scrollBarY: 17,
  captureStatus: true,

	onImageCaptured: function(dataUrl) {
		//chrome.tabs.create({url: dataUrl});

		var logData = JSON.parse(localStorage.temp_logData);

    simplecrew.createLog(logData.companyId, logData.compaignId, function(err, log) {
      if (!err) {
        if (logData.commentText && logData.commentText.length > 0) {
          simplecrew.addComment(logData.companyId, logData.compaignId, log._id, logData.commentText, function(err, data) {
            if (err) {
              alert('Could not add comment! Please try again');
            }
          });
        }
        
        simplecrew.uploadPicture(logData.companyId, logData.compaignId, log._id, dataUrl, function(err) {
          if (!err) {
            alert('Screenshot submitted successfully');
          }
          else {
            alert(err.error);
          }
        });
      }
      else if (err.code == 403) {
        switchToPage("loginPage");
      }
      else {
        alert(err.error);
      }
    });
	}, 

	dataUriToBlob: function(dataURI) {
	    // serialize the base64/URLEncoded data
	    var byteString;
	    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
	        byteString = atob(dataURI.split(',')[1]);
	    }
	    else {
	        byteString = unescape(dataURI.split(',')[1]);
	    }

	    // parse the mime type
	    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

	    // construct a Blob of the image data
	    var array = [];
	    for(var i = 0; i < byteString.length; i++) {
	        array.push(byteString.charCodeAt(i));
	    }
	    return new Blob(
	        [new Uint8Array(array)],
	        {type: mimeString}
	    );
	}, 

	 captureVisible: function(msg) {
	    chrome.tabs.captureVisibleTab(
        null, { quality: 50}, function(data) {
	      var image = new Image();
	      image.onload = function() {
	        var context = screenshot.canvas.getContext("2d");
          screenshot.canvas.width = msg.width;
          screenshot.canvas.height = msg.height;
	        context.drawImage(image, 0, 0, image.width, image.height, msg.x * -1, msg.y * -1, image.width, image.height);
	        var dataUrl = screenshot.canvas.toDataURL('image/png');
			     screenshot.onImageCaptured(dataUrl);
	      };
	      image.src = data;
	    });
	  },

  	/**
	  * Use drawImage method to slice parts of a source image and draw them to
	  * the canvas
	  */
	/*capturePortion: function(x, y, width, height, visibleWidth, visibleHeight, docWidth, docHeight) {
		var formatParam = localStorage.screenshootQuality || 'png';
		chrome.tabs.captureVisibleTab(
		    null, {format: formatParam, quality: 50}, function(data) {
		  chrome.tabs.create({url: data});
		  var image = new Image();
		  image.onload = function() {
		    var curHeight = image.width < docWidth ?
		        image.height - screenshot.scrollBarY : image.height;
		    var curWidth = image.height < docHeight ?
		        image.width - screenshot.scrollBarX : image.width;
		    var zoomX = curWidth / visibleWidth;
		    var zoomY = curHeight / visibleHeight;
		    screenshot.canvas.width = width * zoomX;
		    screenshot.canvas.height = height * zoomY;
		    var context = screenshot.canvas.getContext("2d");
		    context.drawImage(image, x * zoomX, y * zoomY, width * zoomX,
		        height * zoomY, 0, 0, width * zoomX, height * zoomY);
		    
		    var dataUrl = screenshot.canvas.toDataURL('image/jpeg');
			screenshot.onImageCaptured(dataUrl);
		  };
		  image.src = data;
		});
	}, */

	onResponseVisibleSize: function(response) {
	    switch (response.msg) {
	      case 'capture_window':
	        screenshot.captureVisible(response.docWidth, response.docHeight);
	        break;
	      case 'scroll_init_done':
	        screenshot.startX = response.startX,
	        screenshot.startY = response.startY,
	        screenshot.scrollX = response.scrollX,
	        screenshot.scrollY = response.scrollY,
	        screenshot.canvas.width = response.canvasWidth;
	        screenshot.canvas.height = response.canvasHeight;
	        screenshot.visibleHeight = response.visibleHeight,
	        screenshot.visibleWidth = response.visibleWidth,
	        screenshot.scrollXCount = response.scrollXCount;
	        screenshot.scrollYCount = response.scrollYCount;
	        screenshot.docWidth = response.docWidth;
	        screenshot.docHeight = response.docHeight;
	        screenshot.zoom = response.zoom;
	        setTimeout("screenshot.captureAndScroll()", 100);
	        break;
	      case 'scroll_next_done':
	        screenshot.scrollXCount = response.scrollXCount;
	        screenshot.scrollYCount = response.scrollYCount;
	        setTimeout("screenshot.captureAndScroll()", 100);
	        break;
	      case 'scroll_finished':
	        screenshot.captureAndScrollDone();
	        break;
	    }
	},

  /**
  * Send the Message to content-script
  */
  sendMessage: function(message, callback) {
    chrome.tabs.getSelected(null, function(tab) {
      //chrome.tabs.sendMessage(tab.id, message, callback);
    });
  },

  captureAndScrollDone: function() {
    var dataUrl = screenshot.canvas.toDataURL('image/jpeg');
	 screenshot.onImageCaptured(dataUrl);
  },

  /**
  * Use the drawImage method to stitching images, and render to canvas
  */
  captureAndScroll: function() {
    var formatParam = localStorage.screenshootQuality || 'png';
    chrome.tabs.captureVisibleTab(
        null, {format: formatParam, quality: 100}, function(data) {
      var image = new Image();
      image.onload = function() {
        var context = screenshot.canvas.getContext('2d');
        var width = 0;
        var height = 0;

        // Get scroll bar's width.
        screenshot.scrollBarY =
            screenshot.visibleHeight < screenshot.docHeight ? 17 : 0;
        screenshot.scrollBarX =
            screenshot.visibleWidth < screenshot.docWidth ? 17 : 0;

        // Get visible width and height of capture result.
        var visibleWidth =
            (image.width - screenshot.scrollBarY < screenshot.canvas.width ?
            image.width - screenshot.scrollBarY : screenshot.canvas.width);
        var visibleHeight =
            (image.height - screenshot.scrollBarX < screenshot.canvas.height ?
            image.height - screenshot.scrollBarX : screenshot.canvas.height);

        // Get region capture start x coordinate.
        var zoom = screenshot.zoom;
        var x1 = screenshot.startX - Math.round(screenshot.scrollX * zoom);
        var x2 = 0;
        var y1 = screenshot.startY - Math.round(screenshot.scrollY * zoom);
        var y2 = 0;

        if ((screenshot.scrollYCount + 1) * visibleWidth >
            screenshot.canvas.width) {
          width = screenshot.canvas.width % visibleWidth;
          x1 = (screenshot.scrollYCount + 1) * visibleWidth -
              screenshot.canvas.width + screenshot.startX - screenshot.scrollX;
        } else {
          width = visibleWidth;
        }

        if ((screenshot.scrollXCount + 1) * visibleHeight >
            screenshot.canvas.height) {
          height = screenshot.canvas.height % visibleHeight;
          if ((screenshot.scrollXCount + 1) * visibleHeight +
              screenshot.scrollY < screenshot.docHeight) {
            y1 = 0;
          } else {
            y1 = (screenshot.scrollXCount + 1) * visibleHeight +
                screenshot.scrollY - screenshot.docHeight;
          }

        } else {
          height = visibleHeight;
        }
        x2 = screenshot.scrollYCount * visibleWidth;
        y2 = screenshot.scrollXCount * visibleHeight;
        context.drawImage(image, x1, y1, width, height, x2, y2, width, height);
        console.log("Scroll next");
        screenshot.sendMessage({msg: 'scroll_next', visibleWidth: visibleWidth,
            visibleHeight: visibleHeight}, screenshot.onResponseVisibleSize);
      };
      image.src = data;
    });
  }

}

chrome.runtime.onMessage.addListener(
  function(request, sender, response) {
  	switch(request.msg) {
  		case "capture_selected":
	    	screenshot.captureVisible(request);
	    	/*capturePortion(request.x, request.y, request.width, request.height, request.visibleWidth, 
	    		request.visibleHeight, request.docWidth, request.docHeight);*/
			break;
  		case 'original_view_port_width':
          response(plugin.getViewPortWidth());
          break;
        default:
          screenshot.onResponseVisibleSize(request);
  	}
  });
