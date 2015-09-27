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
 *		  		{'elementName':'source', 'elementAttributes': [{'name': 'src', 'value': 'file.mp4'}, {'name': 'type', 'value': 'video/mp4'}]}
 *		  The customAttributes argument is an object in the form:
 *				{'startTime': '5', 'duration': '3'}
 *
 * 	2. The registration of the media type.
 *		- The registration of a media type is done by creating a ximpel.MediaTypeRegistration() object.
 * 		- The registration object specifies the mediaTypeId, the constructor, and some other information about the media type.
 *		- The registration objects are passed to the ximpel.registerMediaType() function which registers the media type (if its valid).
 *
 */

// ##################################################################################################
// ##################################################################################################
// ##################################################################################################
ximpel.mediaTypeDefinitions.Video = function( customElements, customAttributes, $parentElement ){
	// The custom elements that were added inside the <video> tag in the playlist (<source> for example).
	this.customElements = customElements;

	// The custom attributes that were added to the <video> tag in the playlist.
	this.customAttributes = customAttributes;

	// Set the x coordinate of the video relative to the  the main ximpel element.
	this.x = this.customAttributes.x || 0;

	// Set the y coordinate of the video relative to the the main ximpel element.
	this.y = this.customAttributes.y || 0;

	// The XIMPEL player element to which this video can attach itself (this is the element to which all media DOM nodes will be attached).
	this.$attachTo = $parentElement;

	// The point in the video from which the video should start playing (if not specified in the playlist then it is set to 0.)
	this.startTime = customAttributes['startTime'] || 0;

	// The number of seconds the video should play from the startTime point onward. (if not specified it will be set to 0 which means: play till the end.)
	this.duration = customAttributes['duration'] || 0; 

	// The time between drawing a video frame of the video element onto the canvas in miliseconds (ie. if 20 then every 20 miliseconds a frame is drawn)
	this.drawDelay = 20;

	// This is the jquery wrapper of the canvas element on which the video will be drawn. The canvas will be created later on.
	this.$canvas = null;

	// This is the jquery wrapper for the video element which is to be played. 
	// The video element itself won't be displayed but its frames will be drawn on a canvas
	this.$video = $('<video />', {
		'id': 'test',
		'preload': 'none',
		'controls': 'true',
		'autoplay': 'false',
		'muted': 'true'
	}).css({
		'position': 'absolute',
		'left': this.x + 'px',
		'top': this.y + 'px'
/*		'background-color': 'black'*/
	});

	if( this.customAttributes.width ){
		this.$video.attr('width', this.customAttributes.width+'px' );
	}

	if( this.customAttributes.height ){
		this.$video.attr('height', this.customAttributes.height+'px' );
	}

	// Get an array with the <source> elements that were specified in the playlist.
	this.sources = ximpel.filterArrayOfObjects( customElements, 'elementName', 'source' );

	// Get the source (from among the sources specified in the playlist) that is most likely to have the best suppport.
	this.videoSource = this.determineBestSource( this.sources );

	// Set the source of the video. Note that this does not preload the video yet as we have set the 'preload' property of the video element to 'none'.
	this.$video.attr( 'src', this.videoSource );

	// Every media type should call the .ended() method when the media has ended. ended() is a method on the prototype.
	// By calling the ended() method, all handler functions registered with .onEnd() will be called. (onEnd() is also on the prototype)
	this.$video.on('ended', this.ended.bind(this) );

	this.state = this.STATE_STOPPED;
}


ximpel.mediaTypeDefinitions.Video.prototype = new ximpel.MediaType();
ximpel.mediaTypeDefinitions.Video.prototype.mediaTypeId = 'video';

ximpel.mediaTypeDefinitions.Video.prototype.STATE_PLAYING = 'state_video_playing';
ximpel.mediaTypeDefinitions.Video.prototype.STATE_PAUSED = 'state_video_paused';
ximpel.mediaTypeDefinitions.Video.prototype.STATE_STOPPED = 'state_video_stopped';



// The play method starts playing the video. Depending on the state of the video two things may happen:
// - If the video is stopped then it will start the video from scratch.
// - If the video is paused then it will resume the media item from its paused playback position.
ximpel.mediaTypeDefinitions.Video.prototype.mediaPlay = function(){
	var $video = this.$video;
	var videoElement = $video[0];

	// Ignore this call if this media item is already playing.
	if( this.state === this.STATE_PLAYING ){
		return;
	}

	// Tell the video element to start playing.
	videoElement.play();

	// If the media item is in a stopped state then we the video element isnt attached to the DOM yet.
	if( this.state === this.STATE_STOPPED ){
		$video.appendTo( this.$attachTo );
	}

	// Indicate that the media item is in a playing state now.
	this.state = this.STATE_PLAYING;


	// Create a canvas to which the video frames are drawn if one doesn't exist yet.
	//if( ! this.$canvas ){
	//	this.$canvas = this.createCanvasElement( videoElement.width, videoElement.height );
	//}
	//var canvasElement = this.$canvas[0]; 
	//var canvasContext = canvasElement.getContext('2d');
   	//this.drawVideoFramesToCanvas( videoElement, canvasContext );
}


// The pause method pauses the video if the video is in a playing state, otherwise it does nothing.
ximpel.mediaTypeDefinitions.Video.prototype.mediaPause = function(){
	// Ignore this pause request if the video is not in a playing state.
	if( this.state !== this.STATE_PLAYING ){
		return;
	}

	var $video = this.$video;
	var videoElement = $video[0];

	this.state = this.STATE_PAUSED;
	videoElement.pause();
}


// The stop method stops the video entirely without being able to resume later on. After this method the video playback pointer
// has been reset to its start position and the video element is detached from the DOM, so nothing is visible anymore.
ximpel.mediaTypeDefinitions.Video.prototype.mediaStop = function(){
	// Ignore this stop request if the video is already in a stopped state.
	if( this.state === this.STATE_STOPPED ){
		return;
	}
	var $video = this.$video;
	var videoElement = $video[0];
	this.$video.detach();
	videoElement.pause();
	videoElement.currentTime = this.startTime;
	this.state = this.STATE_STOPPED;
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

// This method preloads the video. It returns a jquery promise object which is resolved as soon as the preloading is done.
// The preloading is done when the video is estimated to be able to play through without hickups. This is estimated by the 
// browser and different browsers may approximate it in different ways.
ximpel.mediaTypeDefinitions.Video.prototype.mediaPreload = function(){
	var $video = this.$video;
	var videoElement = $video[0];
	var deferred = new $.Deferred();
	
	// Set an event listener (that runs only once) for the loadedmetadata event. This waits till the metadata (duration, videoWidth, videoHeight) has been loaded.
	$video.one("loadedmetadata", function(){
		console.log("loadedmetadata");
		// Set the current position in the video to the appropriate startTime (can only be done after the metadata is loaded).
		videoElement.currentTime = this.startTime;

		// Create the canvas element on which the video will be drawn.
		//this.createCanvasElement( videoElement.width, videoElement.height );
	}.bind(this) );

	// Set an event listener for the canplaythough event. This waits until enough of the video has been loaded to play without stuttering (as estimated by the browser).
	$video.one("canplaythrough", function(){
		console.log( "canplaythrough" );

		// The video is preloaded. We resolve the deferred object so that the registered callbacks are called (the callbacks registered with .done() .succeed() etc)
		deferred.resolve();
	}.bind(this) );


	videoElement.load();
    return deferred.promise();
}

// Multiple sources can be specified between the <video></video> tags. In the playlist the video definition 
// would look like: <video><source src="file.mp4" type="video/mp4" /><source src="file.webm" type="video/webm" /></video>
// The determineBestSource() method will decide which of the specified sources can and will be used (if any).
// The source for which the browser estimates that it has the best support will be used, for equal support estimations
// the first mentioned source is chosen.
// 		@pre: each <source> element had a src attribute and the value of that attribute is available through the sources array.
ximpel.mediaTypeDefinitions.Video.prototype.determineBestSource = function( sources ){
	var videoElement = this.$video[0];

	// Will have value "maybe", "probably", "unknown" or "" (no support) for each of the sources. Indicating the likelihood for support.
	var sourceSupport = [];

	// For each of the sources determine likelihood for support.
	for( var i=0; i<sources.length; i++ ){
		// For the current <source>, get the "type" attribute that was specified on the <source> element if there was no type attribute then set it to null.
		var typeAttributeValue = sources[i].elementAttributes.type || null;
		
		// if no type attribute on <source> was specified then we cannot determine the likelihood for support so we set it to unknown.
		if( !typeAttributeValue ){
			sourceSupport[i] = 'unknown'; 
		} else{
			sourceSupport[i] = videoElement.canPlayType( typeAttributeValue );
		}
	}

	// This steps through all sources and checks if there is a source with support level "probably", which is the highest. If no source has that
	// support-level then we try all sources for support level "maybe" (which is the second highest). When we find a source that matches
	// the current support level, we know it must be the source with the highest support because we step through the support levels from high to low. 
	// Note that this is only an estimation by the browser. So It may be the case that the chosen source turns out to not be supported anyway.
	var supportLevels = ['probably', 'maybe', 'unknown', ''];
	for( var i=0; i<supportLevels.length; i++ ){
		for( var j=0; j<sourceSupport.length; j++ ){
			if( supportLevels[i] === sourceSupport[j] ){
				if( supportLevels[i] === '' ){
					// If we get here it means that the browser probably supports none of the sources.
					ximpel.warn("None of the specified sources seem to be supported!");
				}
				// get only the src attribute from the <source> element
				var srcValue = sources[j].elementAttributes.src; 
				//console.log("sourceSupport=" + sourceSupport[j] + ", " + srcValue );
				return srcValue || false;
			}
		}		
	}

	return false;
}

ximpel.registerMediaType(
	new ximpel.MediaTypeRegistration( 'video', ximpel.mediaTypeDefinitions.Video, {
		'allowedAttributes': ['width','height','x','y'],
		'requiredAttributes': [],
		'allowedChildren': ['source'],
		'requiredChildren': ['source'],
	})
);

/* ################################################################################################
OLD THIS WAS USED WHEN DRAWING VIDEO FRAMES ONTO A CANVAS... MAY BE USED AT SOME POINT AGAIN 
   ################################################################################################ */
ximpel.mediaTypeDefinitions.Video.prototype.drawVideoFramesToCanvas = function( videoElement, canvasContext ){
	// If the video is not playing anymore then we dont draw another frame on the canvas and we do not set a timeout for drawing the next frame.
	if( this.state === this.STATE_PLAYING ){
		return;
	}

	// We have set the size of the video element, but this is not necessarily the size of the frames that are played within
	// the video element, because the video element maintains the aspect ratio of the video. Either the width or the height of the 
	// video frame takes up the full dimension of the video element. For the other dimension (width or height) the frame is centered 
	// within the video element as it does not take up the full space. We need to do two things:
	// 1. determine the width and height for the frame such that it fills up the canvas in at least one dimension entirely.
	// 2. Center the frame on the canvas in the other dimension where space is left over (if any)
	var intrinsicVideoWidth = videoElement.videoWidth;
	var intrinsicVideoHeight = videoElement.videoHeight;
	var videoElementWidth = videoElement.width;
	var videoElementHeight = videoElement.height;
	
	// 1. Determine the frame width and height
	var frameDimensions = this.getFittingRectangle( videoElementWidth, videoElementHeight, intrinsicVideoWidth, intrinsicVideoHeight );
	
	// 2. Determine the frame x and y coordinates.
	var frameCoordinates = this.getCenteredRectangleCoordinates( videoElementWidth, videoElementHeight, intrinsicVideoWidth, intrinsicVideoHeight );
	
	// Draw the frame on the canvas with the calculated width and height and the centered x and y position.
	canvasContext.drawImage( videoElement, frameCoordinates.x, frameCoordinates.y, frameDimensions.width, frameDimensions.height );


	setTimeout( function(){
		this.drawVideoFramesToCanvas( videoElement, canvasContext );
	}.bind(this), this.drawDelay );
}


ximpel.mediaTypeDefinitions.Video.prototype.createCanvasElement = function( width, height ){
	this.$canvas = $('<canvas />').css({
		'background-color': 'red'
	}).attr({
		'width': width,
		'height': height,
	});
	//console.log( "video.width="+ this.$video.attr("width") + ", video.videoWidth=" + this.$video[0].videoWidth );
	return this.$canvas;
}

// Return the maximum dimensions of a rectangle that still fits in some available space (another rectangle) while maintaining aspect ratio.
ximpel.mediaTypeDefinitions.Video.prototype.getFittingRectangle = function( availableWidth, availableHeight, actualWidth, actualHeight ){
	var scale = Math.min( availableWidth / actualWidth, availableHeight / actualHeight );
	return {'width': actualWidth*scale, 'height': actualHeight*scale };
}

// Return the x and y coordinates for a rectangle centered within some available space (another rectangle).
ximpel.mediaTypeDefinitions.Video.prototype.getCenteredRectangleCoordinates = function( availableWidth, availableHeight, actualWidth, actualHeight ){
	var x = ( actualWidth < availableWidth ) 	? Math.round( ( availableWidth-actualWidth ) / 2 ) : 0;
	var y = ( actualHeight < availableHeight ) 	? Math.round( ( availableHeight-actualHeight ) / 2 ) : 0;
	return { 'x': x, 'y': y };
}


/*ximpel.mediaTypeDefinitions.Video.prototype.getFileExtension = function( fileName ){
	var parts = fileName.split(".");
	if( parts.length === 1 || ( parts[0] === "" && parts.length === 2 ) ) {
	    return ""; // the file doesn't have an extension or the filename starts with a dot (like .htaccess)
	}
	return parts.pop().toLowerCase();
}*/