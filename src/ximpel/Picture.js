// TODO:
// - If no width or height is specified, then make it so that the max width/height of the ximpel player element is used whiline maintaining aspect ratio
// - Make the parser check if a source has been given.
// - Make the preload resolve its deferred only when the image has really been loaded. Right now it resolves it immediately and we just hope that the image has been
//   been loaded by the time it is being played. See: http://stackoverflow.com/questions/1977871/check-if-an-image-is-loaded-no-errors-in-javascript
// - Let width height x and y be specified in other units than pixels.
// ##################################################################################################
// ##################################################################################################
// ##################################################################################################
ximpel.mediaTypeDefinitions.Picture = function( customElements, customAttributes, $parentElement, player ){
	// The custom elements that were added inside the <picture> tag in the playlist (if any).
	this.customElements = customElements;

	// The custom attributes that were added to the <picture> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this picture can attach itself (this is the element to which all media DOM nodes will be attached).
	this.$attachTo = $parentElement;

	// A reference to the XIMPEL player object. The media type can make use of functions on the player object.
	this.player = player;

	// Set the x coordinate of the picture relative to the  the main ximpel element.
	this.x = this.customAttributes.x || 'center';

	// Set the y coordinate of the picture relative to the the main ximpel element.
	this.y = this.customAttributes.y || 'center';

	// The width of the picture element. A default is used when not specified.
	this.width = this.customAttributes.width;

	// The height of the picture element. A default is used when not specified.
	this.height = this.customAttributes.height;

	// Check if a media directory was specified, if so the src of the picture is made to be relative to this mediaDirectory
	var mediaDirectory = player.getConfigProperty("mediaDirectory") || "";
	this.pictureSource = customAttributes['src'] || '';
	if( mediaDirectory != "" ){
		this.pictureSource = mediaDirectory + "/" + this.pictureSource;
	}

	this.$picture = $('<img />');
	// This is the jquery wrapper for the <img> element. 
	// (note that we don't set the source yet, because that will start loading the picture. We will set the source in the preload() method).
/*	this.$picture = $('<img />').attr({
		'width': 'auto',
		'height': 'auto',
	}).css({
		'position': 'absolute',
		'top': customAttributes.y+'px',
		'left': customAttributes.x+'px'
	});

	if( this.customAttributes.width ){
		this.$picture.attr('width', this.customAttributes.width );
	}

	if( this.customAttributes.height ){
		this.$picture.attr('height', this.customAttributes.height );
	}*/

	//this.initPictureElement();

	// This will hold a jquery promise object when the media item is preloading or has been preloaded already. 
	// This is used to check if the item has been preloaded or is preloading.
	this.preloadPromise = null;

	// Specify in what state this media item is. (ie. playing, paused, stopped)
	this.state = this.STATE_STOPPED;
}
ximpel.mediaTypeDefinitions.Picture.prototype = new ximpel.MediaType();
// this is the ID of the media type as well as the name of the element in the playlist (<picture>).
ximpel.mediaTypeDefinitions.Picture.prototype.mediaTypeId = 'picture'; 

ximpel.mediaTypeDefinitions.Picture.prototype.STATE_PLAYING = 'state_picture_playing';
ximpel.mediaTypeDefinitions.Picture.prototype.STATE_PAUSED = 'state_picture_paused';
ximpel.mediaTypeDefinitions.Picture.prototype.STATE_STOPPED = 'state_picture_stopped';


ximpel.mediaTypeDefinitions.Picture.prototype.calculatePictureDetails = function(){
	var playerElementWidth = this.$attachTo.width();
	var playerElementHeight = this.$attachTo.height();

	// if x and or y is "center" then we will determine the x and y coordinates when we append the picture element to the DOM.
	// We do it later because we can only reliably determine the x/y coordinate when the picture element is loaded and appended to the DOM.
	var x = this.x === 'center' ? '0px' : this.x; 
	var y = this.y === 'center' ? '0px' : this.y;
	
	// The picture has been appened to the DOM, so we can retrieve the width and height of the picture element.
	// Determine values for width and height based on whether a value has been given for either of them.
	if( !this.width && !this.height ){
		// Both width and height have not been specified. In that case we want the picture
		// to be displayed as large as possible while maintaining aspect ratio of the picture.
		var intrinsicWidth = this.$picture[0].width;
		var intrinsicHeight = this.$picture[0].height;
		var pictureAspectRatio = intrinsicWidth / intrinsicHeight;
		var playerElementAspectRatio = playerElementWidth / playerElementHeight;

		if( pictureAspectRatio >= playerElementAspectRatio ){
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

	this.$picture.attr({
		'width': width,
		'height': height,
	}).css({
		'position': 'absolute',
		'left': x,
		'top': y
	});

	// If x or y are set to 'center' then we use the width and height to determine the x and y coordinates such
	// that the picture element is centered within the player element.
	if( this.x === 'center' ){
		var x = Math.round( Math.abs( this.$attachTo.width() - this.$picture.width() ) / 2 );
		this.$picture.css('left', x+'px' );
	}
	if( this.y === 'center' ){
		var y = Math.round( Math.abs( this.$attachTo.height() - this.$picture.height() ) / 2 );
		this.$picture.css('top', y+'px' );	
	}
}

ximpel.mediaTypeDefinitions.Picture.prototype.mediaPlay = function(){
	// Ignore this call if this media item is already playing.
	if( this.state === this.STATE_PLAYING ){
		return;
	}

	this.state = this.STATE_PLAYING;

	// Check whether the picture has been preloaded or is in the process of preloading it.
	if( this.isPreloaded() ){
		// The picture was already preloaded, so just start/resume playing.
		this.playPicture();
	} else if( ! this.isPreloading() ){
		// The picture was not preloaded and its also no in the process of preloading so we start preloading now.
		this.preload().done( function(){
			// When the preloading is done and the media item is still in a playing state then append the picture.
			// It may be the case that the media item is in a non-playing state when the pause() method has been called during the preloading for example.
			if( this.state === this.STATE_PLAYING ){
				this.playPicture();
			}
		}.bind(this) );
	}

	return this;
}


ximpel.mediaTypeDefinitions.Picture.prototype.playPicture = function(){
	this.$picture.appendTo( this.$attachTo );
	
	this. calculatePictureDetails();
}


ximpel.mediaTypeDefinitions.Picture.prototype.mediaPause = function(){
	// Ignore this pause request if the picture is not in a playing state.
	if( this.state !== this.STATE_PLAYING ){
		return;
	}
	// To pause a picture we do nothing.
	this.state = this.STATE_PAUSED;
	return this;
}


ximpel.mediaTypeDefinitions.Picture.prototype.mediaStop = function(){
	// Ignore this stop request if the picture is already in a stopped state.
	if( this.state === this.STATE_STOPPED ){
		return;
	}
	this.$picture.detach();
	
	this.state = this.STATE_STOPPED;
	return this;
}

// Returns whether the picture is playing.
ximpel.mediaTypeDefinitions.Picture.prototype.mediaIsPlaying = function(){
	return this.state === this.STATE_PLAYING;
}

// Returns whether the picture is paused.
ximpel.mediaTypeDefinitions.Picture.prototype.mediaIsPaused = function(){
	return this.state === this.STATE_PAUSED;
}

// Returns whether the picture is stopped.
ximpel.mediaTypeDefinitions.Picture.prototype.mediaIsStopped = function(){
	return this.state === this.STATE_STOPPED;
}


ximpel.mediaTypeDefinitions.Picture.prototype.mediaPreload = function(){
	// If the media is already preloaded then we need to do nothing, so we just return the already existing resolved promise.
	if( this.isPreloaded() ){
		return this.preloadPromise;
	}
	var deferred = new $.Deferred();

	this.$picture.on('load', function(){
		deferred.resolve();
	}.bind(this) );


	this.$picture.on('error', function(){
		ximpel.warn("Picture.mediaPreload(): failed to preload picture '" + $picture[0].src + "'.");
		deferred.reject();
	});

	this.$picture.attr('src', this.pictureSource );
	// We return a jquery promise which is resolved when the browsers triggers a canplaythrough event or rejected if the video fails to load.
	// Note that at the time of writing some browsers throw this event multiple times while others throw it only once.
	this.preloadPromise = deferred.promise();
	return this.preloadPromise;
}


ximpel.mediaTypeDefinitions.Picture.prototype.isPreloaded = function(){
	return this.preloadPromise && this.preloadPromise.state() === "resolved" && this.$picture[0].readyState >= 4;
}
ximpel.mediaTypeDefinitions.Picture.prototype.isPreloading = function(){
	return this.preloadPromise && this.preloadPromise.state() === "pending";
}




// Return the maximum dimensions of a rectangle that still fits in some available space (another rectangle) while maintaining aspect ratio.
ximpel.mediaTypeDefinitions.Picture.prototype.getFittingRectangle = function( availableWidth, availableHeight, actualWidth, actualHeight ){
	var scale = Math.min( availableWidth / actualWidth, availableHeight / actualHeight );
	return {'width': actualWidth*scale, 'height': actualHeight*scale };
}
// Return the x and y coordinates for a rectangle centered within some available space (another rectangle).
ximpel.mediaTypeDefinitions.Picture.prototype.getCenteredRectangleCoordinates = function( availableWidth, availableHeight, actualWidth, actualHeight ){
	var x = ( actualWidth < availableWidth ) 	? Math.round( ( availableWidth-actualWidth ) / 2 ) : 0;
	var y = ( actualHeight < availableHeight ) 	? Math.round( ( availableHeight-actualHeight ) / 2 ) : 0;
	return { 'x': x, 'y': y };
}






ximpel.registerMediaType(
	new ximpel.MediaTypeRegistration( 'picture', ximpel.mediaTypeDefinitions.Picture, {
		'allowedAttributes': ['src', 'width','height','x','y'],
		'requiredAttributes': ['src'],
		'allowedChildren': [],
		'requiredChildren': [],
	})
);










