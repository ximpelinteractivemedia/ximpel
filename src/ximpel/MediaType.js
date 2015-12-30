// MediaType()
// The media type constructor constructs objects that are used as prototype by specific media types such as video or audio.
// In other words, its a parent object for specific media types (ie. Audio, Video, Picture use this as parent object)
// For example the Video media type does:
//     ximpel.mediaTypeDefinitions.Video.prototype = new ximpel.MediaType();
// By using a generic MediaType object as the prototype for a specific media type, all the media types will
// have some common functions available. For example the following methods are available by each
// media type that uses this MediaType object as its prototype:
// addEventHandler()
// removeEventHandler()
// ended()
// play()
// pause()
// stop()
// isPlaying()
// etc.
// 
// Methods like "play" and "pause" don't do much more then forwarding the call to the mediaPlay 
// and mediaPause methods of the specific media type implementation itself. However, they generate 
// a warning in the console to indicate a media type is missing certain required functions if that is the case.
// 
// The function addEventHandler() and removeEventHandler() provides the ability to add event handlers for events
// without creating an addEventHandler() function on every media type.
// ############################################################################

ximpel.MediaType = function(){
}
ximpel.MediaType.prototype.EVENT_MEDIA_END = 'ended';


// This method will call the mediaPlay method of the specific mediaType or produce a warning if the media type doesn't have one.
ximpel.MediaType.prototype.play = function(){
	if( this.mediaPlay ){
		this.mediaPlay();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaPlay() method.');
	}
	return this;
}



// This method will call the mediaPause method of the specific mediaType or produce a warning if the media type doesn't have one.
ximpel.MediaType.prototype.pause = function(){
	if( this.mediaPause ){
		this.mediaPause();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaPause() method.');
	}
	return this;
}



// This method will call the mediaStop method of the specific mediaType or produce a warning if the media type doesn't have one.
ximpel.MediaType.prototype.stop = function(){
	if( this.mediaStop ){
		this.mediaStop();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaStop() method.');
	}
	return this;
}



// This method will call the mediaIsPlaying() method of the specific mediaType or produce a warning if the media type doesn't have one.
ximpel.MediaType.prototype.isPlaying = function(){
	if( this.mediaIsPlaying ){
		return this.mediaIsPlaying();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsPlaying() method.');
	}
}



// This method will call the mediaIsPaused() method of the specific mediaType or produce a warning if the media type doesn't have one.
ximpel.MediaType.prototype.isPaused = function(){
	if( this.mediaIsPaused ){
		return this.mediaIsPaused();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsPaused() method.');
	}
}



// This method will call the mediaIsStopped() method of the specific mediaType or produce a warning if the media type doesn't have one.
ximpel.MediaType.prototype.isStopped = function(){
	if( this.mediaIsStopped ){
		return this.mediaIsStopped();
	} else{
		ximpel.error('ximpel.MediaType(): Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsStopped() method.');
	}
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


// This method will call the mediaDestroy() method of the specific mediaType and destroy any generic variables used within this MediaType object.
ximpel.MediaType.prototype.destroy = function(){
	if( this.mediaDestroy ){
		return this.mediaDestroy();
	} 
	this.__mediaTypePubSub__ = null;

	return this;
}



// This method registers an event for when the media item ends (ie. it has nothing more to play)
ximpel.MediaType.prototype.onEnd = function( callback ){
	return this.addEventHandler( this.EVENT_MEDIA_END, callback );
}



// This method registers a handler function for a given event
ximpel.MediaType.prototype.addEventHandler = function( eventName, callback ){
	switch( eventName ){
		case this.EVENT_MEDIA_END:
			return this.lazyLoadPubSub().subscribe( this.EVENT_MEDIA_END, callback );
		default:
			ximpel.warn("MediaType.addEventHandler(): event type '" + eventName + "' is not supported.");    
			return null;
	}
}



// This method removes a handler function for a given event
ximpel.MediaType.prototype.removeEventHandler = function( eventName, callback ){
	switch( eventName ){
		case this.EVENT_MEDIA_END:
			this.lazyLoadPubSub().unsubscribe( this.EVENT_MEDIA_END, callback ); 
			return 	true;
		default: 
			ximpel.warn("MediaType.removeEventHandler(): event type '" + eventName + "' is not supported.");
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

