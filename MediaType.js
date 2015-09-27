// ############################################################################
// 
// ############################################################################


// TODO: make the preload return a promise if it has not been overwritten. 
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

	this.pubSub = new ximpel.PubSub();
}
ximpel.MediaType.prototype.STATE_PLAYING = 'PLAYING';
ximpel.MediaType.prototype.STATE_PAUSED = 'PLAYING';
ximpel.MediaType.prototype.STATE_STOPPED = 'STOPPED';
ximpel.MediaType.prototype.EVENT_MEDIA_END_ = 'MEDIA_END';



ximpel.MediaType.prototype.getInstance = function( customMediaType ){
	// If no custom media type definition object is given then we simply get an
	// instance of this current object. Otherwise we get an instance of this 
	// object extended with the properties and methods of the customMediaType
	//customMediaType = customMediaType || {};
	var newInstance = Object.create(this);
	$.extend( newInstance, customMediaType );
	return;
}

ximpel.MediaType.prototype.play = function(){
	if( this.mediaPlay ){
		this.mediaPlay();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaPlay() method.');
	}
	return this;
}


ximpel.MediaType.prototype.pause = function(){
	if( this.mediaPause ){
		this.mediaPause();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaPause() method.');
	}
	return this;
}


ximpel.MediaType.prototype.stop = function(){
	if( this.mediaStop ){
		this.mediaStop();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaStop() method.');
	}
	return this;
}

ximpel.MediaType.prototype.isPlaying = function(){
	if( this.mediaIsPlaying ){
		return this.mediaIsPlaying();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsPlaying() method.');
	}
}
ximpel.MediaType.prototype.isPaused = function(){
	if( this.mediaIsPaused ){
		return this.mediaIsPaused();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsPaused() method.');
	}
}
ximpel.MediaType.prototype.isStopped = function(){
	if( this.mediaIsStopped ){
		return this.mediaIsStopped();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the mediaIsStopped() method.');
	}
}

ximpel.MediaType.prototype.preload = function(){
	if( this.mediaPreload ){
		this.mediaPreload();
	} else{
		ximpel.warn('A custom media type has not implemented the preload() method. While it is not required to do so, it is advised in order to provide smooth playback.');
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
	this.pubSub.publish( this.EVENT_MEDIA_END );
	return;
}


ximpel.MediaType.prototype.isPlaying = function(){
	if( this.mediaIsPlaying ){
		return this.mediaIsPlaying();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the isPlaying() method.');
		return null;
	}
}
ximpel.MediaType.prototype.isPaused = function(){
	if( this.mediaIsPaused ){
		return this.mediaIsPaused();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the isPaused() method.');
		return null;
	}
}
ximpel.MediaType.prototype.isStopped = function(){
	if( this.mediaIsStopped ){
		return this.mediaIsStopped();
	} else{
		ximpel.error('Invalid custom media type! A custom media type does not conform to the required interface. The media type has not implemented the isStopped() method.');
		return null;
	}
}

ximpel.MediaType.prototype.destroy = function(){
	this.pubSub = null;
	return this;
}
ximpel.MediaType.prototype.onEnd = function( callback ){
	this.pubSub.subscribe( this.EVENT_MEDIA_END, callback );
	return this;
}