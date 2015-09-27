// TODO:
// - If no width or height is specified, then make it so that the max width/height of the ximpel player element is used whiline maintaining aspect ratio
// - Make the parser check if a source has been given.
// - Make the preload resolve its deferred only when the image has really been loaded. Right now it resolves it immediately and we just hope that the image has been
//   been loaded by the time it is being played. See: http://stackoverflow.com/questions/1977871/check-if-an-image-is-loaded-no-errors-in-javascript
// ##################################################################################################
// ##################################################################################################
// ##################################################################################################
ximpel.mediaTypeDefinitions.Picture = function( customElements, customAttributes, $parentElement ){
	// The custom elements that were added inside the <picture> tag in the playlist (if any).
	this.customElements = customElements;

	// The custom attributes that were added to the <picture> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this picture can attach itself (this is the element to which all media DOM nodes will be attached).
	this.attachTo = $parentElement;

	// The number of seconds the picture should play.
	this.duration = customAttributes['duration'] || 0; 

	// The source of the image to be shown
	this.pictureSource = customAttributes['src'] || ''; 

	// The width of the picture (if no width is given then the picture will take the max width/height of its container wile maintaining aspect ratio)
	// If only the width is set but not the height then the picture will get the given width and will get the height based on the aspect ratio of the image.
	this.pictureWidth = customAttributes['width'] || 0;
	
	// The height of the picture (if no height is given then the picture will take the max width/height of its container wile maintaining aspect ratio)
	// If only the height is set but not the width then the picture will get the given height and will get the width based on the aspect ratio of the image.
	this.pictureHeight = customAttributes['height'] || 0;

	// This is the jquery wrapper for the <img> element. 
	// (note that we don't set the source yet, because that will start loading the picture. We will set the source in the preload() method).
	this.$picture = $('<img />').attr({
		'width': this.pictureWidth,
		'height': this.pictureHeight,
	}).css({
		'position': 'absolute',
		'top': customAttributes.y+'px',
		'left': customAttributes.x+'px'
	});
}
ximpel.mediaTypeDefinitions.Picture.prototype = new ximpel.MediaType();

// this is the ID of the media type as well as the name of the element in the playlist (<picture>).
ximpel.mediaTypeDefinitions.Picture.prototype.mediaTypeId = 'picture'; 




ximpel.mediaTypeDefinitions.Picture.prototype.mediaPlay = function(){
	var $picture = this.$picture;
	var pictureElement = $picture[0];

	// To play a picture we just attach it to the main player element.
	this.$picture.appendTo( this.attachTo );
	return this;
}


ximpel.mediaTypeDefinitions.Picture.prototype.mediaPause = function(){
	// To pause a picture we do nothing.
	ximpel.log("Picture is paused!");
	return this;
}


ximpel.mediaTypeDefinitions.Picture.prototype.mediaStop = function(){
	var $picture = this.$picture;
	// To stop a picture we remove it from the DOM.
	$picture.remove();
	return this;
}


ximpel.mediaTypeDefinitions.Picture.prototype.mediaPreload = function(){
	var $picture = this.$picture;
	var deferred = new $.Deferred();

	// Attach an event handler for the load event on the image. This must be done before the source is set, or it may be the case that the cache may serve the image
	// and trigger the load event before the event handler is attached.
	$picture.load( function(){
		deferred.resolve();
	}.bind(this) );


	// Attach an error event handler. This will trigger if the image fails to load for example because the specified source is invalid.
	$picture.error( function( e ){
		// the image failed to load, so we reject the deferred, triggering any .fail() handlers that the caller of preload() may have attached.
		ximpel.warn("failed to preload image: ");
		deferred.reject();
	}.bind(this) );

	// We set the src attribute of the picture. The browser will now start loading immediately.
	$picture.attr('src', this.pictureSource );

	// return a promise() that allows the caller to attach .done() or .fail() methods.
	return deferred.promise();
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




// ############################## OLD VIDEO METHODS ############################################






/*ximpel.mediaTypeDefinitions.Video.prototype.getFileExtension = function( fileName ){
	var parts = fileName.split(".");
	if( parts.length === 1 || ( parts[0] === "" && parts.length === 2 ) ) {
	    return ""; // the file doesn't have an extension or the filename starts with a dot (like .htaccess)
	}
	return parts.pop().toLowerCase();
}*/












