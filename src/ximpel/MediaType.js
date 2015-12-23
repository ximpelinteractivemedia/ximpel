// ############################################################################
// 
// ############################################################################


// TODO: 

ximpel.MediaType = function( customMediaType ){
	/* 	By doing: "new MediaType()"" javascript first creates a new empty object and sets the prototype
		of that object. The code in this constructor then runs with the "this" keyword pointing
	   	to the new empty object. If a customMediaType is passed as an argument, then the new object  
	   	will be extended with the properties and methods of the customMediaType object.
	   	This allows users of ximpel to define their own media types by simply creating an 
	   	object literal which includes all the functionality of their media type. Then ximpel 
	   	does the rest by attaching the custom code to a generic MediaType object.
	   	
		Another way to create a custom media type object is to use the getInstance() method.
			- var genericMediaTypeObj = new MediaType();
			- var customMediaTypeObj = genericMediaTypeObj.getInstance( videoMediaType );
			- var customMediaTypeObj = genericMediaTypeObj.getInstance( googleMapsMediaType );
	*/

	// Extend the new instance of the MediaType with the properties and methods of
	// the given customMediaType object (if a customMediaType obj was given)
	if( customMediaType ){
		// Note that we pass 'true' as the first argument, this means that we deep-copy the 
		// properties of "customMediaType" instead of doing a shallow copy.
		$.extend( true, this, customMediaType );
	}
}
ximpel.MediaType.prototype.EVENT_MEDIA_END = 'MEDIA_END';

ximpel.MediaType.prototype.play = function(){
	if( this.mediaPlay ){
		this.mediaPlay();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaPlay() method.');
	}
	return this;
}


ximpel.MediaType.prototype.pause = function(){
	if( this.mediaPause ){
		this.mediaPause();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaPause() method.');
	}
	return this;
}


ximpel.MediaType.prototype.stop = function(){
	if( this.mediaStop ){
		this.mediaStop();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaStop() method.');
	}
	return this;
}

ximpel.MediaType.prototype.isPlaying = function(){
	if( this.mediaIsPlaying ){
		return this.mediaIsPlaying();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsPlaying() method.');
	}
}
ximpel.MediaType.prototype.isPaused = function(){
	if( this.mediaIsPaused ){
		return this.mediaIsPaused();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsPaused() method.');
	}
}
ximpel.MediaType.prototype.isStopped = function(){
	if( this.mediaIsStopped ){
		return this.mediaIsStopped();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsStopped() method.');
	}
}

ximpel.MediaType.prototype.preload = function(){
	if( this.mediaPreload ){
		return this.mediaPreload();
	}
	return new $.Deferred().resolve().promise();
}

// This method should be called by the parent object (such as Video() or Youtube() ) to indicate the media type has ended.
// Note that this should only be called when the media type has ran into its playback end (ie. a video has nothing more to play).
// This is not to be called when the media type has surpassed its duration as specified in the playlist file, because that is
// managed by the MediaPlayer(). ended() is used by the media player to detect when a media type has nothing more to play. This
// makes it possible to let the duration attribute in the playlist file be optional, leaving it out means playing till the media ends.
// A media type is not obliged to call ended(), for instance an image can play indefinitely so it does never call the ended() method.
ximpel.MediaType.prototype.ended = function(){
	if( this.mediaEnded ){
		this.mediaEnded();
	}
	// Throw the media end event.
	this.lazyLoadPubSub().publish( this.EVENT_MEDIA_END );
	return this;
}

ximpel.MediaType.prototype.destroy = function(){
	this.__mediaTypePubSub__ = null;
	return this;
}
ximpel.MediaType.prototype.onEnd = function( callback ){
	return this.addEventHandler( 'end', callback );
}

ximpel.MediaType.prototype.addEventHandler = function( event, callback ){
	switch( event ){
		case 'end':
			return this.lazyLoadPubSub().subscribe( this.EVENT_MEDIA_END, callback );
		default:
			ximpel.warn("MediaType.addEventHandler(): event type '" + event + "' is not supported.");    
			return null;
	}
}
ximpel.MediaType.prototype.removeEventHandler = function( event, callback ){
	switch( event ){
		case 'end':
			this.lazyLoadPubSub().unsubscribe( this.EVENT_MEDIA_END, callback ); 
			return 	true;
		default: 
			ximpel.warn("MediaType.removeEventHandler(): event type '" + event + "' is not supported. Can't add/remove event handlers of this type.");
			return false;
	}
}
ximpel.MediaType.prototype.lazyLoadPubSub = function(){
	// Lazy loading means that we do not execute this code in the constructor but we do this  
	// at the last possible moment. At that moment the 'this' keyword will point not to this
	// MediaType object but to its child (ie. a YouTube instance or Picture instance).
	// That is what we want because we want this pubSub object to be a property of the child
	// and not of the parent (otherwise the pub-sub is shared across all media type instances)
	if( ! this.__mediaTypePubSub__ ){
		// if no pub sub is created yet for this media instance then we create one now.
		// We use the weird name because we dont want people creating custom media types
		// to accidentally overwrite it inside their media type implementation.
		this.__mediaTypePubSub__ = new ximpel.PubSub();
	}
	return this.__mediaTypePubSub__;
}

