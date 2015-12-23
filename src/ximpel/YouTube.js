// ##################################################################################################
// ##################################################################################################
// ##################################################################################################

// TODO: 
// - Youtube API: As an extra security measure, you should also include the origin parameter to the URL, specifying the URL scheme (http:// or https://) and full domain of your host page as the parameter value
ximpel.mediaTypeDefinitions.YouTube = function( customElements, customAttributes, $parentElement ){
	// The custom elements that were added inside the <youtube> tag in the playlist 
	this.customElements = customElements; // not used right now.

	// The custom attributes that were added to the <youtube> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this youtube element can attach itself.
	this.$attachTo = $parentElement;

	// The youtube video id.
	this.videoId = customAttributes.id;

	// The x coordinate of the youtube element relative to the ximpel parent element or 'center' to align center horizontally.
	// The value is including the units (for instance: 100px or 10%)
	this.x = customAttributes.x || 'center';

	// The y coordinate of the youtube element relative to the main ximpel element or 'center' to align center vertically.
	// The value is including the units (for instance: 100px or 10%)
	this.y = customAttributes.y || 'center';

	// The width of the youtube element. The value includes units (ie. 600px or 50%).
	this.width = customAttributes.width || this.$attachTo.width() +'px';

	// The height of the youtube element. The value includes units (ie. 600px or 50%)
	this.height = customAttributes.height || this.$attachTo.height() + 'px';

	// The point in the youtube video from which the video should start playing (if not specified in the playlist then it is set to 0.)
	this.startTime = customAttributes.startTime || 0;

	// This is the jquery wrapper for the youtube's iframe element which is to be played. 
	this.$youtubeContainer = $('<div></div>');

	// The youtube player requires an element which will be replaced by youtube's iframe, ie. the a placeholder:
	this.$youtubePlaceholder = $('<div></div>');

	// Youtube has assigned click handlers to its iframe which cause the video to pause. This is not what
	// we want in ximpel because we want a clear and consistent user interaction for all media types. So we
	// use a "click catcher" element that will be placed over the youtube's iframe which ignores all click handlers.
	this.$youtubeClickCatcher = $('<div></div>');

	// This will contain the youtube player object (ie. youtube's player api)
	this.youtubePlayer = null;

	// This will hold a jquery promise object when the media item is preloading or has been preloaded already. 
	// It is used to check if the item has been preloaded or is preloading.
	this.preloadPromise = null;

	// The state indicates the state of the youtube media item (playing, paused, stopped)
	this.state = this.STATE_STOPPED;

	// Initialize the youtube elements that are used in this YouTube implementation.
	this.initYoutubeElements();
}
ximpel.mediaTypeDefinitions.YouTube.prototype = new ximpel.MediaType();
// this is the ID of the media type as well as the name of the element in the playlist (<youtube>).
ximpel.mediaTypeDefinitions.YouTube.prototype.MEDIA_TYPE_ID = 'youtube';
ximpel.mediaTypeDefinitions.YouTube.prototype.CLASS_YOUTUBE_CONTAINER = 'youtubeContainer';
ximpel.mediaTypeDefinitions.YouTube.prototype.CLASS_YOUTUBE_CLICK_CATCHER = 'youtubeClickCatcher';
ximpel.mediaTypeDefinitions.YouTube.prototype.STATE_PLAYING = 'state_youtube_playing';
ximpel.mediaTypeDefinitions.YouTube.prototype.STATE_PAUSED = 'state_youtube_paused';
ximpel.mediaTypeDefinitions.YouTube.prototype.STATE_STOPPED = 'state_youtube_stopped';

ximpel.mediaTypeDefinitions.YouTube.prototype.initYoutubeElements = function(){
	this.$youtubeContainer.addClass( this.CLASS_YOUTUBE_CONTAINER );
	this.$youtubeClickCatcher.addClass( this.CLASS_YOUTUBE_CLICK_CATCHER );

	// Combine the youtube container and youtube click catcher elements in one jquery object.
	var $containerAndClickCatcher = this.$youtubeContainer.add( this.$youtubeClickCatcher );

	// Then style both of them, append them to the DOM and hide them.
	$containerAndClickCatcher.css({
		'position': 'absolute',
		'width': '100%',
		'height': '100%',
		'top': '0px',
		'left': '0px',
		'z-index': 1,
	});
	this.$youtubeContainer.hide();
	this.$youtubeClickCatcher.appendTo( this.$youtubeContainer );
	this.$youtubeContainer.appendTo( this.$attachTo );

	// Append the youtube place holder element to the youtube container. 
	// (the placeholder will be replaced with youtube's iframe).
	this.$youtubePlaceholder.appendTo( this.$youtubeContainer );
}



ximpel.mediaTypeDefinitions.YouTube.prototype.mediaPlay = function(){
	// Ignore this call if this media item is already playing.
	if( this.state === this.STATE_PLAYING ){
		return;
	}

	// Indicate that the media item is in a playing state now. This should be done now before starting preloading.
	this.state = this.STATE_PLAYING;

	if( this.isPreloaded() ){
		// Start playing if the video is already preloaded.
		this.playYoutube();
	} else if( ! this.isPreloading() ){
		// If the media item is not yet preloaded. then start playing as soon as it is preloaded 
		// Unless it was paused/stopped while it was being loaded.
		this.preload().done( function(){
			if( this.state === this.STATE_PLAYING ){
				this.playYoutube();
			}
		}.bind(this) );
	} else if( this.preloadingFailed() ){
		// do something if preloading failed? attempt again? hide the youtube container? do nothing?
	}
}
ximpel.mediaTypeDefinitions.YouTube.prototype.playYoutube = function(){
	this.repositionYoutubeIframe();
	this.youtubePlayer.playVideo();
	this.$youtubeContainer.show();
}
ximpel.mediaTypeDefinitions.YouTube.prototype.repositionYoutubeIframe = function(){
	var $youtubeIframe = this.$youtubeContainer.find("iframe");
	$youtubeIframe.css({
		'position': 'absolute'
	});

	if( this.x === 'center' ){
		var x = Math.round( Math.abs( this.$attachTo.width() - $youtubeIframe.width() ) / 2 ) + 'px';
	} else{
		var x = this.x;
	}
	if( this.y === 'center' ){
		var y = Math.round( Math.abs( this.$attachTo.height() - $youtubeIframe.height() ) / 2 )  + 'px';
	} else{
		var y = this.y;
	}
	$youtubeIframe.css({
		'left': x,
		'top': y 
	});
}



ximpel.mediaTypeDefinitions.YouTube.prototype.mediaPreload = function(){
	// If the media is already preloaded then we need to do nothing, so we just return the already existing resolved promise.
	if( this.isPreloaded() ){
		return this.preloadPromise;
	}

	// Start loading the youtube api (this will only be done if its not already being loaded by another 
	// YouTube instance). This registers window.ximpelYoutubeApiReadyPromise which is a jquery promise object
	// that is resolved when the script has been loaded or is rejected when failing to load.
	this.loadYoutubeApi();

	// Two things need to be loaded in order to start playing a youtube video:
	// - The youtube API script
	// - The youtube player.
	// We get a combined jquery deferred which resolves if both of these items are loaded or fails if any of them fail.
	var loadingYoutubePlayerDeferred = new $.Deferred();
	var preloadDeferred = $.when( window.ximpelYoutubeApiReadyPromise, loadingYoutubePlayerDeferred );

	// When either of the youtube api or the youtube player fails to load, the preloading fails in its entirety
	preloadDeferred.fail( function(){
		ximpel.warn("YouTube.preload(): failed to preload the youtube video.");
	}.bind(this) );

	// If the youtube api script is already load we start loading the player. If it is
	// in the process of being loaded, then we tell it to start loading the player when finished.
	if( window.ximpelYoutubeApiReadyPromise.state() === "resolved" ){
		this.loadYoutubePlayer( loadingYoutubePlayerDeferred ); 
	} else if( window.ximpelYoutubeApiReadyPromise.state() === "pending" ){
		window.ximpelYoutubeApiReadyPromise.done( function(){
			this.loadYoutubePlayer( loadingYoutubePlayerDeferred ); 
		}.bind(this) );
	}

	// Store the preload promise. Which indicates whether preloading succeeded or failed.
	this.preloadPromise = preloadDeferred.promise();
    return this.preloadPromise;
}
ximpel.mediaTypeDefinitions.YouTube.prototype.loadYoutubeApi = function(){
	// the following if statement checks if this instance of YouTube is the first to run.
	// If so, this instance will register a global jquery deferred object which all instances can you use
	// to check whether the youtube api has been loaded. It then also starts loading the script and
	// resolve the global deferred when it has been loaded.
	if( !window.ximpelYoutubeApiReadyPromise ){
		// Store a jquery promise in the global window object to track if the youtube api script is loaded or not.
		// We store it globally, because all instances of Youtube media type should be able to see this.
		var globalDeferred = new $.Deferred();
		window.ximpelYoutubeApiReadyPromise = globalDeferred.promise();

		// If there was any third party code that uses the youtube api then it may have 
		// registered the window.onYouTubeIframeAPIReady() function already. In that case we 
		// overwrite that function with our own, but we call the old function from our own function.
		var thirdPartyOnYouTubeIframeAPIReadyHandler = window.onYouTubeIframeAPIReady;
		
		// Define the event handling function that is called by youtube's script when it is fully loaded.
		window.onYouTubeIframeAPIReady = function(){
			// When the script is fully loaded, then the global deferred is resolved. Which notifies
			// all instances that were waiting for the script to be loaded that it can now use the 
			// youtube player api.
			globalDeferred.resolve();

			// And if there was an onYouTubeIframeAPIReady() function registered by any third party code, 
			// then we will call that function just to not break webpages that use it.
			if( thirdPartyOnYouTubeIframeAPIReadyHandler ){
				thirdPartyOnYouTubeIframeAPIReadyHandler();
			}
		}.bind(this);

		// Start loading the youtube API
		this.requestYoutubeApiScript( globalDeferred );
	} 
}
ximpel.mediaTypeDefinitions.YouTube.prototype.requestYoutubeApiScript = function( deferred ){
	// We do the actual ajax request for the youtube api script.
	var ajaxRequest = $.ajax({
	    type: "GET",
	    url: "https://www.youtube.com/iframe_api",
	    dataType: "script",
	    cache: true
	});

	// When the script has failed to load, then we reject the deferred that was passed to this function.
	ajaxRequest.fail( function( jqXHR, textStatus, errorThrown ){
		ximpel.warn("YouTube.loadYoutubeApi(): failed to load the youtube api script (" + textStatus + ", " + errorThrown + ")");
		deferred.reject();
	}.bind(this) );

	// Note: we do NOT resolve the deferred here because the loaded script first needs to run and initialize
	// the youtube player api. We will know when this is ready because the script will call the function
	// window.onYouTubeIframeAPIReady which we registered earlier in Youtube.loadYoutubeApi().

    return deferred.promise();
}
ximpel.mediaTypeDefinitions.YouTube.prototype.loadYoutubePlayer = function( deferred ){
	// The function to be called when the youtube player is ready to be used.
	var youtubePlayerReadyHandler = function(){
		// If the startTime is zero then we use 0.01 instead because youtube doesn't 
		// allow seeking to time "0".
		var startTime = this.startTime === 0 ? 0.01 : this.startTime;

		this.youtubePlayer.seekTo( startTime, true );
		deferred.resolve();
	}

	this.youtubePlayer = new YT.Player( this.$youtubePlaceholder[0], {
		videoId: this.videoId,
		height: this.height,
  		width: this.width,
	    events: {
	        'onError': this.youtubePlayerErrorHandler.bind(this, deferred ),
	        'onReady': youtubePlayerReadyHandler.bind(this),
	        'onStateChange': this.youtubePlayerStateChangeHandler.bind(this)
	    },
	    playerVars: {
	    	'html5': 1, 		// use the html5 player?
			'autoplay': 0,		// auto play video on load?
     		'controls': 0, 		// show controls?
     		'rel' : 0, 			// show related videos at the end?
     		'showinfo': 0,		// show video information?
     		'disablekb': 1,		// disable keyboard shortcuts?
     		'wmode': 'opaque',
     		'modestbranding': 0,
     		'iv_load_policy': 3 // show annotations? (3=no, 1 =yes)
			}
	});

	return deferred;
}
ximpel.mediaTypeDefinitions.YouTube.prototype.youtubePlayerErrorHandler = function( deferred, error ){
	if( error.data == 2 ){
       ximpel.warn("YouTube.onLoadingYoutubeVideoError(): invalid parameters received. Possibly the video id is invalid.");
    } else if( error.data == 5 ){
    	ximpel.warn("YouTube.onLoadingYoutubeVideoError(): The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.");
    } else if( error.data == 100 ){
    	ximpel.warn("YouTube.onLoadingYoutubeVideoError(): The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.");
	} else if( error.data == 101 || error.data == 150 ){
		ximpel.warn("YouTube.onLoadingYoutubeVideoError(): The owner of the requested video does not allow it to be played in embedded players.");
	} else{
		ximpel.warn("YouTube.onLoadingYoutubeVideoError(): An unknown error has occured while starting the youtube player.");
	}
	deferred.reject();
}
ximpel.mediaTypeDefinitions.YouTube.prototype.youtubePlayerStateChangeHandler = function( event ){
	var state = event.data;

	switch( state ){
		case YT.PlayerState.ENDED: 
			// The youtube video has ended. By calling ended() all callback functions registered with 
			// .onEnd() will be called. These are both functions on the prototype.
			this.ended(); 
			break;
	}
}



// The pause method pauses the youtube video if the video is in a playing state, otherwise it does nothing.
ximpel.mediaTypeDefinitions.YouTube.prototype.mediaPause = function(){
	// Ignore this pause request if the video is not in a playing state.
	if( this.state !== this.STATE_PLAYING ){
		return;
	}
	this.state = this.STATE_PAUSED;

	if( this.youtubePlayer && this.youtubePlayer.pauseVideo ){
		this.youtubePlayer.pauseVideo();
	}
}



// The stop method stops the video entirely without being able to resume later on. After this method the video playback pointer
// has been reset to its start position and the youtube i frame element is detached from the DOM, so nothing is visible anymore.
ximpel.mediaTypeDefinitions.YouTube.prototype.mediaStop = function(){
	if( this.state === this.STATE_STOPPED ){
		return;
	}
	this.youtubePlayer.pauseVideo();
	this.$youtubeContainer.hide();
	this.youtubePlayer.seekTo( this.startTime ); 
	this.state = this.STATE_STOPPED;
}

// Every media item can implement a getPlayTime() method. If this method is implemented by the media item then ximpel will use this method to determine
// how long the media item has been playing. If this method is not implemented then ximpel itself will calculate how long a media item has been playing. Note that
// the media item can sometimes better determine the play time. For instance, if the network has problems causing the video to stop loading, then ximpel
// would not be able to detect this and use an incorrect play time. A video media item could still determine the correct play time by looking at the current playback
// time of its element. This is exactly what the getPlayTime method of this YouTube media item does. It returns the play time in miliseconds.
ximpel.mediaTypeDefinitions.YouTube.prototype.getPlayTime = function(){
	if( ! this.youtubePlayer || !this.youtubePlayer.getCurrentTime ){
		return 0;
	}
	var currentPlaybackTimeInMs = this.youtubePlayer.getCurrentTime()*1000;
	var startTimeInMs = this.startTime * 1000;
	var playTimeInMs = currentPlaybackTimeInMs - startTimeInMs;
	return playTimeInMs;
}
ximpel.mediaTypeDefinitions.YouTube.prototype.isPreloaded = function(){
	return this.preloadPromise && this.preloadPromise.state() === "resolved";
}
ximpel.mediaTypeDefinitions.YouTube.prototype.isPreloading = function(){
	return this.preloadPromise && this.preloadPromise.state() === "pending";
}
ximpel.mediaTypeDefinitions.YouTube.prototype.preloadingFailed = function(){
	return this.preloadPromise && this.preloadPromise.state() === "rejected";
}
// Returns whether the video is playing.
ximpel.mediaTypeDefinitions.YouTube.prototype.mediaIsPlaying = function(){
	return this.state === this.STATE_PLAYING;
}
// Returns whether the video is paused.
ximpel.mediaTypeDefinitions.YouTube.prototype.mediaIsPaused = function(){
	return this.state === this.STATE_PAUSED;
}
// Returns whether the video is stopped.
ximpel.mediaTypeDefinitions.YouTube.prototype.mediaIsStopped = function(){
	return this.state === this.STATE_STOPPED;
}
ximpel.registerMediaType(
	new ximpel.MediaTypeRegistration( 'youtube', ximpel.mediaTypeDefinitions.YouTube, {
		'allowedAttributes': ['videoId', 'width', 'height', 'x', 'y', 'startTime'],
		'requiredAttributes': ['videoId'],
		'allowedChildren': [],
		'requiredChildren': [],
	})
);