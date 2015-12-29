// Image
// The Image object implements a media type for XIMPEL to use. This media type is one of the core media types that ship with
// XIMPEL by default. MediaTypes are a sort of plugins. Anyone can create their own media type. None of the media types
// (not even the core media types) have a special integration with XIMPEL. There are just a number of requirements that should
// be fulfilled to create a MediaType (See the documentation for more info). 
//
// Notes:
// - The Image object definition is added to the: ximpel.mediaTypeDefinitions namespace, but this is not required, it
//   could be stored in any variable.
// - The MediaType gets a new instance of ximpel.MediaType() as prototype. This gives the media type a number of predefined 
//   methods. For instance this implements a play(), pause() and stop() method which XIMPEL will call. These methods in turn
//   will call the mediaPlay(), mediaPause() and mediaStop() methods that we implement in this Image object.
// - Besides the implementation of some required methods of a media type, the media type must be registered. This is
//   done at the bottom using the ximpel.registerMediaType() function.
//
// ##################################################################################################
// ##################################################################################################
// ##################################################################################################

// TODO:
// - Check for loading failures and handle them properly (for example: maybe add an event to the MediaType() prototype
//   object which this Image object can throw so that XIMPEL can listen for the event and act upon the error).



// The constructor function which XIMPEL will use to create instances of our media type. Four arguments
// should be passed to the constructor function:
// - customElements - contains the child elements that were within the <image> tag in the playlist.
// - customAttributes - contains the attributes that were on the <image> tag in the playlist.
// - $parentElement - The element to which the image will be appended (the ximpel player element).
// - player - A reference to the player object, so that the media type can use functions from the player.
ximpel.mediaTypeDefinitions.Image = function( customElements, customAttributes, $parentElement, player ){
	// The custom elements that were added inside the <image> tag in the playlist.
	this.customElements = customElements;

	// The custom attributes that were added to the <image> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this image can attach itself (this is the element to which all media DOM nodes will be attached).
	this.$attachTo = $parentElement;

	// A reference to the XIMPEL player object. The media type can make use of functions on the player object.
	this.player = player;

	// The x coordinate of the image relative to the ximpel player element or 'center' to align center.
	// The value for x should include the units (for instance: 600px or 20%)
	this.x = this.customAttributes.x || 'center';

	// The y coordinate of the image relative to the ximpel player element or 'center' to align center.
	// The value for y should include the units (for instance: 600px or 20%)
	this.y = this.customAttributes.y || 'center';

	// The width of the image element. A default is used when not specified.
	// The value for width should include the units (for instance: 600px or 20%)
	this.width = this.customAttributes.width;

	// The height of the image element. A default is used when not specified.
	// The value for height should include the units (for instance: 600px or 20%)
	this.height = this.customAttributes.height;

	// Check if a media directory was specified in the XIMPEL config, if so the src is made to be relative to this mediaDirectory
	var mediaDirectory = player.getConfigProperty("mediaDirectory") || "";
	this.imageSource = customAttributes['src'] || '';
	if( mediaDirectory != "" ){
		this.imageSource = mediaDirectory + "/" + this.imageSource;
	}

	// will hold the image's HTML element (or more specifically a jquery selector that points to the HTML element).
	this.$image = null;
	
	// This will hold a jquery promise object when the media item is loading or has been loaded already. 
	// This is used to check if the item has been loaded or is loaded.
	this.loadPromise = null;

	// State of the media item.
	this.state = this.STATE_STOPPED;
}
ximpel.mediaTypeDefinitions.Image.prototype = new ximpel.MediaType();
ximpel.mediaTypeDefinitions.Image.prototype.STATE_PLAYING = 'state_image_playing';
ximpel.mediaTypeDefinitions.Image.prototype.STATE_PAUSED = 'state_image_paused';
ximpel.mediaTypeDefinitions.Image.prototype.STATE_STOPPED = 'state_image_stopped';



// The mediaPlay() is one of the required methods for a media type. XIMPEL calls the play() method on the
// prototype which in turn calls this mediaPlay() method.
ximpel.mediaTypeDefinitions.Image.prototype.mediaPlay = function(){
	// Ignore this call if this media item is already playing.
	if( this.state === this.STATE_PLAYING ){
		return;
	}

	// Indicate that the media item is in a playing state now.
	this.state = this.STATE_PLAYING;

	// Create the image object, but we don't set a source so we don't start loading yet.
	// First we will attach some event listeners.
	this.$image = $('<img />');

	// Next we create a jquery deferred object (promise) and we give it a function that runs when the deferred
	// object is resolved. The deferred will be resolved as soon as the image has been loaded.
	var deferred = new $.Deferred();


	// Listen for the load event on the image tag and execute the function when loading completes.
	this.$image.on('load', function(){
		// The loading completed, we will resolve the deferred so registered callbacks on the deferred object will be called.
		// These are callbacks registered with something like: deferred.done( func ).
		deferred.resolve();

		// Attach the image element to the DOM.
		this.$image.appendTo( this.$attachTo );

		// This sets the x, y, width and height of the image (can only be done after the image is appended to the DOM)
		this. calculateImageDetails();
	}.bind(this) );


	// Listen for the error event of the iamge.
	this.$image.on('error', function(){
		// The image failed loading so we reject the deferred so that registered callbacks on the deferred object will be called.
		// These are callbacks registered with something like: deferred.fail( func ).
		ximpel.warn("Image.mediaPreload(): failed to preload image '" + $image[0].src + "'.");
		deferred.reject();
	});

	// Now that the event listeners on the image have been set we can start loading the image by setting its source.
	this.$image.attr('src', this.imageSource );

	// We return a jquery promise which is resolved when the image finished loading or rejected if the image fails to load.
	this.loadPromise = deferred.promise();
	return this.loadPromise;
}



// The mediaPause() is one of the required methods for a media type. XIMPEL calls the pause() method on the
// prototype which in turn calls this mediaPause() method.
ximpel.mediaTypeDefinitions.Image.prototype.mediaPause = function(){
	// Ignore this pause request if the image is not in a playing state.
	if( this.state !== this.STATE_PLAYING ){
		return;
	}
	// To pause an image we do nothing, we just set the state to paused.
	this.state = this.STATE_PAUSED;
}



// The mediaStop() is one of the required methods for a media type. XIMPEL calls the stop() method on the
// prototype which in turn calls this mediaStop() method. This method stops the image entirely. After this 
// method the image is removed from the DOM and nothing is visible anymore. The media type is in a state
// where it was in before it started playing.
ximpel.mediaTypeDefinitions.Image.prototype.mediaStop = function(){
	// Ignore this stop request if the image is already in a stopped state.
	if( this.state === this.STATE_STOPPED ){
		return;
	}
	// Indicate that the media item is now in a stopped state.
	this.state = this.STATE_STOPPED;

	// We detach and remove the image element. We just create it again when the play method is called.
	this.$image.detach();
	this.$image.remove();

	// Make sure we are back in the state the media item was in before it started playing.
	this.$image = null;
	this.loadPromise = null;
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



// This method determines and sets the x, y, width and height of the image element relative to the player element
// to which the image will be attached. If no x, y , width and height were specified for the media item then it
// will be displayed as large as possible, centered, and while maintaining aspect ratio within the player element.
ximpel.mediaTypeDefinitions.Image.prototype.calculateImageDetails = function(){
	// Get the width and height of the player element.
	var playerElementWidth = this.$attachTo.width();
	var playerElementHeight = this.$attachTo.height();

	// if x and or y is "center" then we will determine the x and y coordinates when we append the image element to the DOM.
	// We do it later because we can only reliably determine the x/y coordinate when the image element is loaded and appended to the DOM.
	var x = this.x === 'center' ? '0px' : this.x; 
	var y = this.y === 'center' ? '0px' : this.y;
	
	// By now the image has been appened to the DOM. This means that we can now retrieve the intrinsic width and height 
	// of the image element. Then we need to determine the css values for width and height...
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
		// A height was specifie but no width, in this case we set the height and let the width be determined automatically.
		var width = 'auto';
		var height = this.height;
	} else if( !this.height ){
		// A width was specifie but no height, in this case we set the width and let the height be determined automatically.
		var width = this.width;
		var height = 'auto'
	} else{
		// Both were specified, so we just use that.
		var width = this.width;
		var height = this.height;
	}

	// If x or y are set to 'center' then we use the width and height of the image element to determine the x and y coordinates such
	// that the image element is centered within the player element.
	if( this.x === 'center' ){
		var x = Math.round( Math.abs( this.$attachTo.width() - this.$image.width() ) / 2 );
	}
	if( this.y === 'center' ){
		var y = Math.round( Math.abs( this.$attachTo.height() - this.$image.height() ) / 2 );
	}

	// Set the x, y, width and height for the element.
	this.$image.attr({
		'width': width,
		'height': height,
	}).css({
		'position': 'absolute',
		'left': x,
		'top': y
	});
}



// Finally we register the media type to XIMPEL such that XIMPEL knows some information about the media type.
// Information for the parser (tagname, allowedAttributes, requiredAttributes, allowedElements and requiredElements)
// and information for the XIMPEL player (the constructor such that it can create instances of the media type)
var mediaTypeRegistrationObject = new ximpel.MediaTypeRegistration( 
	'image', 							// = the media type ID (and also the tagname used in the playlist)
	ximpel.mediaTypeDefinitions.Image, 	// a pointer to the constructor function to create instances of the media type.
	{
		'allowedAttributes': ['src', 'width','height','x','y'], // the attributes that are allowed on the <image> tag (excluding the attributes that are available for every media type like duration).
		'requiredAttributes': ['src'],	// the attributes that are required on the <image> tag.
		'allowedChildren': [],			// the child elements that are allowed on the <image> tag.
		'requiredChildren': []			// The child elements that are required on the <image> tag.
	}
);

ximpel.registerMediaType( mediaTypeRegistrationObject );




// ##############################################################################################################################
// ########################################### OLD METHODS ######################################################################
// ##############################################################################################################################
// Some old methods that are not used anymore but might be useful at some point.

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
