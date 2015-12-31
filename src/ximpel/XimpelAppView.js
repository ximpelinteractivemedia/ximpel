// XimpelApp()
// The XimpelAppView object creates the main XIMPEL elements (such ass the appElement,
// a wrapper element, the player element, the controls element, control buttons, etc.)
// It draws these elements based on the XimpelApp model which contains all information needed to do this.


// TODO: 
// - Right now the keypress handlers dont work.


ximpel.XimpelAppView = function( ximpelAppModel, appElement, specifiedAppWidth, specifiedAppHeight ){
	// The app element is the main ximpel element. If no element is specified one will be created.
	this.$appElement = this.determineAppElement( appElement );
	
	// All view implementations should call the init method of their prototype.	
	this.init( ximpelAppModel, this.$appElement );

	// the width and height of the app element initially (including the units: px or % or w/e) this
	// specifies how large the app will appear on the page. However the width/height of the app can 
	// change when the fullscreen button is pressed.
	this.initialAppWidth = this.determineAppWidth( specifiedAppWidth );
	this.initialAppHeight = this.determineAppHeight( specifiedAppHeight );

	// The $playerElement will contain the html content of the presentation. In otherwords all media items,
	// overlays, question forms, etc. for this presentation will be attached to the $playerElement.
	this.$playerElement = $('<div></div>');
	this.$controlsElement = $('<div></div>');
	this.$wrapperElement = $('<div></div>');
	this.$playButtonElement = $('<div></div>');
	this.$pauseButtonElement = $('<div></div>');
	this.$stopButtonElement = $('<div></div>');
	this.$fullscreenButtonElement = $('<div></div>');
	
	// The PubSub object is used internally to register callback functions for certain events.
	this.pubSub = new ximpel.PubSub();

	// Initialize the main ximpel elements.
	this.initElements();
}
// Create a new View() object and set it as the prototype for XimpelAppView(). 
// This means that all instances of XimpelAppView will have that View() object as prototype.
ximpel.XimpelAppView.prototype = new ximpel.View();
ximpel.XimpelAppView.prototype.DEFAULT_XIMPEL_APP_ELEMENT_ID = 'XIMPEL';

// Define some z-indexes for the different elements. This specifies which elements will be above
// which other elements. For example the player element has a z-index of <base>+1000 and the controls
// have a z-index of <base>+2000. This means that all the player element's children will need to have a z-index
// between <base>+1000 en <base>+2000
ximpel.XimpelAppView.prototype.Z_INDEX_BASE_MAIN_ELEMENTS = 16000000;
ximpel.XimpelAppView.prototype.Z_INDEX_CONTROLS = ximpel.XimpelAppView.prototype.Z_INDEX_BASE_MAIN_ELEMENTS+2000;
ximpel.XimpelAppView.prototype.Z_INDEX_PLAYER = ximpel.XimpelAppView.prototype.Z_INDEX_BASE_MAIN_ELEMENTS+1000;

// The native width and height of the XIMPEL app. All content within the appElement will be scaled
// from 1920*1080 to the appWidth/appHeight (while maintaining aspect ratio). So when specify X and Y
// coordinates for overlays or media items in your presentation you must do so based on a 1920*1080
// resolution even if your appWidth/appHeight is smaller because ximpel will scale it for you.
ximpel.XimpelAppView.prototype.NATIVE_PLAYER_ELEMENT_WIDTH = '1920px';
ximpel.XimpelAppView.prototype.NATIVE_PLAYER_ELEMENT_HEIGHT = '1080px';

// The default width/height of your app. (ie. the dimensions that the ximpel will appear in on your page.)
ximpel.XimpelAppView.prototype.DEFAULT_APP_WIDTH = '1024px';
ximpel.XimpelAppView.prototype.DEFAULT_APP_HEIGHT = '576px';

// Defines the default width/height of the control buttons (and with that the entire controlsbar)
ximpel.XimpelAppView.prototype.DEFAULT_CONTROL_HEIGHT = '125px';
ximpel.XimpelAppView.prototype.DEFAULT_CONTROL_WIDTH = '125px';

// The class name for the main ximpel appElement
ximpel.XimpelAppView.prototype.APP_ELEMENT_CLASS = 'ximpelApp';

// The class name for the wrapper element.
ximpel.XimpelAppView.prototype.WRAPPER_ELEMENT_CLASS = 'ximpelWrapper';

// The class name for the player element
ximpel.XimpelAppView.prototype.PLAYER_ELEMENT_CLASS = 'ximpelPlayer'; 

// The class name for the control bar element.
ximpel.XimpelAppView.prototype.CONTROLS_CLASS = 'ximpelControls'; 

// The class name for the control button elements
ximpel.XimpelAppView.prototype.CONTROL_CLASS = 'ximpelControl'; 

// The class name for the controls bar when the controls bar is displayed as an overlay.
ximpel.XimpelAppView.prototype.CONTROLS_DISPLAY_METHOD_OVERLAY_CLASS = 'ximpelControlsOverlay';

// The class name for the controls bar when the controls bar is displayed fixed (not displayed as an overlay but below the player element)
ximpel.XimpelAppView.prototype.CONTROLS_DISPLAY_METHOD_FIXED_CLASS = 'ximpelControlsFixed'; 

// Two constants that indicate the display types for the controls bar (fixed or overlay)
ximpel.XimpelAppView.prototype.CONTROLS_DISPLAY_METHOD_OVERLAY = 'overlay';
ximpel.XimpelAppView.prototype.CONTROLS_DISPLAY_METHOD_FIXED = 'fixed';

ximpel.XimpelAppView.prototype.PLAY_EVENT = 'play_button_clicked';
ximpel.XimpelAppView.prototype.PAUSE_EVENT = 'pause_button_clicked';
ximpel.XimpelAppView.prototype.STOP_EVENT = 'stop_button_clicked';



// Initialize all the ximpel elements (ie. specify some initial styling for those elements)
ximpel.XimpelAppView.prototype.initElements = function(){
	this.initAppElement();
	this.initPlayerElement();
	this.initControlsElement();
	this.initWrapperElement();
	this.initButtonElements();
}



// The app element is just the main element to which all other elements are attached.
ximpel.XimpelAppView.prototype.initAppElement = function(){
	this.$appElement.css({
		'position': 'relative',
		'width': this.initialAppWidth,
		'height': this.initialAppHeight
	});

	this.$appElement.addClass( this.APP_ELEMENT_CLASS );
}



// The player element is the element to which the Player() object attaches all the DOM elements that
// form the presentation (overlays, questions, media items, etc.).
ximpel.XimpelAppView.prototype.initPlayerElement = function(){
	this.$playerElement.css({
		'position': 'absolute',
		'top': '0px',
		'left': '0px',
		'width': this.NATIVE_PLAYER_ELEMENT_WIDTH,
		'height': this.NATIVE_PLAYER_ELEMENT_HEIGHT,
		'z-index': this.Z_INDEX_PLAYER
	});
	this.$playerElement.addClass( this.PLAYER_ELEMENT_CLASS );
	this.$playerElement.appendTo( this.$wrapperElement );
}



// The controls element is the controls bar that contains the control buttons.
ximpel.XimpelAppView.prototype.initControlsElement = function(){
	this.$controlsElement.hide();
	this.$controlsElement.css({
		'position': 'absolute',
		'top': this.$playerElement.height() +'px',
		'left': '0px',
		'width': '100%',
		'height': this.DEFAULT_CONTROL_HEIGHT,
		'z-index': this.Z_INDEX_CONTROLS
	});
	this.updateControlsElementClass();
	this.$controlsElement.appendTo( this.$wrapperElement );
}



// The wrapperElement is just a wrapper around the content of the ximpel presentation. When the size of the wrapper 
// element changes, then the content is scaled to fit within the container element taking up as much space as possible
// while maintining the original aspect ratio.
ximpel.XimpelAppView.prototype.initWrapperElement = function(){
	this.$wrapperElement.css({
		'position': 'absolute',
		'top': '0px',
		'left': '0px',
		'width': this.$playerElement.width() + 'px',
		'height': this.$playerElement.height() + 'px'
	});

	this.$wrapperElement.addClass( this.WRAPPER_ELEMENT_CLASS );
	this.$wrapperElement.appendTo( this.$appElement );
}



// This initializes the elements that represent the control buttons of the presentation.
ximpel.XimpelAppView.prototype.initButtonElements = function(){
	var buttonWidth = this.DEFAULT_CONTROL_HEIGHT;
	var buttonHeight = this.DEFAULT_CONTROL_WIDTH;
	this.initButtonElement( this.$playButtonElement, 'ximpel/images/play_button.png', 'left', buttonWidth, buttonHeight, this.playHandler.bind(this) );
	this.initButtonElement( this.$pauseButtonElement, 'ximpel/images/pause_button.png', 'left', buttonWidth, buttonHeight, this.pauseHandler.bind(this) );
	this.initButtonElement( this.$stopButtonElement, 'ximpel/images/stop_button.png', 'left', buttonWidth, buttonHeight, this.stopHandler.bind(this) );
	this.initButtonElement( this.$fullscreenButtonElement, 'ximpel/images/fullscreen_button.png', 'right', buttonWidth, buttonHeight, this.fullscreenHandler.bind(this) );
}



// This initializes one specific control button element.
ximpel.XimpelAppView.prototype.initButtonElement = function( $buttonElement, backgroundImage, floatDirection, buttonWidth, buttonHeight, handler ){
	$buttonElement.css({
		'float': floatDirection,
		'background-image': 'url('+backgroundImage+')',
		'background-size': 'cover',
		'height': buttonHeight,
		'width': buttonWidth,

	});
	$buttonElement.hover( function(){
		$(this).css('cursor', 'pointer');
	}, function(){
		$(this).css('cursor', 'default');
	} );
	$buttonElement.addClass( this.CONTROL_CLASS );
	$buttonElement.on('click', handler );
	$buttonElement.hide();
	$buttonElement.appendTo( this.$controlsElement );
}



// The renderView() method is mandatory to implement for any object that wants to be a view and has a View() object as prototype.
// This renderView() will be run when render() is called which is implemented in the prototype (a View() object).
// So this is called when doing: new ximpel.XimpelAppView(...).render();
ximpel.XimpelAppView.prototype.renderView = function( $parentElement ){
	var model = this.model;
	var $parentElement = $parentElement || this.$appElement.parent();


	if( !$parentElement || $parentElement.length <= 0 ){
		// there is no parent DOM element specified to attach to, so we just attach to the body element.
		$parentElement = $( document.body );
	}
	
	// We need to append the appElement now (if its not already) because if the app element is not attached
	// to the DOM yet then we cannot reliably determine the height of elements using javascript.
	if( this.$appElement.parent().length <= 0 ){
		this.$appElement.appendTo( $parentElement );
	}

	this.renderControls();
	this.renderWrapper();
	this.listenForWindowResize();
	this.listenForKeyPresses();
	this.listenForFullscreenChange();
}




ximpel.XimpelAppView.prototype.renderControls = function(){
	if( ! this.controlsEnabled() ){
		return;
	}
	this.updateControlsElementClass();
	var controlsPosition = this.determineControlsPosition();
	this.$controlsElement.css({
		'left': controlsPosition.x + "px",
		'top': controlsPosition.y + "px"
	});

	this.$controlsElement.show();
	this.renderControlButtons();
}




ximpel.XimpelAppView.prototype.renderControlButtons = function(){
	var buttonHeight = this.$controlsElement.height();
	var buttonWidth = buttonHeight;

	if( this.model.appReadyState === this.model.APP_READY_STATE_READY ){
		this.renderPlaybackButtons( buttonWidth, buttonHeight );
	}

	this.$fullscreenButtonElement.show();
}




ximpel.XimpelAppView.prototype.renderPlaybackButtons = function( buttonWidth, buttonHeight ){
	if( this.model.playerState === this.model.PLAYER_STATE_PLAYING ){
		this.$playButtonElement.hide();
		this.$pauseButtonElement.show();
		this.$stopButtonElement.show();	
	} else if( this.model.playerState === this.model.PLAYER_STATE_PAUSED ){
		this.$pauseButtonElement.hide();
		this.$playButtonElement.show();
		this.$stopButtonElement.show();	
	} else if( this.model.PLAYER_STATE_STOPPED ){
		this.$pauseButtonElement.hide();
		this.$stopButtonElement.hide();	
		this.$playButtonElement.show();
	}
}



ximpel.XimpelAppView.prototype.fullscreenHandler = function(){
	this.toggleFullscreen();
}



ximpel.XimpelAppView.prototype.playHandler = function(){
	this.pubSub.publish( this.PLAY_EVENT );
}



ximpel.XimpelAppView.prototype.pauseHandler = function(){
	this.pubSub.publish( this.PAUSE_EVENT );
}



ximpel.XimpelAppView.prototype.stopHandler = function(){
	this.pubSub.publish( this.STOP_EVENT );
}



ximpel.XimpelAppView.prototype.registerPlayHandler = function( handler ){
	return this.pubSub.subscribe( this.PLAY_EVENT, handler );
}



ximpel.XimpelAppView.prototype.registerPauseHandler = function( handler ){
	return this.pubSub.subscribe( this.PAUSE_EVENT, handler );
}



ximpel.XimpelAppView.prototype.registerStopHandler = function( handler ){
	return this.pubSub.subscribe( this.STOP_EVENT, handler );
}



ximpel.XimpelAppView.prototype.updateControlsElementClass = function(){
	this.$controlsElement.removeClass();

	switch( this.getControlsDisplayMethod() ){
		case this.CONTROLS_DISPLAY_METHOD_OVERLAY:
			var controlsDisplayMethodClass = this.CONTROLS_DISPLAY_METHOD_OVERLAY_CLASS; break;
		case this.CONTROLS_DISPLAY_METHOD_FIXED:
			var controlsDisplayMethodClass = this.CONTROLS_DISPLAY_METHOD_FIXED_CLASS; break;
	}

	this.$controlsElement.addClass(  this.CONTROLS_CLASS + ' ' + controlsDisplayMethodClass );
}



ximpel.XimpelAppView.prototype.renderWrapper = function(){
	var wrapperDimensions = this.determineWrapperDimensions();
	this.$wrapperElement.css({
		'width': wrapperDimensions.width + "px",
		'height': wrapperDimensions.height + "px"
	});

	// We need to show the wrapper element in order to determine its dimensions.
	this.$wrapperElement.show();

	var appWidth = this.$appElement.width();
	var appHeight = this.$appElement.height();
    var contentWidth = this.$wrapperElement.width();
    var contentHeight = this.$wrapperElement.height();

    // We scale the wrapperElement element such that it fits entirely into the $appElement as largely as possible
    // but while maintining aspect ratio. (ie. either the width or height are 100% of the $appElement.)
    this.scaleToFit( this.$wrapperElement, appWidth, appHeight, contentWidth, contentHeight );
    
    // then we reposition the element such that is centered within the $appElement. So when the height is 100% it is 
    // centered horizontally and when the width is 100% its centered vertically. Note that jquery's .width and .height()
    // do not return the new scaled with of the element which we do need. So isntead we use getBoundingClientRect().
    var scaledContentWidth = this.$wrapperElement[0].getBoundingClientRect().width;
    var scaledContentHeight = this.$wrapperElement[0].getBoundingClientRect().height;
    this.repositionInCenter( this.$wrapperElement, appWidth, appHeight, scaledContentWidth, scaledContentHeight );
}



ximpel.XimpelAppView.prototype.determineControlsPosition = function(){
	var wrapperDimensions = this.determineWrapperDimensions();
	var controlsDisplayMethod = this.getControlsDisplayMethod();
	if( controlsDisplayMethod === this.CONTROLS_DISPLAY_METHOD_OVERLAY ){
		var x = 0;
		var y = (wrapperDimensions.height-this.$controlsElement.height() );
	} else if( controlsDisplayMethod === this.CONTROLS_DISPLAY_METHOD_FIXED ){
		var x = 0;
		var y = (wrapperDimensions.height-this.$controlsElement.height() );
	} else{
		var x = 0;
		var y = 0;
	}
	return {'x': x, 'y': y };
}



ximpel.XimpelAppView.prototype.determineWrapperDimensions = function(){
	var controlsDisplayMethod = this.getControlsDisplayMethod();
	var controlsEnabled = this.controlsEnabled();
	if( !controlsEnabled ){
		var width = this.$playerElement.width();
		var height = this.$playerElement.height();
	} else if( controlsDisplayMethod === this.CONTROLS_DISPLAY_METHOD_OVERLAY ){
		var width = this.$playerElement.width();
		var height = this.$playerElement.height();
	} else if( controlsDisplayMethod === this.CONTROLS_DISPLAY_METHOD_FIXED ){
		var width = this.$playerElement.width();
		var height = (this.$playerElement.height()+this.$controlsElement.height());
	}
	return {'width': width, 'height': height };
}



// implement a destroyView method which is called when the ximpelApp.destroy() method is called.
ximpel.XimpelAppView.prototype.destroyView = function(){
	//	console.log("view destroyed!");
}



ximpel.XimpelAppView.prototype.listenForWindowResize = function(){
	// Listen for window resizes and re-render the view because elements may have changed size.
	// Only start rendering if the window was stopped being resized at least 50ms ago (for performance).
	var resizeTimer;
	var namespace = 'ximpelAppViewWindowResize_'+this.model.appId;
	$(window).off('resize.'+namespace );
	$(window).on('resize.'+namespace, function() {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( this.windowResizeHandler.bind( this ), 100);
	}.bind(this) );
}



ximpel.XimpelAppView.prototype.windowResizeHandler = function(){
	this.render();
}



ximpel.XimpelAppView.prototype.listenForKeyPresses = function(){
	var namespace = 'ximpelAppView_'+this.model.appId;
	this.$appElement.off("keypress."+namespace);
	this.$appElement.on("keypress."+namespace, function( event ){
		if( event.which === 102 ){ // the f key
			this.toggleFullscreen();
		} else if( event.which === 115 ){ // the s key (start)
			this.playHandler();
		} else if( event.which === 113 ){ // the q key (quit)
			this.stopHandler();
		} else if( event.which === 112 ){ // the p key (pause_)
			this.pauseHandler();
		}
	}.bind(this) );
}



ximpel.XimpelAppView.prototype.toggleFullscreen = function(){
	var appElement = this.$appElement[0];
	// If there is an element in fullscreen then we exit fullscreen mode.
	if( this.fullscreenElement() ){
		this.exitFullscreen();
		return;
	}

	// If fullscreen is supported then we request the appElement element to be displayed fullscreen.
	if( this.fullscreenSupported() ){
		this.requestFullscreen( appElement );
	}
}



ximpel.XimpelAppView.prototype.exitFullscreen = function(){
	if( document.exitFullscreen ){
		document.exitFullscreen();
	} else if( document.webkitExitFullscreen ){
		document.webkitExitFullscreen();
	} else if( document.mozCancelFullScreen ){
		document.mozCancelFullScreen();
	} else if( document.msExitFullscreen ){
		document.msExitFullscreen();
	} else{
		return false;
	}
	return true;
}



ximpel.XimpelAppView.prototype.fullscreenElement = function(){
	return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
}



ximpel.XimpelAppView.prototype.requestFullscreen = function( element ){
	if( element.requestFullscreen ){
		element.requestFullscreen();
	} else if( element.webkitRequestFullscreen ){
		element.webkitRequestFullscreen();
	} else if( element.mozRequestFullScreen ){
		element.mozRequestFullScreen();
	} else if( element.msRequestFullscreen ){
		element.msRequestFullscreen();
	} else{
		return false;
	}
	return true;
}



ximpel.XimpelAppView.prototype.fullscreenSupported = function(){
	return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
}



// Start listening for the fullscreenchange event and execute the fullscreenChangeHandler() function when the event is triggered.
ximpel.XimpelAppView.prototype.listenForFullscreenChange = function(){
	var namespace = 'ximpelAppViewFullscreen_'+this.model.appId;
	$(document).off('webkitfullscreenchange.'+namespace+' mozfullscreenchange.'+namespace+' fullscreenchange.'+namespace+' MSFullscreenChange.'+namespace );
	$(document).on('webkitfullscreenchange.'+namespace+' mozfullscreenchange.'+namespace+' fullscreenchange.'+namespace+' MSFullscreenChange.'+namespace, this.fullscreenChangeHandler.bind(this) );
}



// When the appElement goes into fullscreen or comes out of fullscreen we need to set the width and height of the
// $appElement because in some browsers the size of an element is not set to the size of the window when 
// going fullscreen. So we need to set this explicitly when going into fullscreen en changing it back when
// going out of fullscreen.
ximpel.XimpelAppView.prototype.fullscreenChangeHandler = function(){
	var fullscreenElement = this.fullscreenElement();
	if( fullscreenElement ){
		// There is a fullscreen element so we just went into fullscreen mode.
		this.$appElement.width( $(window).width() );
		this.$appElement.height( $(window).height() );
	} else{
		// There is no fullscreen element so we just got out of fullscreen mode. 
		// We reset the width and height of the container element to its original value.
		this.$appElement.width( this.initialAppWidth );
		this.$appElement.height( this.initialAppHeight );
	}
	this.render();
}



// Return the scale with which to resize a rectangle's x and y dimensions such that that neither x nor y exceed the specified maximum width or height while
// x and y are both as large as possible (ie. either x or y takes up the full maximum width or height).
ximpel.XimpelAppView.prototype.getScaleFactor = function( availableWidth, availableHeight, actualWidth, actualHeight ){
	var scale = Math.min( availableWidth / actualWidth, availableHeight / actualHeight );
	return scale;
}



// Return the x and y coordinates for a rectangle centered within some available space (another rectangle). If the rectangle to be centered is bigger then the 
ximpel.XimpelAppView.prototype.getCenteredRectangleCoordinates = function( availableWidth, availableHeight, actualWidth, actualHeight ){
	var x = Math.abs( Math.round( ( availableWidth-actualWidth ) / 2 ) );
	var y = Math.abs( Math.round( ( availableHeight-actualHeight ) / 2 ) );
	return { 'x': x, 'y': y };
}



ximpel.XimpelAppView.prototype.getPlayerElement = function(){
	return this.$playerElement;
}



ximpel.XimpelAppView.prototype.scaleToFit = function( $el, availWidth, availheight, contentWidth, contentHeight ){
	var scale = this.getScaleFactor( availWidth, availheight, contentWidth, contentHeight );
	$el.css({
		'-webkit-transform' : 'scale(' + scale + ',' + scale + ')',
		'-moz-transform'    : 'scale(' + scale + ',' + scale + ')',
		'-ms-transform'     : 'scale(' + scale + ',' + scale + ')',
		'-o-transform'      : 'scale(' + scale + ',' + scale + ')',
		'transform'         : 'scale(' + scale + ',' + scale + ')',
		'-webkit-transform-origin' : 'top left',
		'-moz-transform-origin'    : 'top left',
		'-ms-transform-origin'     : 'top left',
		'-o-transform-origin'      : 'top left',
		'transform-origin'         : 'top left',
	});
}



ximpel.XimpelAppView.prototype.repositionInCenter = function( $el, availWidth, availheight, contentWidth, contentHeight ){
	var coordinates = this.getCenteredRectangleCoordinates( availWidth, availheight, contentWidth, contentHeight );	
	$el.css({
		'left': coordinates.x + 'px',
		'top': coordinates.y + 'px'
	});
}



ximpel.XimpelAppView.prototype.getControlsDisplayMethod = function(){
	return this.model.configModel.controlsDisplayMethod;
}



ximpel.XimpelAppView.prototype.controlsEnabled = function(){
	return this.model.configModel.enableControls;
}



ximpel.XimpelAppView.prototype.determineAppWidth = function( specifiedWidth ){
	var $parent = this.$appElement.parent();

	if( specifiedWidth ){
		return specifiedWidth;
	} else if( this.$appElement.width() > 0 ){
		return this.$appElement.width() + "px";
	} else{
		return this.DEFAULT_APP_WIDTH;
	}
}



ximpel.XimpelAppView.prototype.determineAppHeight = function( specifiedHeight ){
	var $parent = this.$appElement.parent();
	if( specifiedHeight ){
		return specifiedHeight;
	} else if( this.$appElement.height() > 0 ){
		return this.$appElement.height() + 'px';
	} else{
		return this.DEFAULT_APP_HEIGHT;
	}
}



ximpel.XimpelAppView.prototype.determineAppElement = function( specifiedAppElement ){
	var $appElement = ximpel.getElement( specifiedAppElement );

	if( ! $appElement ){
		$appElement = this.createAppElement( specifiedAppElement );
	}
	return $appElement;
}



// Create the XIMPEL element. The element will have the ID as specified in "specifiedElementId" or the default ID if none is specified.
// If that ID is already in use by another element, then a suffix number will be added to get an ID that is not in use.
ximpel.XimpelAppView.prototype.createAppElement = function( specifiedEementId ){
	var specifiedEementId = specifiedEementId || this.DEFAULT_XIMPEL_APP_ELEMENT_ID;
	var elementId = specifiedEementId;
	var suffixCounter = 2;

	// Keep trying to generate new element id's until we found an element ID that does not yet exist.
	while( document.getElementById(elementId) ){
		elementId = specifiedEementId + "-" + suffixCounter;
		suffixCounter++;
	}
	
	// We found an elementId that doesn't exist yet, so we create a <div> with that ID.
	var $el = $("<div></div>").attr({
		'id': elementId
	});

	return $el;
}
