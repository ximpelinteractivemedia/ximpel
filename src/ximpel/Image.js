// TODO:
// - If no width or height is specified, then make it so that the max width/height of the ximpel player element is used whiline maintaining aspect ratio
// - Make the parser check if a source has been given.
// - Make the preload resolve its deferred only when the image has really been loaded. Right now it resolves it immediately and we just hope that the image has been
//   been loaded by the time it is being played. See: http://stackoverflow.com/questions/1977871/check-if-an-image-is-loaded-no-errors-in-javascript
// - Let width height x and y be specified in other units than pixels.
// ##################################################################################################
// ##################################################################################################
// ##################################################################################################
ximpel.mediaTypeDefinitions.Image = function( customElements, customAttributes, $parentElement, player ){
	// The custom elements that were added inside the <image> tag in the playlist (if any).
	this.customElements = customElements;

	// The custom attributes that were added to the <image> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this image can attach itself (this is the element to which all media DOM nodes will be attached).
	this.$attachTo = $parentElement;

	// A reference to the XIMPEL player object. The media type can make use of functions on the player object.
	this.player = player;

	// Set the x coordinate of the image relative to the  the main ximpel element.
	this.x = this.customAttributes.x || 'center';

	// Set the y coordinate of the image relative to the the main ximpel element.
	this.y = this.customAttributes.y || 'center';

	// The width of the image element. A default is used when not specified.
	this.width = this.customAttributes.width;

	// The height of the image element. A default is used when not specified.
	this.height = this.customAttributes.height;

	// Check if a media directory was specified, if so the src of the image is made to be relative to this mediaDirectory
	var mediaDirectory = player.getConfigProperty("mediaDirectory") || "";
	this.imageSource = customAttributes['src'] || '';
	if( mediaDirectory != "" ){
		this.imageSource = mediaDirectory + "/" + this.imageSource;
	}

	this.$image = $('<img />');
	// This is the jquery wrapper for the <img> element. 
	// (note that we don't set the source yet, because that will start loading the image. We will set the source in the preload() method).
/*	this.$image = $('<img />').attr({
		'width': 'auto',
		'height': 'auto',
	}).css({
		'position': 'absolute',
		'top': customAttributes.y+'px',
		'left': customAttributes.x+'px'
	});

	if( this.customAttributes.width ){
		this.$image.attr('width', this.customAttributes.width );
	}

	if( this.customAttributes.height ){
		this.$image.attr('height', this.customAttributes.height );
	}*/

	//this.initImageElement();

	// This will hold a jquery promise object when the media item is preloading or has been preloaded already. 
	// This is used to check if the item has been preloaded or is preloading.
	this.preloadPromise = null;

	// Specify in what state this media item is. (ie. playing, paused, stopped)
	this.state = this.STATE_STOPPED;
}
ximpel.mediaTypeDefinitions.Image.prototype = new ximpel.MediaType();
ximpel.mediaTypeDefinitions.Image.prototype.STATE_PLAYING = 'state_image_playing';
ximpel.mediaTypeDefinitions.Image.prototype.STATE_PAUSED = 'state_image_paused';
ximpel.mediaTypeDefinitions.Image.prototype.STATE_STOPPED = 'state_image_stopped';


ximpel.mediaTypeDefinitions.Image.prototype.calculateImageDetails = function(){
	var playerElementWidth = this.$attachTo.width();
	var playerElementHeight = this.$attachTo.height();

	// if x and or y is "center" then we will determine the x and y coordinates when we append the image element to the DOM.
	// We do it later because we can only reliably determine the x/y coordinate when the image element is loaded and appended to the DOM.
	var x = this.x === 'center' ? '0px' : this.x; 
	var y = this.y === 'center' ? '0px' : this.y;
	
	// The image has been appened to the DOM, so we can retrieve the width and height of the image element.
	// Determine values for width and height based on whether a value has been given for either of them.
	if( !this.width && !this.height ){
		// Both width and height have not been specified. In that case we want the image
		// to be displayed as large as possible while maintaining aspect ratio of the image.
		var intrinsicWidth = this.$image[0].width;
		var intrinsicHeight = this.$image[0].height;
		var imageAspectRatio = intrinsicWidth / intrinsicHeight;
		var playerElementAspectRatio = playerElementWidth / playerElementHeight;

		if( imageAspectRatio >= playerElementAspectRatio ){
			var width = '100%';
			var height = 'auto';
		} else{
			var width = 'auto';
			var height = '100%';
		}
	} else if( !this.width ){
		var width = 'auto';
		var height = this.height;
	} else if( !this.height ){
		var width = this.width;
		var height = 'auto'
	} else{
		var width = this.width;
		var height = this.height;
	}

	this.$image.attr({
		'width': width,
		'height': height,
	}).css({
		'position': 'absolute',
		'left': x,
		'top': y
	});

	// If x or y are set to 'center' then we use the width and height to determine the x and y coordinates such
	// that the image element is centered within the player element.
	if( this.x === 'center' ){
		var x = Math.round( Math.abs( this.$attachTo.width() - this.$image.width() ) / 2 );
		this.$image.css('left', x+'px' );
	}
	if( this.y === 'center' ){
		var y = Math.round( Math.abs( this.$attachTo.height() - this.$image.height() ) / 2 );
		this.$image.css('top', y+'px' );	
	}
}

ximpel.mediaTypeDefinitions.Image.prototype.mediaPlay = function(){
	// Ignore this call if this media item is already playing.
	if( this.state === this.STATE_PLAYING ){
		return;
	}

	this.state = this.STATE_PLAYING;

	// Check whether the image has been preloaded or is in the process of preloading it.
	if( this.isPreloaded() ){
		// The image was already preloaded, so just start/resume playing.
		this.playImage();
	} else if( ! this.isPreloading() ){
		// The image was not preloaded and its also no in the process of preloading so we start preloading now.
		this.preload().done( function(){
			// When the preloading is done and the media item is still in a playing state then append the image.
			// It may be the case that the media item is in a non-playing state when the pause() method has been called during the preloading for example.
			if( this.state === this.STATE_PLAYING ){
				this.playImage();
			}
		}.bind(this) );
	}

	return this;
}


ximpel.mediaTypeDefinitions.Image.prototype.playImage = function(){
	this.$image.appendTo( this.$attachTo );
	
	this. calculateImageDetails();
}


ximpel.mediaTypeDefinitions.Image.prototype.mediaPause = function(){
	// Ignore this pause request if the image is not in a playing state.
	if( this.state !== this.STATE_PLAYING ){
		return;
	}
	// To pause a image we do nothing.
	this.state = this.STATE_PAUSED;
	return this;
}


ximpel.mediaTypeDefinitions.Image.prototype.mediaStop = function(){
	// Ignore this stop request if the image is already in a stopped state.
	if( this.state === this.STATE_STOPPED ){
		return;
	}
	this.$image.detach();
	
	this.state = this.STATE_STOPPED;
	return this;
}

// Returns whether the image is playing.
ximpel.mediaTypeDefinitions.Image.prototype.mediaIsPlaying = function(){
	return this.state === this.STATE_PLAYING;
}

// Returns whether the image is paused.
ximpel.mediaTypeDefinitions.Image.prototype.mediaIsPaused = function(){
	return this.state === this.STATE_PAUSED;
}

// Returns whether the image is stopped.
ximpel.mediaTypeDefinitions.Image.prototype.mediaIsStopped = function(){
	return this.state === this.STATE_STOPPED;
}


ximpel.mediaTypeDefinitions.Image.prototype.mediaPreload = function(){
	// If the media is already preloaded then we need to do nothing, so we just return the already existing resolved promise.
	if( this.isPreloaded() ){
		return this.preloadPromise;
	}
	var deferred = new $.Deferred();

	this.$image.on('load', function(){
		deferred.resolve();
	}.bind(this) );


	this.$image.on('error', function(){
		ximpel.warn("Image.mediaPreload(): failed to preload image '" + $image[0].src + "'.");
		deferred.reject();
	});

	this.$image.attr('src', this.imageSource );
	// We return a jquery promise which is resolved when the browsers triggers a canplaythrough event or rejected if the video fails to load.
	// Note that at the time of writing some browsers throw this event multiple times while others throw it only once.
	this.preloadPromise = deferred.promise();
	return this.preloadPromise;
}


ximpel.mediaTypeDefinitions.Image.prototype.isPreloaded = function(){
	return this.preloadPromise && this.preloadPromise.state() === "resolved" && this.$image[0].readyState >= 4;
}
ximpel.mediaTypeDefinitions.Image.prototype.isPreloading = function(){
	return this.preloadPromise && this.preloadPromise.state() === "pending";
}




// Return the maximum dimensions of a rectangle that still fits in some available space (another rectangle) while maintaining aspect ratio.
ximpel.mediaTypeDefinitions.Image.prototype.getFittingRectangle = function( availableWidth, availableHeight, actualWidth, actualHeight ){
	var scale = Math.min( availableWidth / actualWidth, availableHeight / actualHeight );
	return {'width': actualWidth*scale, 'height': actualHeight*scale };
}
// Return the x and y coordinates for a rectangle centered within some available space (another rectangle).
ximpel.mediaTypeDefinitions.Image.prototype.getCenteredRectangleCoordinates = function( availableWidth, availableHeight, actualWidth, actualHeight ){
	var x = ( actualWidth < availableWidth ) 	? Math.round( ( availableWidth-actualWidth ) / 2 ) : 0;
	var y = ( actualHeight < availableHeight ) 	? Math.round( ( availableHeight-actualHeight ) / 2 ) : 0;
	return { 'x': x, 'y': y };
}






ximpel.registerMediaType(
	new ximpel.MediaTypeRegistration( 'image', ximpel.mediaTypeDefinitions.Image, {
		'allowedAttributes': ['src', 'width','height','x','y'],
		'requiredAttributes': ['src'],
		'allowedChildren': [],
		'requiredChildren': [],
	})
);










