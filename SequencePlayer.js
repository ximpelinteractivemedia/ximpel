// ############################################################################

// ############################################################################
ximpel.SequencePlayer = function( player, mediaSequenceModel ){
	//this.parallelPlayer = new ximpel.ParallelPlayer();
	this.player = player;
	this.mediaPlayer = new ximpel.MediaPlayer( player );
	this.mediaPlayer.onEnd( this.handleMediaPlayerEnd.bind(this) );

	this.mediaSequenceModel = null;
	this.currentSequenceIndex = 0;
	this.currentModel = null;
	this.pubSub = new ximpel.PubSub();
	this.state = this.STATE_STOPPED;

	if( mediaSequenceModel ){
		this.use( mediaSequenceModel );
	}
};

ximpel.SequencePlayer.prototype.EVENT_SEQUENCE_END = 'EVENT_SEQUENCE_END';

ximpel.SequencePlayer.prototype.STATE_PLAYING = 'state_sp_playing';
ximpel.SequencePlayer.prototype.STATE_PAUSED = 'state_sp_paused';
ximpel.SequencePlayer.prototype.STATE_STOPPED = 'state_sp_stopped';

ximpel.SequencePlayer.prototype.use = function( mediaSequenceModel, preventReset ){
	// Reset this sequence player if the preventReset argument is set to false. The preventReset is used when you know
	// the sequence player is already in its default state.
	if( !preventReset ){
		this.reset();
	}

	this.mediaSequenceModel = mediaSequenceModel;
}

// The reset function resets the sequence player into the start state from where it can start playing a sequence model again.
// After this method the sequence player has no visual elements displayed anymore.
ximpel.SequencePlayer.prototype.reset = function( clearRegisteredEventHandlers ){
	this.mediaPlayer.stop();
	this.state = this.STATE_STOPPED;
	this.currentModel = null;
	this.currentSequenceIndex = 0;

	if( clearRegisteredEventHandlers ){
		this.clearEventHandlers(); 		// resets the pubsub of the sequence player so that all registered callbacks are unregistered.
	}
}

ximpel.SequencePlayer.prototype.play = function( mediaSequenceModel ){
	// If a sequence model is specified then we use it (this resets the sequence player).
	if( mediaSequenceModel ) this.use( mediaSequenceModel );

	// If no sequence model is specified, then there is nothing to play so give an error message and return.
	if( !this.mediaSequenceModel ){
		ximpel.error("SequencePlayer.play(): cannot start playing because no sequence model has been specified.");
		return;
	}

	// Ignore this play() call if the sequence player is already in a playing state.
	if( this.isPlaying() ){
		ximpel.warn("SequencePlayer.play(): play() called while already playing.");
		return this;
	} else if( this.isPaused() ){
		this.resume();
		return this;
	}

	// Indicate that we are in a playing state.
	this.state = this.STATE_PLAYING;

	// Call the playback controller which will determine what to do play when.
	this.playbackController();
	return this;
}

ximpel.SequencePlayer.prototype.resume = function(){
	// Ignore this resume() call if the sequence player is already in a playing state.
	if( !this.isPaused() ){
		ximpel.warn("SequencePlayer.resume(): resume() called while not in a paused state.");
		return this;
	}

	if( this.currentModel instanceof ximpel.MediaModel ){
		// model that is currently being played is a media model. Media models are played by a media player so we resume the media player.
		this.mediaPlayer.resume();
	} else if( itemToPlay instanceof ParallelMediaModel ){
		// The model that is currently being played is a parallel model. Parallel models are played by a parallel player so we resume the parallel player.
		// ... parallel player not implemented yet.... 
	}

	// Indicate the sequence player is now in a playing state again.
	this.state = this.STATE_PLAYING;

	return this;
}

ximpel.SequencePlayer.prototype.playbackController = function(){
	var itemToPlay =  this.getNextItemToPlay();

	if( !itemToPlay ){
		// there is no next item to play...

		// Publish the sequence-end-event which will call events registered with onEnd().
		this.pubSub.publish( this.EVENT_SEQUENCE_END );
	} else if( itemToPlay instanceof ximpel.MediaModel ){
		// The item to play is a mediaModel... so we will play a media model.
		this.playMediaModel( itemToPlay );
		this.currentSequenceIndex++;
	} else if( itemToPlay instanceof ParallelMediaModel ){
		// The item to play is a parallel model... so we will play a parallel model.
		// .... Not yet implemented parallel media items....
		// this.playParallelModel()
	}
}

ximpel.SequencePlayer.prototype.playMediaModel = function( mediaModel ){
	this.currentModel = mediaModel;
	this.mediaPlayer.play( mediaModel );
}

ximpel.SequencePlayer.prototype.pause = function(){
	// Ignore this pause() call if the sequence player is not in a playing state.
	if( ! this.isPlaying() ){
		ximpel.warn("SequencePlayer.pause(): pause() called while not in a playing state.");
		return this;
	}

	// Indicate that we are in a paused state.
	this.state = this.STATE_PAUSED;

	// Tell the media player to pause.
	this.mediaPlayer.pause();

	return this;
}

ximpel.SequencePlayer.prototype.stop = function(){
	// Ignore this stop() call if the sequence player is already in the stopped state.
	if( this.isStopped() ){
		ximpel.warn("SequencePlayer.stop(): stop() called while already in a stopped state.");
		return this;
	}

	// Indicate that we are in a stopped state.
	this.state = this.STATE_STOPPED;

	// Tell the media player to stop.
	this.mediaPlayer.reset();
	return this;
}



ximpel.SequencePlayer.prototype.isPlaying = function(){
	return this.state === this.STATE_PLAYING;
}
ximpel.SequencePlayer.prototype.isPaused = function(){
	return this.state === this.STATE_PAUSED;
}
ximpel.SequencePlayer.prototype.isStopped = function(){
	return this.state === this.STATE_STOPPED;
}


// This is the method that gets called when the media player wants to give back control to the sequence player. So the sequence player will decide 
// what to do next, now that the media player has ended. Note that even though the media player has ended, it may still have visual elements shown.
// So either the media player should be destroyed/stopped or the media player should be told to use another mediaModel which will aslo delete all
// its visual elements.
ximpel.SequencePlayer.prototype.handleMediaPlayerEnd = function(){
	console.log("Media player handed over control back to sequence player...");
	this.playbackController();
}


ximpel.SequencePlayer.prototype.getNextItemToPlay = function(){
	if( this.currentSequenceIndex < this.mediaSequenceModel.list.length ){
		return this.mediaSequenceModel.list[ this.currentSequenceIndex ];
	} else{
		return null;
	}
}

ximpel.SequencePlayer.prototype.onEnd = function( callback ){
	this.pubSub.subscribe( this.EVENT_SEQUENCE_END, callback );
	return this;
}
ximpel.SequencePlayer.prototype.clearEventHandlers = function( callback ){
	this.pubSub.reset();
	return this;
}