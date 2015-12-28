/* This file contains the media type definitions that ship natively with ximpel. Any custom media types can be defined here as well 
 * or they can be defined in a seperate file that must be included on the page after the inclusion of Ximpel.js and MediaType.js.
 * A media type definition consists of two parts:
 * 	1. The definition of the media type (its methods and properties).
 * 		- The definitions by default are added to the: ximpel.mediaTypeDefinitions namespace, but this is not required.
 *		- The prototype of a definition must be set to an instance of ximpel.MediaType(). Any methods and constants are added to that instance.
 *		- The constructor of the mediatype will be called with two arguments: customElements and customAttributes. These arguments give access
 *		  to the custom elements and custom attributes specified in the playlist for that custom media element. For example:
 *		  		<video startTime="5" duration="3">
 *		      		<source src="file.mp4" type="video/mp4" />
 *		 	 	</video>
 *		  In the above case the constructor will be passed an object containing the custom element names (source) and its attributes (src, type).
 * 		  It will also pas an object containing the attributes added to the <video> tag itself (startTime, duration).
 *		  The customElements argument is an array containing objects which have the form: 
 *		  		{'elementName':'source', 'elementAttributes': {'src': 'file.mp4', 'type': 'video/mp4'}}
 *		  The customAttributes argument is an object in the form:
 *				{'startTime': '5', 'duration': '3'}
 *
 * 	2. The registration of the media type.
 *		- The registration of a media type is done by creating a ximpel.MediaTypeRegistration() object.
 * 		- The registration object specifies the mediaTypeId, the constructor, and some other information about the media type.
 *		- The registration objects are passed to the ximpel.registerMediaType() function which registers the media type (if its valid).
 *
 */

// TODO:
// - Now the width, height,x and y of the video are always specified in pixels (we manually add 'px' behind
//	 given value). Howver we may want to support percentages or some other unit as well.
// ##################################################################################################
// ##################################################################################################
// ##################################################################################################
ximpel.mediaTypeDefinitions.Video = function( customElements, customAttributes, $parentElement, player ){
	// The custom elements that were added inside the <video> tag in the playlist (<source> for example).
	this.customElements = customElements;

	// The custom attributes that were added to the <video> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this video can attach itself (this is the element to which all media DOM nodes will be attached).
	this.$attachTo = $parentElement;

	// A reference to the XIMPEL player object. The media type can make use of functions on the player object.
	this.player = player;

	// The x coordinate of the video relative to the main ximpel element or 'center' to align center.
	this.x = this.customAttributes.x || 'center';

	// The y coordinate of the video relative to the main ximpel element or 'center' to align center.
	this.y = this.customAttributes.y || 'center';

	// The width of the video element. A default is used when not specified.
	this.width = this.customAttributes.width;

	// The height of the video element. A default is used when not specified.
	this.height = this.customAttributes.height;

	// The point in the video from which the video should start playing (if not specified in the playlist then it is set to 0.)
	this.startTime = customAttributes['startTime'] || 0;

	// will hold the video element.
	this.$video = null;

	// Get the <source> element that was specified in the playlist for this video (should be one element)
	var playlistSourceElement = ximpel.filterArrayOfObjects( customElements, 'elementName', 'source' )[0];

	// Get a jquery object that contains all the html source elements that should be added to the video element.
	this.$htmlSourceElements = this.getHtmlSourceElements( playlistSourceElement );

	this.bufferingPromise = null;

	// State of the media item.
	this.state = this.STATE_STOPPED;
}

ximpel.mediaTypeDefinitions.Video.prototype = new ximpel.MediaType();
ximpel.mediaTypeDefinitions.Video.prototype.STATE_PLAYING = 'state_video_playing';
ximpel.mediaTypeDefinitions.Video.prototype.STATE_PAUSED = 'state_video_paused';
ximpel.mediaTypeDefinitions.Video.prototype.STATE_STOPPED = 'state_video_stopped';


ximpel.mediaTypeDefinitions.Video.prototype.calculateVideoDetails = function(){
	var playerElementWidth = this.$attachTo.width();
	var playerElementHeight = this.$attachTo.height();

	// if x and or y is "center" then we will determine the x and y coordinates when we append the video element to the DOM.
	// We do it later because we can only reliably determine the x/y coordinate when the video element is loaded and appended to the DOM.
	var x = this.x === 'center' ? '0px' : this.x; 
	var y = this.y === 'center' ? '0px' : this.y;

	// By now the video has been appened to the DOM. This means that we can now retrieve the width and height of the video element.
	// Determine values for width and height
	if( !this.width && !this.height ){
		// Both width and height have not been specified. In that case we want the video
		// to be displayed as large as possible while maintaining aspect ratio of the video.
		var intrinsicVideoWidth = this.$video[0].videoWidth;
		var intrinsicVideoHeight = this.$video[0].videoHeight;
		var videoAspectRatio = intrinsicVideoWidth / intrinsicVideoHeight;
		var playerElementAspectRatio = playerElementWidth / playerElementHeight;

		if( videoAspectRatio >= playerElementAspectRatio ){
			var width = '100%';
			var height = 'auto';
		} else{
			var width = 'auto';
			var height = '100%';
		}
	} else if( !this.width ){
		// A height was specifie but no width
		var width = 'auto';
		var height = this.height;
	} else if( !this.height ){
		// A width was specified but no height.
		var width = this.width;
		var height = 'auto'
	} else{
		var width = this.width;
		var height = this.height;
	}

	this.$video.attr({
		'preload': 'none',
		//'controls': '',
		//'muted': '',
	}).css({
		'position': 'absolute',
		'width': width,
		'height': height,
		'left': x,
		'top': y
	});


	// If x or y are set to 'center' then we use the width and height of the video element to determine the x and y coordinates such
	// that the video element is centered within the player element.
	if( this.x === 'center' ){
		var x = Math.round( Math.abs( this.$attachTo.width() - this.$video.width() ) / 2 );
		this.$video.css('left', x );
	}
	if( this.y === 'center' ){
		var y = Math.round( Math.abs( this.$attachTo.height() - this.$video.height() ) / 2 );
		this.$video.css('top', y );
	}
}


// The play method starts playing the video. Depending on the state of the video two things may happen:
// - If the video is stopped then it will start the video from scratch.
// - If the video is paused then it will resume the media item from its paused playback position.
ximpel.mediaTypeDefinitions.Video.prototype.mediaPlay = function(){
	// Ignore this call if this media item is already playing.
	if( this.state === this.STATE_PLAYING ){
		return;
	} else if( this.state === this.STATE_PAUSED ){
		this.resume();
		return;
	}

	// Indicate that the media item is in a playing state now.
	this.state = this.STATE_PLAYING;

	// create the video element but don't start loading untill we call .load()
	var $video = this.$video = $('<video />', {
		'preload': 'none'
	});
	var videoElement = $video[0];

	// Add the HTML source elements to the video element.
	$video.append( this.$htmlSourceElements );

	// Every media type which has an ending should call the .ended() method when the media has ended. 
	// ended() is a method on the prototype. By calling the ended() method, all handler functions registered
	// with .addEventHandler('end', func) will be called.
	$video.on('ended', this.ended.bind(this) );
	
	// Set an event listener (that runs only once) for the loadedmetadata event. 
	// This waits till the metadata (duration, videoWidth, videoHeight) has been loaded.
	$video.one("loadedmetadata", function(){
		// Set the current position in the video to the appropriate startTime (can only be done after the metadata is loaded).
		videoElement.currentTime = this.startTime;
		this.$video.appendTo( this.$attachTo );
		// This sets the x, y, width and height of the video.
		this.calculateVideoDetails();
	}.bind(this) );

	// Next we create a jquery deferred object (promise) and we define that the video element
	// starts playing when the deferred is resolved. The deferred will be resolved as soon as
	// the canplaythrough event is thrown by the video element.
	var deferred = new $.Deferred();
	deferred.done( function(){
		// When the buffering is done and the media item is still in a playing state then play the 
		// media item, otherwise do nothing. It may be the case that the media item is in a non-playing
		// state when the pause() method has been called during the buffering.
		if( this.state === this.STATE_PLAYING ){
			videoElement.play();
		}
	}.bind(this) );


	// Set an event listener for the canplaythough event. This waits until enough of the video has been loaded 
	// to play without stuttering (as estimated by the browser). Note that canplaythrough event has some browsers 
	// differences. Some browsers call it multiple times and others call it only once. It is also not clear whether
	// canplaythrough means the video has enough data to play from the beginning or has enough data to play from 
	// the video's current time. This means that the video may not be preloaded properly even when the 
	// canplaythrough event is thrown.
	$video.one("canplaythrough", function(){
		// The video is preloaded. We resolve the deferred object so that the registered callbacks are 
		// called (the callbacks registered with .done() .succeed() etc)
		deferred.resolve();
	}.bind(this) );

	// Attach a handler function for when the video fails to load.
	$video.error( function(e){
		ximpel.warn("Video.mediaPlay(): failed to buffer the video: '" + videoElement.src + "'.");
		deferred.reject();
	}.bind(this) );

	// start loading now.
	videoElement.load();
	
	this.bufferingPromise = deferred.promise();
	return this.bufferingPromise;
}





ximpel.mediaTypeDefinitions.Video.prototype.resume = function(){
	// Indicate that the media item is in a playing state now.
	this.state = this.STATE_PLAYING;
	if( this.bufferingPromise.state() === "resolved" ){
		this.$video[0].play();
	}
}

// The pause method pauses the video if the video is in a playing state, otherwise it does nothing.
ximpel.mediaTypeDefinitions.Video.prototype.mediaPause = function(){
	// Ignore this pause request if the video is not in a playing state.
	if( this.state !== this.STATE_PLAYING ){
		return;
	}
	this.state = this.STATE_PAUSED;
	this.$video[0].pause();
}


// The stop method stops the video entirely without being able to resume later on. After this method the video playback pointer
// has been reset to its start position and the video element is detached from the DOM, so nothing is visible anymore.
ximpel.mediaTypeDefinitions.Video.prototype.mediaStop = function(){
	// Ignore this stop request if the video is already in a stopped state.
	if( this.state === this.STATE_STOPPED ){
		return;
	}
	var $video = this.$video;
	this.state = this.STATE_STOPPED;

	var videoElement = this.$video[0];
	videoElement.pause();
	videoElement.src = "";
	videoElement.load();
	$video.detach();
	$video.remove();
	this.$video = null;
	this.bufferingPromise = null;
}

// Returns whether the video is playing.
ximpel.mediaTypeDefinitions.Video.prototype.mediaIsPlaying = function(){
	return this.state === this.STATE_PLAYING;
}

// Returns whether the video is paused.
ximpel.mediaTypeDefinitions.Video.prototype.mediaIsPaused = function(){
	return this.state === this.STATE_PAUSED;
}

// Returns whether the video is stopped.
ximpel.mediaTypeDefinitions.Video.prototype.mediaIsStopped = function(){
	return this.state === this.STATE_STOPPED;
}


// Every media item can implement a getPlayTime() method. If this method is implemented by the media item then ximpel will use this method to determine
// how long the media item has been playing. If this method is not implemented then ximpel itself will calculate how long a media item has been playing. Note that
// the media item can sometimes better determine the play time. For instance, if the network has problems causing the video to stop loading, then ximpel
// would not be able to detect this and use an incorrect play time. A video media item could still determine the correct play time by looking at the current playback
// time of the video element. This is exactly what the getPlayTime method of this video media item does. It returns the play time in miliseconds.
ximpel.mediaTypeDefinitions.Video.prototype.getPlayTime = function(){
	var videoElement = this.$video[0];
	if( videoElement.currentTime == 0 ){
		return 0;
	} else{
		return (videoElement.currentTime - this.startTime) * 1000;
	}
}


// In the ximpel playlist there is one source element for each video. Within this source element multiple sources can be specified by
// using the extensions and types attribute to specify multiple source files. This method takes the custom source element specified in the
// playlist and returns a jquery object containing one or more HTML5 source elements. The returned set of HTML5 source elements can be
// appended to the html5 <video> element such that the browser can choose wich source it uses.
ximpel.mediaTypeDefinitions.Video.prototype.getHtmlSourceElements = function( playlistSourceElement ){
	// The name/path of the file (without the file extension)
	var filename = playlistSourceElement.elementAttributes.file;
	
	// The extensions attribute contains a comma seperated list of available file extensions. If the extension attribute
	// has the value: "mp4, webm", then it means that there is a <filename>.mp4 and a <filename>.webm availabe.
	var extensions = playlistSourceElement.elementAttributes.extensions || "";
	extensions = extensions.replace(/\s/g, ""); // remove white space characters
	extensionsArray = extensions.split(",");

	// The types attribute contains a comma seperated list of mime types. The first mime type corresponds to the first extension
	// listed in the extensions attribute, the second mime type to the second extension and so on. 
	var types = playlistSourceElement.elementAttributes.types || "";
	types = types.replace(/\s/g, "");
	typesArray = types !== "" ? types.split(",") : [];

	// For each of the listed extensions we create a <source> element with a corresponding src attribute and type attribute.
	var $sources = $([]);
	for( var i=0; i<extensionsArray.length; i++ ){
		var type = typesArray[i] || "";
		var src = filename+"."+extensionsArray[i];

		// Check if a media directory was specified, if so the src is made to be relative to this mediaDirectory
		var mediaDirectory = this.player.getConfigProperty("mediaDirectory") || "";
		if( mediaDirectory != "" ){
			src = mediaDirectory + "/" + src; 
		}

		var $source = $('<source />').attr({
			'src': src,
			'type': type
		});
		$sources = $sources.add( $source );
	}

	// return a jquery object containing the source elements.
	return $sources;
}


ximpel.registerMediaType(
	new ximpel.MediaTypeRegistration( 'video', ximpel.mediaTypeDefinitions.Video, {
		'allowedAttributes': ['width', 'height', 'x', 'y', 'startTime'],
		'requiredAttributes': [],
		'allowedChildren': ['source'],
		'requiredChildren': ['source'],
	})
);