"use strict"

var Screenshot = function() {
	var marginTop = 0, 
		marginLeft = 0, 
		isSelectionAreaTurnOn = false, 
		pageHeight = 0, 
		pageWidth = 0, 
	    visibleWidth = 0,
  		visibleHeight = 0,
		startX = 150, 
		startY = 150, 
		endX = 400, 
		endY = 300, 
		isMouseDown = false, 
		moving = false, 
		moveX = 0, 
		moveY = 0, 
		scrollXCount = 0,
		scrollYCount = 0,
		scrollX = 0,
		scrollY = 0,
		captureWidth = 0,
  		captureHeight = 0,
		resizing = false, 
		dragging = false, 
		fixedElements_  = [],
		modifiedBottomRightFixedElements =  [],
		originalViewPortWidth = document.documentElement.clientWidth, 
		defaultScrollBarWidth = 17; // Default scroll bar width on windows platform.

	function init() {
		addMessageListener();

		if (document.body.hasAttribute('screen_capture_injected')) {
	      return;
	    }
	    if (isPageCapturable()) {
	      chrome.runtime.sendMessage({msg: 'page_capturable'});
	    } else {
	      chrome.runtime.sendMessage({msg: 'page_uncapturable'});
	    }

	    // Retrieve original width of view port and cache.
	    getOriginalViewPortWidth();
	}

	function isPageCapturable() {
	  return !checkPageIsOnlyEmbedElement();
	}

	function checkPageIsOnlyEmbedElement() {
	    var bodyNode = document.body.children;
	    var isOnlyEmbed = false;
	    for (var i = 0; i < bodyNode.length; i++) {
	      var tagName = bodyNode[i].tagName;
	      if (tagName == 'OBJECT' || tagName == 'EMBED' || tagName == 'VIDEO' ||
	          tagName == 'SCRIPT' || tagName == 'LINK') {
	        isOnlyEmbed = true;
	      } else if (bodyNode[i].style.display != 'none'){
	        isOnlyEmbed = false;
	        break;
	      }
	    }
		return isOnlyEmbed;
	}

	function hasScrollBar(axis) {
	    var body = document.body;
	    var docElement = document.documentElement;
	    if (axis == 'x') {
	      if (window.getComputedStyle(body).overflowX == 'scroll')
	        return true;
	      return Math.abs(body.scrollWidth - docElement.clientWidth) >=
	          defaultScrollBarWidth;
	    } else if (axis == 'y') {
	      if (window.getComputedStyle(body).overflowY == 'scroll')
	        return true;
	      return Math.abs(body.scrollHeight - docElement.clientHeight) >=
	          defaultScrollBarWidth;
	    }
    }

	function getOriginalViewPortWidth() {
    	chrome.runtime.sendMessage({ msg: 'original_view_port_width'},
	      function(viewPortWidth) {
	        if (viewPortWidth) {
	          originalViewPortWidth = hasScrollBar('y') ?
	            viewPortWidth - defaultScrollBarWidth : viewPortWidth;
	        } else {
	          originalViewPortWidth = document.documentElement.clientWidth;
	        }
    	});
    }

	function $(id) {
	  return document.getElementById(id);
	}

	function createFloatLayer() {
		createDiv(document.body, 'sc_drag_area_protector');
	}

	function createDiv(parent, id) {
		var divElement = document.createElement('div');
		divElement.id = id;
		parent.appendChild(divElement);
		return divElement;
	}

	function matchMarginValue(str) {
		return str.match(/\d+/);
  	}

  	function onMouseDown() {
	    if (event.button != 2) {
	      var element = event.target;

	      if (element) {
	        var elementName = element.tagName;
	        if (elementName && document) {
	          isMouseDown = true;

	          var areaElement = $('sc_drag_area');
	          var xPosition = event.pageX;
	          var yPosition = event.pageY;

	          if (areaElement) {
	            if (element == $('sc_drag_container')) {
	              moving = true;
	              moveX = xPosition - areaElement.offsetLeft;
	              moveY = yPosition - areaElement.offsetTop;
	            } else if (element == $('sc_drag_north_east')) {
	              resizing = true;
	              startX = areaElement.offsetLeft;
	              startY = areaElement.offsetTop + areaElement.clientHeight;
	            } else if (element == $('sc_drag_north_west')) {
	              resizing = true;
	              startX = areaElement.offsetLeft + areaElement.clientWidth;
	              startY = areaElement.offsetTop + areaElement.clientHeight;
	            } else if (element == $('sc_drag_south_east')) {
	              resizing = true;
	              startX = areaElement.offsetLeft;
	              startY = areaElement.offsetTop;
	            } else if (element == $('sc_drag_south_west')) {
	              resizing = true;
	              startX = areaElement.offsetLeft + areaElement.clientWidth;
	              startY = areaElement.offsetTop;
	            } else {
	              dragging = true;
	              endX = 0;
	              endY = 0;
	              endX = startX = xPosition;
	              endY = startY = yPosition;
	            }
	          }
	          //event.preventDefault();
	        }
	      }
	    }
	}

	function getZoomLevel() {
    	return originalViewPortWidth / document.documentElement.clientWidth;
  	}

  	function width(){
	   return window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth||0;
	}
	function height(){
	   return window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight||0;
	}

  /**
  * Change selection area position when mouse moved
  */
  function onMouseMove() {
    var element = event.target;
    if (element && isMouseDown) {
      var areaElement = $('sc_drag_area');
      if (areaElement) {

        var xPosition = event.pageX;
        var yPosition = event.pageY;
        if (dragging || resizing) {
          var width = 0;
          var height = 0;
          var zoom = getZoomLevel();
          var viewWidth = Math.round(document.width / zoom);
          var viewHeight = Math.round(document.height / zoom);
          if (xPosition > viewWidth) {
            xPosition = viewWidth;
          } else if (xPosition < 0) {
            xPosition = 0;
          }
          if (yPosition > viewHeight) {
            yPosition = viewHeight;
          } else if (yPosition < 0) {
            yPosition = 0;
          }
          endX = xPosition;
          endY = yPosition;
          if (startX > endX) {
            width = startX - endX;

            areaElement.style.left = xPosition + 'px';
          } else {
            width = endX - startX;
            areaElement.style.left = startX + 'px';
          }
          if (startY > endY) {
            height = startY - endY;
            areaElement.style.top = endY + 'px';
          } else {
            height = endY - startY;
            areaElement.style.top = startY + 'px';
          }
          areaElement.style.height = height + 'px';
          areaElement.style.width  = width + 'px';
          if (window.innerWidth < xPosition) {
            //document.body.scrollLeft = xPosition - window.innerWidth;
          }
          if (document.body.scrollTop + window.innerHeight < yPosition + 25) {
            //document.body.scrollTop = yPosition - window.innerHeight + 25;
          }
          if (yPosition < document.body.scrollTop) {
            //document.body.scrollTop -= 25;
          }
        } else if (moving) {
          var newXPosition = xPosition - moveX;
          var newYPosition = yPosition - moveY;
          if (newXPosition < 0) {
            newXPosition = 0;
          } else if (newXPosition + areaElement.clientWidth > pageWidth) {
            newXPosition = pageWidth - areaElement.clientWidth;
          }
          if (newYPosition < 0) {
            newYPosition = 0;
          } else if (newYPosition + areaElement.clientHeight >
                     pageHeight) {
            newYPosition = pageHeight - areaElement.clientHeight;
          }

          areaElement.style.left = newXPosition + 'px';
          areaElement.style.top = newYPosition + 'px';
          endX = newXPosition + areaElement.clientWidth;
          startX = newXPosition;
          endY = newYPosition + areaElement.clientHeight;
          startY = newYPosition;

          var sElem = document.getElementById("sc_drag_container");
          if (sElem.clientWidth) {
          	
          }
        }
        var crop = document.getElementById('sc_drag_crop');
        var cancel = document.getElementById('sc_drag_cancel');
        if (event.pageY + 25 > document.height) {
          crop.style.bottom = 0;
          cancel.style.bottom = 0
        } else {
          crop.style.bottom = '-25px';
          cancel.style.bottom = '-25px';
        }

        var dragSizeContainer = document.getElementById('sc_drag_size');
        if (event.pageY < 18) {
          dragSizeContainer.style.top = 0;
        } else {
          dragSizeContainer.style.top = '-18px';
        }
        updateShadow(areaElement);
        updateSize();

      }
    }
  }

 /**
  * Fix the selection area position when mouse up
  */
  function onMouseUp() {
    isMouseDown = false;
    if (event.button != 2) {
      resizing = false;
      dragging = false;
      moving = false;
      moveX = 0;
      moveY = 0;
      var temp;
      if (endX < startX) {
        temp = endX;
        endX = startX;
        startX = temp;
      }
      if (endY < startY) {
        temp = endY;
        endY = startY;
        startY = temp;
      }
    }
  }

	function removeElement(id) {
	    if($(id)) {
	      $(id).parentNode.removeChild($(id));
	    }
	}

	function removeSelectionArea() {
		document.removeEventListener('mousedown', onMouseDown, false);
		document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);
		$('sc_drag_container').removeEventListener('dblclick',function() {
		  removeSelectionArea();
		  sendSelectionSize();}, false);
		removeElement('sc_drag_area_protector');
		removeElement('sc_drag_area');
		isSelectionAreaTurnOn = false;
  	}

	function getElementLeft(obj) {
		return (document.body.scrollLeft +
	    	(document.documentElement.clientWidth - 
	    	obj.offsetWidth) / 2);
	}

	function getElementTop(obj) {
	    return (document.body.scrollTop + 
	        (document.documentElement.clientHeight - 200 - 
	        obj.offsetHeight) / 2);
  	}

	function updateShadow(areaElement) {
	    $('sc_drag_shadow_top').style.height =
	        parseInt(areaElement.style.top) + 'px';
	    $('sc_drag_shadow_top').style.width = (parseInt(areaElement.style.left) +
	        parseInt(areaElement.style.width) + 1) + 'px';
	    $('sc_drag_shadow_left').style.height =
	        (pageHeight - parseInt(areaElement.style.top)) + 'px';
	    $('sc_drag_shadow_left').style.width =
	        parseInt(areaElement.style.left) + 'px';

	    var height = (parseInt(areaElement.style.top) +
	        parseInt(areaElement.style.height) + 1);
	    height = (height < 0) ? 0 : height;
	    var width = (pageWidth) - 1 - (parseInt(areaElement.style.left) +
	        parseInt(areaElement.style.width));
	    width = (width < 0) ? 0 : width;
	    $('sc_drag_shadow_right').style.height = height + 'px';
	    $('sc_drag_shadow_right').style.width =  width + 'px';

	    height = (pageHeight - 1 - (parseInt(areaElement.style.top) +
	        parseInt(areaElement.style.height)));
	    height = (height < 0) ? 0 : height;
	    width = (pageWidth) - parseInt(areaElement.style.left);
	    width = (width < 0) ? 0 : width;
	    $('sc_drag_shadow_bottom').style.height = height + 'px';
	    $('sc_drag_shadow_bottom').style.width = width + 'px';
	}

	function calculateSizeAfterZooming(originalSize) {
	    var originalViewPortWidth = document.documentElement.clientWidth;
	    var currentViewPortWidth = document.documentElement.clientWidth;
	    if (originalViewPortWidth == currentViewPortWidth)
	      return originalSize;
	    return Math.round(
	        originalViewPortWidth * originalSize / currentViewPortWidth);
  	}

	function updateSize() {
		var width = Math.abs(endX - startX);
		var height = Math.abs(endY - startY);
		$('sc_drag_size').innerText = calculateSizeAfterZooming(width) +
		  ' x ' + calculateSizeAfterZooming(height);
	}

	function sendMessage(message) {
    	chrome.runtime.sendMessage(message);
  	}

  	function sendSelectionSize() {
		console.log(startX + '   '+ startY+ '   '+endX+'   '+endY);
		console.log(window.scrollX+'   '+window.scrollY);
		console.log(document.documentElement.clientWidth+'  '+document.documentElement.clientHeight);
		console.log((startX - window.scrollX)+'   '+(startY - window.scrollY));
  		/*sendMessage({
        'msg': 'capture_selected',
        'x': startX - window.scrollX,
        'y': startY - window.scrollY,
        'width': endX - startX,
        'height': endY - startY,
        'visibleWidth': document.documentElement.clientWidth,
        'visibleHeight': document.documentElement.clientHeight,
        'docWidth': document.width,
        'docHeight': document.height
      });*/
  	}

	function createSelectionArea() {
    	var areaProtector = $('sc_drag_area_protector');
    	var zoom = getZoomLevel(); 
    	var bodyStyle = window.getComputedStyle(document.body, null);
    	if ('relative' == bodyStyle['position']) {
			marginTop = matchMarginValue(bodyStyle['marginTop']);
			marginLeft = matchMarginValue(bodyStyle['marginLeft']);
			areaProtector.style.top =  - parseInt(marginTop) + 'px';
			areaProtector.style.left =  - parseInt(marginLeft) + 'px';
    	}
		areaProtector.style.width =
		  Math.round((document.width + parseInt(marginLeft)) / zoom) + 'px';
		areaProtector.style.height =
		  Math.round((document.height + parseInt(marginTop)) / zoom) + 'px';
		areaProtector.onclick = function() {
		  event.stopPropagation();
			return false;
		};

		// Create elements for area capture.
		createDiv(areaProtector, 'sc_drag_shadow_top');
		createDiv(areaProtector, 'sc_drag_shadow_bottom');
		createDiv(areaProtector, 'sc_drag_shadow_left');
		createDiv(areaProtector, 'sc_drag_shadow_right');

    	var areaElement = createDiv(areaProtector, 'sc_drag_area');
    	createDiv(areaElement, 'sc_drag_container');
    	createDiv(areaElement, 'sc_drag_size');

    	// Add event listener for 'cancel' and 'capture' button.
    	var cancel = createDiv(areaElement, 'sc_drag_cancel');
    	cancel.addEventListener('mousedown', function () {
      		// Remove area capture containers and event listeners.
      		removeSelectionArea();
		}, true);
    	cancel.innerHTML = "Cancel";

    	var crop = createDiv(areaElement, 'sc_drag_crop');
    	crop.addEventListener('mousedown', function() {
      		removeSelectionArea();
      		sendSelectionSize();
    	}, false);
    	crop.innerHTML = "Ok";

    	createDiv(areaElement, 'sc_drag_north_west');
    	createDiv(areaElement, 'sc_drag_north_east');
    	createDiv(areaElement, 'sc_drag_south_east');
    	createDiv(areaElement, 'sc_drag_south_west');

    	areaProtector.addEventListener('mousedown', onMouseDown, false);
    	document.addEventListener('mousemove', onMouseMove, false);
    	document.addEventListener('mouseup', onMouseUp, false);
    	$('sc_drag_container').addEventListener('dblclick', function() {
      		removeSelectionArea();
      		sendSelectionSize();
    	}, false);

    	pageHeight = $('sc_drag_area_protector').clientHeight;
    	pageWidth = $('sc_drag_area_protector').clientWidth;

    	var areaElement = $('sc_drag_area');
    	areaElement.style.left = getElementLeft(areaElement) + 'px';
    	areaElement.style.top = getElementTop(areaElement) + 'px';
    
    	startX = getElementLeft(areaElement);
    	startY = getElementTop(areaElement); 
	    endX = getElementLeft(areaElement) + 250;
	    endY = getElementTop(areaElement) + 150;
    
    	areaElement.style.width = '250px';
    	areaElement.style.height = '150px';
    	isSelectionAreaTurnOn = true;
    	updateShadow(areaElement);
    	updateSize();
    }

    function restoreBottomRightOfFixedPositionElements() {
	    modifiedBottomRightFixedElements.forEach(function(data) {
	      var property = data[0];
	      var element = data[1];
	      var originalValue = data[2];
	      element.style[property] = originalValue;
	    });
	    modifiedBottomRightFixedElements = [];
    }

      /**
   * Determine if the page scrolled to bottom or right.
   */
  function isScrollToPageEnd(coordinate) {
    var body = document.body;
    var docElement = document.documentElement;
    if (coordinate == 'x')
      return docElement.clientWidth + body.scrollLeft == body.scrollWidth;
    else if (coordinate == 'y')
      return docElement.clientHeight + body.scrollTop == body.scrollHeight;
  }

  /**
   * Detect if the view port is located to the corner of page.
   */
  function detectPagePosition() {
    var body = document.body;
    var pageScrollTop = body.scrollTop;
    var pageScrollLeft = body.scrollLeft;
    if (pageScrollTop == 0 && pageScrollLeft == 0) {
      return 'top_left';
    } else if (pageScrollTop == 0 && isScrollToPageEnd('x')) {
      return 'top_right';
    } else if (isScrollToPageEnd('y') && pageScrollLeft == 0) {
      return 'bottom_left';
    } else if (isScrollToPageEnd('y') && isScrollToPageEnd('x')) {
      return 'bottom_right';
    }
    return null;
  }

   function hideAllFixedPositionedElements() {
    fixedElements_.forEach(function(element) {
      element[1].style.visibility = 'hidden';
    });
  }

  /**
  * Calculate the next position of the scrollbar
  */
  function scrollNext() {
    if (scrollYCount * visibleWidth >= captureWidth) {
      scrollXCount++;
      scrollYCount = 0;
    }
    if (scrollXCount * visibleHeight < captureHeight) {
      restoreBottomRightOfFixedPositionElements();
      var viewPortSize = getViewPortSize();
      window.scrollTo(
          scrollYCount * viewPortSize.width + scrollX,
          scrollXCount * viewPortSize.height + scrollY);

      var pagePosition = detectPagePosition();
      if (pagePosition) {
        handleFixedElements(pagePosition);
      } else {
        hideAllFixedPositionedElements();
      }
      handleSecondToLastCapture();

      if (false) { // todo: isgmailpage()
        var frame = document.getElementById('canvas_frame');
        frame.contentDocument.body.scrollLeft =
            scrollYCount * viewPortSize.width;
        frame.contentDocument.body.scrollTop =
            scrollXCount * viewPortSize.height;
        handleRightFloatBoxInGmail(); // Todo: gmail specific func
      }
      var x = scrollXCount;
      var y = scrollYCount;
      scrollYCount++;
      return { msg: 'scroll_next_done',scrollXCount: x, scrollYCount: y };
    }  else {
      window.scrollTo(startX, startY);
      restoreFixedElements();
      hookBodyScrollValue(false);
      return {'msg': 'scroll_finished'};
    }
  }

  function restoreFixedElements() {
    fixedElements_.forEach(function(element) {
      element[1].style.visibility = 'visible';
    });
    fixedElements_ = [];
  }

	/**
	* Receive messages from background page, and then decide what to do next
	*/
  function addMessageListener() {
    chrome.runtime.onMessage.addListener(function(request, sender, response) {
      if (isSelectionAreaTurnOn) {
        removeSelectionArea();
      }
      switch (request.msg) {
        case 'capture_window': sendMessage(page.getWindowSize()); return true; break;
        case 'show_selection_area': page.showSelectionArea(); break;
        case 'scroll_init': // Capture whole page.
          sendMessage(scrollInit(0, 0, document.body.scrollWidth,
              document.body.scrollHeight, 'captureWhole'));
          return true;
          break;
        case 'scroll_next':
          visibleWidth = request.visibleWidth;
          visibleHeight = request.visibleHeight;
          console.log("Scroll next");
          sendMessage(scrollNext());
          return true;
          break;
        case 'capture_selected':
          sendMessage(scrollInit(
              startX, startY,
              calculateSizeAfterZooming(endX - startX),
              calculateSizeAfterZooming(endY - startY),
              'captureSelected'));
          return true;
          break;
      }
      return true;
    });
  }

  function getWindowSize() {
    var docWidth = document.width;
    var docHeight = document.height;
    if (false) { // TODO: isGmailPage()
      var frame = document.getElementById('canvas_frame');
      docHeight = frame.contentDocument.height;
      docWidth = frame.contentDocument.width;
    }
    return {'msg':'capture_window',
            'docWidth': docWidth,
            'docHeight': docHeight};
  }

  function hookBodyScrollValue(needHook) {
    document.documentElement.setAttribute(
        "__screen_capture_need_hook_scroll_value__", needHook);
    var event = document.createEvent('Event');
    event.initEvent('__screen_capture_check_hook_status_event__', true, true);
    document.documentElement.dispatchEvent(event);
  }

  /**
   * Detect fixed-positioned element's position in the view port.
   * @param {Element} elem
   * @return {String|Object} Return position of the element in the view port:
   *   top_left, top_right, bottom_left, bottom_right, or null.
   */
  function detectCapturePositionOfFixedElement(elem) {
    var docElement = document.documentElement;
    var viewPortWidth = docElement.clientWidth;
    var viewPortHeight = docElement.clientHeight;
    var offsetWidth = elem.offsetWidth;
    var offsetHeight = elem.offsetHeight;
    var offsetTop = elem.offsetTop;
    var offsetLeft = elem.offsetLeft;
    var result = [];

    // Compare distance between element and the edge of view port to determine
    // the capture position of element.
    if (offsetTop <= viewPortHeight - offsetTop - offsetHeight) {
      result.push('top');
    } else if (offsetTop < viewPortHeight) {
      result.push('bottom');
    }
    if (offsetLeft <= viewPortWidth - offsetLeft - offsetWidth) {
      result.push('left');
    } else if (offsetLeft < viewPortWidth) {
      result.push('right');
    }

    // If the element is out of view port, then ignore.
    if (result.length != 2)
      return null;
    return result.join('_');
  }

  /**
   * Iterate DOM tree and cache visible fixed-position elements.
   */
  function cacheVisibleFixedPositionedElements() {
    var nodeIterator = document.createNodeIterator(
        document.documentElement,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
    );
    var currentNode;
    while (currentNode = nodeIterator.nextNode()) {
      var nodeComputedStyle =
          document.defaultView.getComputedStyle(currentNode, "");
      // Skip nodes which don't have computeStyle or are invisible.
      if (!nodeComputedStyle)
        continue;
      if (nodeComputedStyle.position == "fixed" &&
          nodeComputedStyle.display != 'none' &&
          nodeComputedStyle.visibility != 'hidden') {
        var position =
          detectCapturePositionOfFixedElement(currentNode);
        if (position)
          fixedElements_.push([position, currentNode]);
      }
    }
  }

  /**
   * Detect fixed-positioned element's position in the view port.
   * @param {Element} elem
   * @return {String|Object} Return position of the element in the view port:
   *   top_left, top_right, bottom_left, bottom_right, or null.
   */
  function detectCapturePositionOfFixedElement(elem) {
    var docElement = document.documentElement;
    var viewPortWidth = docElement.clientWidth;
    var viewPortHeight = docElement.clientHeight;
    var offsetWidth = elem.offsetWidth;
    var offsetHeight = elem.offsetHeight;
    var offsetTop = elem.offsetTop;
    var offsetLeft = elem.offsetLeft;
    var result = [];

    // Compare distance between element and the edge of view port to determine
    // the capture position of element.
    if (offsetTop <= viewPortHeight - offsetTop - offsetHeight) {
      result.push('top');
    } else if (offsetTop < viewPortHeight) {
      result.push('bottom');
    }
    if (offsetLeft <= viewPortWidth - offsetLeft - offsetWidth) {
      result.push('left');
    } else if (offsetLeft < viewPortWidth) {
      result.push('right');
    }

    // If the element is out of view port, then ignore.
    if (result.length != 2)
      return null;
    return result.join('_');
  }

   // Handle fixed-position elements for capture.
  function handleFixedElements(capturePosition) {
    var docElement = document.documentElement;
    var body = document.body;

    // If page has no scroll bar, then return directly.
    if (docElement.clientHeight == body.scrollHeight &&
        docElement.clientWidth == body.scrollWidth)
      return;
    
    if (!fixedElements_.length) {
      cacheVisibleFixedPositionedElements();
    }

    fixedElements_.forEach(function(element) {
      if (element[0] == capturePosition)
        element[1].style.visibility = 'visible';
      else
        element[1].style.visibility = 'hidden';
    });
  }

  function handleSecondToLastCapture() {
    var docElement = document.documentElement;
    var body = document.body;
    var bottomPositionElements = [];
    var rightPositionElements = [];
    fixedElements_.forEach(function(element) {
      var position = element[0];
      if (position == 'bottom_left' || position == 'bottom_right') {
        bottomPositionElements.push(element[1]);
      } else if (position == 'bottom_right' || position == 'top_right') {
        rightPositionElements.push(element[1]);
      }
    });

    // Determine if the current capture is last but one.
    var remainingCaptureHeight = body.scrollHeight - docElement.clientHeight -
      body.scrollTop;
    if (remainingCaptureHeight > 0 &&
        remainingCaptureHeight < docElement.clientHeight) {
      bottomPositionElements.forEach(function(element) {
        if (element.offsetHeight > remainingCaptureHeight) {
          element.style.visibility = 'visible';
          var originalBottom = window.getComputedStyle(element).bottom;
          modifiedBottomRightFixedElements.push(
            ['bottom', element, originalBottom]);
          element.style.bottom = -remainingCaptureHeight + 'px';
        }
      });
    }

    var remainingCaptureWidth = body.scrollWidth - docElement.clientWidth -
      body.scrollLeft;
    if (remainingCaptureWidth > 0 &&
        remainingCaptureWidth < docElement.clientWidth) {
      rightPositionElements.forEach(function(element) {
        if (element.offsetWidth > remainingCaptureWidth) {
          element.style.visibility = 'visible';
          var originalRight = window.getComputedStyle(element).right;
          modifiedBottomRightFixedElements.push(
            ['right', element, originalRight]);
          element.style.right = -remainingCaptureWidth + 'px';
        }
      });
    }
  }

  /**
  * Initialize scrollbar position, and get the data browser
  */
  function scrollInit(startX, startY, canvasWidth, canvasHeight, type) {
    hookBodyScrollValue(true);
    captureHeight = canvasHeight;
    captureWidth = canvasWidth;
    var docWidth = document.body.scrollWidth;
    var docHeight = document.body.scrollHeight;
    window.scrollTo(startX, startY);

    handleFixedElements('top_left');
    handleSecondToLastCapture();

    if (false && type == 'captureWhole') { // TODO: isgmailpage
      var frame = document.getElementById('canvas_frame');
      docHeight = captureHeight = canvasHeight =
          frame.contentDocument.height;
      docWidth = captureWidth = canvasWidth = frame.contentDocument.width;
      frame.contentDocument.body.scrollTop = 0;
      frame.contentDocument.body.scrollLeft = 0;
      handleRightFloatBoxInGmail(); // TODO: the function does not exist
    }
    scrollXCount = 0;
    scrollYCount = 1;
    scrollX = window.scrollX; // document.body.scrollLeft
    scrollY = window.scrollY;
    var viewPortSize = getViewPortSize();
    return {
      'msg': 'scroll_init_done',
      'startX': calculateSizeAfterZooming(startX),
      'startY': calculateSizeAfterZooming(startY),
      'scrollX': window.scrollX,
      'scrollY': window.scrollY,
      'docHeight': docHeight,
      'docWidth': docWidth,
      'visibleWidth': viewPortSize.width,
      'visibleHeight': viewPortSize.height,
      'canvasWidth': canvasWidth,
      'canvasHeight': canvasHeight,
      'scrollXCount': 0,
      'scrollYCount': 0,
      'zoom': getZoomLevel()
    };
  }

  function getViewPortSize() {
    var result = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    };

    if (document.compatMode == 'BackCompat') {
      result.width = document.body.clientWidth;
      result.height = document.body.clientHeight;
    }

    return result;
  }

  this.showSelectionArea = function() {
    createFloatLayer();
    setTimeout(createSelectionArea, 100);
  };

    init();

    window.addEventListener('resize', function() {
	  if (isSelectionAreaTurnOn) {
	    removeSelectionArea();
	    showSelectionArea();
	  }

	  // Reget original width of view port if browser window resized or page zoomed.
	  getOriginalViewPortWidth();
	}, false);
};
