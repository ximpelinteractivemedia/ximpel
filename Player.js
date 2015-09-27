// ########################################################################################################################################################
// The Player..... description... comes later...
// ########################################################################################################################################################
ximpel.Player = function( playerElement, playlistModel, configModel ){
	// The player element is the html elment to which all DOM elements will be attached (ie. the media types/overlays/etc.)
	this.$playerElement = ximpel.wrapInJquery( playerElement );

	// The "playlistModel" contains the data that the Player requires to play the presentation.
	// This is a Playlist() object constructed by the parser based on the playlist file.
	this.playlistModel = playlistModel;

	// The "configModel" contains all the data related to configuration settings for the player.
	// This is a Config() object constructed by the parser based on the config file.
	this.configModel = configModel;

	// Stores the subject models. A subject model can be retrieved like so: this.subjectModels[subjectId].
	this.subjectModels = playlistModel.subjectModels;

	// Stores the ID of the subject that is to be started when the player starts.
	this.firstSubjectModel = this.getFirstSubjectModel();

	// The available media types is an object containing all the mediaTypeRegistration objects. These registrations contain data about the implemented 
	// media types. A mediaTypeRegistration object can be retrieved like: this.availableMediaTypes[<mediaTypeName>]. For instance: availableMediaTypes['video']
	// For the Player the most important data in the registration object is a pointer to the constructor of the media type. A new instance of a media type
	// can be created like this: var videoInstance = new availableMediaTypes['video'].mediaTypeConstructor();
	this.availableMediaTypes = ximpel.availableMediaTypes; 

	// The mediaItems object will contain all the media type instances (ie. it will contain all the Video() objects, Audio() objects, etc.)
	// A media item is refered to by its ID. Referring to a media item is done like this: this.mediaItems[<mediaId>]. The result is a media
	// instance (for example a Video() object or an Audio() object) on which methods like play(), pause() and stop() can be called.
	// The media instances will be created and added to the mediaItems object by the constructMediaItems() function.
	this.mediaItems = {};

	//
	this.sequencePlayer = new ximpel.SequencePlayer( this );
	this.sequencePlayer.onEnd( this.handleSequencePlayerEnd.bind(this) );


	this.init();
};

ximpel.Player.prototype.STATE_PLAYING = 'state_p_playing';
ximpel.Player.prototype.STATE_PAUSED = 'state_p_paused';
ximpel.Player.prototype.STATE_STOPPED = 'state_p_stopped';



ximpel.Player.prototype.init = function(){
	// Create an instance for each mediaItem referenced by a mediaModel from the playlist (fill the this.mediaItems object with all media isntances).
	this.constructMediaItems();
	// Preload all the media items.
	this.preloadMediaItems();
	return this;
}


ximpel.Player.prototype.play = function(){
	if( this.isPlaying() ){
		ximpel.warn("Player.play(): play() called while already playing.");
		return this;
	} else if( this.isPaused() ){
		this.resume();
		return this;
	}

	// This play() method is called from a stopped state so start playing the first subject.
	this.playSubject( this.firstSubjectModel );
	return this;
}


ximpel.Player.prototype.playSubject = function( subjectModel ){
	// Each subject contains exactly one sequence model. The sequencePlayer plays such a sequence model. The sequence model itself may contain
	// one or more media models and parrallel models which in turn may contain sequence models again. This playback complexity is all handled by
	// the sequence player.
	var sequenceModel = this.subjectModel.sequenceModel;
	this.sequencePlayer.play( sequenceModel );
}


ximpel.Player.prototype.resume = function(){
	// Ignore this resume() call if the player is already in a playing state.
	if( !this.isPaused() ){
		ximpel.warn("Player.resume(): resume() called while not in a paused state.");
		return this;
	}

	// Resume the sequence player.
	this.sequencePlayer.resume();

	// Indicate the player is now in a playing state again.
	this.state = this.STATE_PLAYING;

	return this;
}


ximpel.Player.prototype.pause = function(){
	// Ignore this pause() call if the player is not in a playing state.
	if( ! this.isPlaying() ){
		ximpel.warn("Player.pause(): pause() called while not in a playing state.");
		return this;
	}

	// Pause the sequence player.
	this.sequencePlayer.pause();

	// Indicate the player is now in a paused state.
	this.state = this.STATE_PAUSED;
	return this;
}


ximpel.Player.prototype.stop = function(){
	// Ignore this stop() call if the player is already in the stopped state.
	if( this.isStopped() ){
		ximpel.warn("Player.stop(): stop() called while already in a stopped state.");
		return this;
	}

	// Stop the sequence player.
	this.sequencePlayer.stop();

	// Indicate the player is now in a stopped state.
	return this;
}

ximpel.Player.prototype.goTo = function( subjectId ){
	return;
}

// Start playing a certain subject.
ximpel.Player.prototype.goTo = function( subjectId ){
	return;
}



// Retrieve a score with a given id or the default score if no id is given.
ximpel.Player.prototype.getScore = function( scoreId ){
	return;
}



ximpel.Player.prototype.isPlaying = function(){
	return this.state === this.STATE_PLAYING;
}
ximpel.Player.prototype.isPaused = function(){
	return this.state === this.STATE_PAUSED;
}
ximpel.Player.prototype.isStopped = function(){
	return this.state === this.STATE_STOPPED;
}




ximpel.Player.prototype.handleSequencePlayerEnd = function(){
	console.log("The main Player's sequence player has ended! Should we do something?");
	this.sequencePlayer.stop();
}


ximpel.Player.prototype.getFirstSubjectModel = function(){
	return this.playlistModel.subjectModels[ this.playlistModel.firstSubjectIdToPlay ];
}























// The constructMediaItems function takes the list of mediaModels from the playlist object and creates an instance of a media type for each
// mediaModel. These instances are added to the mediaItems property of the player. To access an instance of a media type
// you can do: var mediaItemInstance = this.mediaItems[mediaId]; The mediaId is stored within a mediaModel.
ximpel.Player.prototype.constructMediaItems = function(){
	var mediaModels = this.getMediaModels();
	
	mediaModels.forEach( function( mediaModel ){
		var mediaTypeRegistration = this.availableMediaTypes[ mediaModel.mediaType ];
		var mediaItem = new mediaTypeRegistration['mediaTypeConstructor']( mediaModel.customElements, mediaModel.customAttributes, this.$playerElement );
		this.mediaItems[ mediaModel.mediaId ] = mediaItem;
	}.bind(this) );
	
	return this;
}


// preload all media items.
ximpel.Player.prototype.preloadMediaItems = function(){
	var mediaItemIds = Object.getOwnPropertyNames( this.mediaItems );

	mediaItemIds.forEach( function( mediaItemId ){
		var mediaItem = this.mediaItems[ mediaItemId ];
		mediaItem.preload();
	}.bind(this) );
	
	return this;
}







ximpel.Player.prototype.getPlayerElement = function(){
	return this.$playerElement;
}

ximpel.Player.prototype.getMediaModels = function(){
	return this.playlistModel.mediaList;
}

