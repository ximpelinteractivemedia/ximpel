// ########################################################################################################################################################
// The MediaPlayer..... description... comes later...
// ########################################################################################################################################################

// TODO:
// - In the use function and in the constructor we check if the media item has a getPlayTime method. however i think this will not work right
//	 now because the media player will call this.getPlayTime() so the context is the media player object. This should probably be the media item
//   itsself otherwise the media item can't call functions from the getPlayTime method. Im not sure should check this out.

ximpel.MediaPlayer = function( player, mediaModel ){
	// The MediaPlayer uses and is used by the Player() object and as such it has a reference to it and all of the Player()'s data.
	this.player = player;

	// The $playerElement is the main element used to add all the DOM objects to that are part of ximpel (overlays, media items, questions, etc)
	this.$playerElement = player.getPlayerElement();

	// Will store the mediaModel which is used to determine when to show what (ie, overlays/media item/questions. etc.)
	this.mediaModel = null;

	// Will store the mediaItem which is the actual media type object that is to be played.
	this.mediaItem = null;

	// This will hold a pointer to the function that can determine how long a mediatype has been playing. This will be
	// the default method implemented in this MediaPlayer unless the media item provides its own getPlayTimeMethod.
	this.getPlayTime = null;

	// This will store the overlay models ordered by their startTime. 
	this.overlaysSortedByStartTime = null;

	// An index pointing to the first overlay in the 'overlaysSortedByStartTime' array which still has to be started / played.
	// This is increased by one whenever an overlay is displayed, so that it points to the next overlay that is to be displayed.
	this.overlayIndexToStartNext = 0;

	// The overlays that are currently being played/displayed are stored in the playingOverlays array
	this.playingOverlays = [];

	// The timeout handler for controlling media player updates. We store this to be able to turn the timeout off again.
	this.mediaPlayerUpdateHandler = null;

	// A boolean variable to indicate whether the media player has finished playing the media model.
	this.mediaHasEnded = false;

	// PubSub is used to subscribe callback functions for specific events and to publish those events to the subscribers.
	this.pubSub = new ximpel.PubSub();

	// The state of the media player (ie. playing, paused, stopped)
	this.state = this.STATE_STOPPED;

	// is used when unpausing the media player. It indicates whether play() should be called on the media item. 
	// This should only be done if the media item was in a playing state before the media player was paused.
	this.playMediaItemWhenMediaPlayerResumes = false;

	// If the media type that is being played does not provide a getPlayTime() function then we need to track how long
	// a media item has been playing by ourselves. The reason we check if the mediaItem provides a getPlayTime() function
	// is because a media item may be able to more accurately keep track of its playtime. For example a youtube video
	// may have loading issues (even if it has been partly preloaded). In that case the youtube media item may provide more
	// accurate information on how long it really has been playing (by reading the video's current playback time)
	this.playTimestamp = 0;
	this.pauseTimestamp = 0;

	// If a mediaModel has been specified, then by calling use() we initialize the mediaPlayer to make it use the media model.
	// If no mediaModel has been specified then use() must be called manually before the mediaPlayer can start playing.
	if( mediaModel ){
		this.use( mediaModel, true );
	}
};

// The time in ms between checking if overlays need to be displayed/hidden
ximpel.MediaPlayer.prototype.MEDIA_PLAYER_UPDATE_INTERVAL = 50; 

ximpel.MediaPlayer.prototype.EVENT_MEDIA_PLAYER_END = 'media_player_end';
ximpel.MediaPlayer.prototype.STATE_PLAYING = 'state_mp_playing';
ximpel.MediaPlayer.prototype.STATE_PAUSED = 'state_mp_paused';
ximpel.MediaPlayer.prototype.STATE_STOPPED = 'state_mp_stopped';


// The use() method can be called to start using the given mediaModel. This resets the entire MediaPlayer and will then
// use the new media model for playback. This means that whenever the media player finished playing a media model it can 
// be asked to play a different model rather then having to create a new MediaPlayer.
ximpel.MediaPlayer.prototype.use = function( mediaModel, preventReset ){
	// Reset this mediaPlayer if the preventReset argument is set to false. The preventReset is used when you know
	// the MediaPlayer is already in its default state.
	if( !preventReset ){
		this.reset();
	}

	this.mediaModel = mediaModel;
	this.mediaItem = this.player.mediaItems[mediaModel.mediaId];

	// Register an event handler for when the mediaItem ends. Note that not all media types will end. For instance, an image will play 
	// indefinitely unless manually interrupted by this MediaPlayer when it exceeds its duration as specified in the playlist.
	this.mediaItem.onEnd( this.handleMediaItemEndEvent.bind(this) );

	// If the mediaItem provides a getPlayTime method, then we use that one. If it doesn't then we use the default media player method.
	this.getPlayTime = this.mediaItem.getPlayTime || this.getPlayTimeDefault;

	// Take the list of overlays from the new mediaModel and store them sorted by starttime.
	this.overlaysSortedByStartTime = this.getOverlaysSortedByStartTime( mediaModel.overlays );
}


// The reset function resets the media player into the start state from where it can start playing a media model again.
// After this method the media player has no visual elements displayed anymore.
ximpel.MediaPlayer.prototype.reset = function( clearRegisteredEventHandlers ){
	if( this.mediaItem ){
		this.mediaItem.stop();
	}
	this.turnOffMediaPlayerUpdates();
	this.destroyPlayingOverlays();
	this.playingOverlays = [];
	this.overlayIndexToStartNext = 0;	// The first overlay to start next is the first index in the array of overlays sorted by start time
	this.playTimestamp = 0;
	this.pauseTimestamp = 0;
	this.mediaHasEnded = false;
	this.state = this.STATE_STOPPED;
	this.playMediaItemWhenMediaPlayerResumes = false;

	if( clearRegisteredEventHandlers ){
		this.clearEventHandlers(); 		// resets the pubsub of the media player so that all registered callbacks are unregistered.
	}
}


// Start playing the media model.
ximpel.MediaPlayer.prototype.play = function( mediaModel ){
	// If a mediaModel argument is specified then that media model will be used from now on.
	if( mediaModel ){ 
		this.use( mediaModel );
	} 

	// If no media model has been set for the media player then there is nothing to play.
	if( !this.mediaModel ){
		ximpel.error("MediaPlayer.play(): cannot start playing because no media model has been specified.");
		return;
	}

	// Ignore this play() call if the media player is already in a playing state.
	if( this.isPlaying() ){
		ximpel.warn("MediaPlayer.play(): play() called while already playing.");
		return this;
	} else if( this.isPaused() ){
		this.resume();
		return;
	}

	// Indicate that the media player is in a playing state.
	this.state = this.STATE_PLAYING;

	// Start playing the mediaItem
	this.mediaItem.play();

	// This does some stuff needed to keep track of the playTime of a media item.
	this.updatePlayTimeTracking( this.STATE_PLAYING );

	// The media player needs to check if updates are necessary regurally such as checking if overlays need to be displayed at specific
	// points in time during the media playback or if a media item has surpassed its duration.
	this.turnOnMediaPlayerUpdates();
	return this;
}


// Pause playing the media model.
ximpel.MediaPlayer.prototype.pause = function(){
	// Ignore this pause() call if the media player is already in a paused state.
	if( this.isPaused() ){
		ximpel.warn("MediaPlayer.pause(): pause() called while already paused.");
		return this;
	}

	// Indicate that the media player is in a paused state.
	this.state = this.STATE_PAUSED;

	if( this.mediaItem.isPlaying() ){
		// Store that the media item should be played when the media player resumes. (is not the case if the media item is already paused.)
		this.playMediaItemWhenMediaPlayerResumes = true; 

		// pause the media item.
		this.mediaItem.pause();
	} else{
		// Store that the media item should not be played when the media player resumes (because it was already not playing before it was paused)
		this.playMediaItemWhenMediaPlayerResumes = false;
	}

	// This does some stuff needed to keep track of the playTime of a media item.
	this.updatePlayTimeTracking( this.STATE_PAUSED );

	// Turn off the media player updates. The play time of media-items doesn't change while pausing so no need to check for updates.
	this.turnOffMediaPlayerUpdates();

	return this;
}


// The resume method resumes the media player. This does nothing if the media player is not in a paused state.
// It will resume the media player from the same state that it was in when it was paused.
ximpel.MediaPlayer.prototype.resume = function(){
	// Ignore this resume() call if the media player is not in a paused state.
	if( !this.isPaused() ){
		ximpel.warn("MediaPlayer.resume(): resume() called while not paused.");
		return this;
	}

	// The media item was playing when the media player was paused, so we resume playing the media item now that the media player is playing again.
	if( this.playMediaItemWhenMediaPlayerResumes === true ){
		this.mediaItem.play();		
	}

	// Inicate the media player is in a playing state again.
	this.state = this.STATE_PLAYING;

	// This does some stuff needed to keep track of the playTime of a media item.
	this.updatePlayTimeTracking( this.STATE_PLAYING );

	// Media player updates are always on when in a playing state, so we turn them on again.
	this.turnOnMediaPlayerUpdates();


	return this;
}


// Stop playing the media model. After the function has finished, no visual elements are displayed anymore by the media player.
// This method does nothing if the media player is already in a stopped state.
ximpel.MediaPlayer.prototype.stop = function(){
	// Ignore this stop() call if the media player is already in a stopped state.
	if( this.isStopped() ){
		ximpel.warn("MediaPlayer.stop(): stop() called while already stopped.");
		return this;
	}

	// This does some stuff needed to keep track of the playTime of a media item.
	this.updatePlayTimeTracking( this.STATE_STOPPED );

	this.reset();

	return this;
}

// This method updates the media player by checking several things such as whether overlays need to be displayed or hidden
// or checking whether the media item has reached its duration as specified in the playlist. This method will be called 
// every this.MEDIA_PLAYER_UPDATE_INTERVAL miliseconds as long as media player updates are on. These can be turned of with
// the method turnOffMediaPlayerUpdates()
ximpel.MediaPlayer.prototype.updateMediaPlayer = function(){
	this.checkMediaItem();
	this.updateOverlays();
}

// This function checks whether overlays need to be displayed or hidden based on their start time and duration.
ximpel.MediaPlayer.prototype.updateOverlays = function(){
	// Get the play time of the currently playing media item in seconds.
	var currentPlayTime = Math.floor( this.getPlayTime() / 1000 ); 

	// Check if there are any overlays which need to be hidden/stopped by iterating over all the currently playing overlays.
	for( var i=0; i<this.playingOverlays.length; i++ ){
		var overlayEndTime = +this.playingOverlays[i].endTime;

		if( currentPlayTime >= overlayEndTime && overlayEndTime !== 0 ){
			// its time to hide the overlay, so we destroy the view.
			this.playingOverlays[i].view.destroy();

			// Remove the overlay from the array of playing overlays.
			this.playingOverlays.splice( i, 1 );
			i--; // Since we deleted an overlay i should be decreased by 1.
		}
	}

	// Check if an overlay needs to be displayed.
	var nrOfOverlaysToCheck = this.overlaysSortedByStartTime.length;
	for( var i=this.overlayIndexToStartNext; i<nrOfOverlaysToCheck; i++ ){
		var overlayModel = this.overlaysSortedByStartTime[i];
		if( overlayModel.startTime > currentPlayTime ){
			// The overlay is not ready to be played yet. Since the overlays are sorted on startTime, we know that the rest of the overlays are not ready either.
			break;
		} else{
			// Create and render an overlay view object.
			var overlayView = new ximpel.OverlayView( overlayModel );
			overlayView.render( this.$playerElement );

			// Add the view to an array containing the currently playing overlays.
			var overlayEndTime = overlayModel.duration > 0 ? overlayModel.startTime+overlayModel.duration : 0; // an end time of 0 means until the end of the media item.
			this.playingOverlays.push( {'view': overlayView, 'model': overlayModel, 'endTime': overlayEndTime} );

			// An overlay has now been displayed, so we make overlayIndexToStartNext point to the next overlay which is the one to be displayed next.
			this.overlayIndexToStartNext++;
		}
	}
} 

// This method checks whether the media item has reached its duration limit (as specified in the playlist)
ximpel.MediaPlayer.prototype.checkMediaItem = function(){
	// The ammount of time the meda item is allowed to be played (as has been specified in the playlist)
	var allowedPlayTime = this.mediaModel.duration || 0;

	// Get the ammount of time in seconds that the media item has been playing.
	var currentPlayTime = Math.floor( this.getPlayTime() / 1000 );

	if( this.mediaHasEnded === true || (currentPlayTime >= allowedPlayTime && allowedPlayTime !== 0) ){
		this.endMedia();
	}
}

// This function is called when a media item has come to an end either because the specified duration has been exceeded or
// because there is nothing more to play (the video reached the end for example). We throw an event to indicate that the media player
// finished playing this media item. Depending on what has been specified in the playlist this event may result in another media item
// being started by the subject player or nothing happens and the user is expected to click an overlay to proceed.
ximpel.MediaPlayer.prototype.endMedia = function(){
	this.turnOffMediaPlayerUpdates();
	this.mediaHasEnded = true;
	this.mediaItem.pause();
	this.pubSub.publish( this.EVENT_MEDIA_PLAYER_END );
	console.log("media has ended!");
}

// This function is the handler function for when the media item has ended. This will only ever be called if the media item has an 
// ending (such as a video). Media items like images can play indefinitely and because of that they will never throw an end event.
// Note that this handler function is not called when the media item exceeds its duration because that is something that is not
// controlled by the media item but by this media player.
ximpel.MediaPlayer.prototype.handleMediaItemEndEvent = function(){
	// Check if the media has ended before (can be the case if repeat has been specified)
	if( this.mediaHasEnded === false ){
		// This is the first time the media item threw an end event so we must indicate that the media player has finished playing the media item.
		this.endMedia();
	} else{
		// The media item has ended before so we dont need to do anything except repeat the media item if the 'repeat' option has been specified.
		if( this.mediaModel.repeat === true ){
			console.log("repeat media item...");
		}
	}
} 

// This method is used to keep track of how long a media item has been playing. Whenever the media item changes from or to
// a pause, play or stop state this method is called to update a play timestamp and a pause timestamp which together can indicate
// how long the media item has been playing.  Playtime tracking works as follows:
// As long as the media player is playing, the pauseTimestamp will be 0 and the playTimestamp will be a timestamp
// such that: Date.now() - playTimestamp = <playTimeOfMediaItem>. However if we go into a pause state, the playTimestamp
// will not be accurate anymore because for some of the time between Date.now() - playTimestamp we were not playing but pausing.
// So whenever we move to a playing state we add the paused time to the playTimestamp so that the paused time does not add up to 
// the play time. Changing to a stop state causes both timestamps to reset.
ximpel.MediaPlayer.prototype.updatePlayTimeTracking = function( stateChange ){
	if( stateChange === this.STATE_PLAYING ){
		// Calculate the time between Date.now() and the timestamp at which the media player was paused. This is the pause time.
		var pauseTime = (this.pauseTimestamp === 0) ? 0 : (Date.now()-this.pauseTimestamp);

		// If no playTimestamp is set then we initialize it to the current time. If the playTimestamp was already initialized then 
		// we add the pauseTime to it so that the time that the media player was paused doesnt add up the play time of the media item.
		// that the play timestamp refers to the time the media was actually playing.
		this.playTimestamp = this.playTimestamp === 0 ?	Date.now() : (this.playTimestamp+pauseTime);

		// Reset the pause timestamp because we already added this paused time to the playtimestamp.
		this.pauseTimestamp = 0;
	} else if( stateChange === this.STATE_PAUSED ){
		// Set the pause timestamp to Date.now() but only if a timestamp was not already set. If a timestamp was already set then we were already in a paused 
		// state. We know that because the pause timestamp is reset whenever we go from a paused state to a non-paused state, ie. play or stop state).
		this.pauseTimestamp = this.pauseTimestamp === 0 ? Date.now() : this.pauseTimestamp;
	} else if( stateChange === this.STATE_STOPPED ){
		// When we move to a stop state, both timestamps are reset because all media player state is lost when doing a stop().
		this.playTimestamp = 0 ;
		this.pauseTimestamp = 0 ;
	}
}

// getPlayTimeDefault() is the default way for the mediaPlayer to determine how long the media item has been playing (in miliseconds). It is based
// on how long the media item has been in a playing state. However, this may not be accurate if there are streaming issues for example. So this method
// is only used if the media item does not provided its own getPlayTime() method. The media item may be able to provide a more accurate getPlayTime value
// because it can look at the playback time of the video for example (in the case of a Video media item)
ximpel.MediaPlayer.prototype.getPlayTimeDefault = function(){
	// We first determine the pause time (which is 0 if we are not in the paused state). If we are not in the paused state then the pause time
	// is the difference between Date.now() and the pauseTimestamp.
	var currentTimestamp = Date.now();
	var pauseTime = this.pauseTimestamp === 0 ? 0 : (currentTimestamp-this.pauseTimestamp);

	// Return the time that the media item has actually been playing. 
	return currentTimestamp -this.playTimestamp + pauseTime;
}

// Turn on media player updates (ie. checking for changes in overlays, questions, etc.).
ximpel.MediaPlayer.prototype.turnOnMediaPlayerUpdates = function(){
	this.mediaPlayerUpdateHandler = setTimeout( function(){
		this.turnOnMediaPlayerUpdates();
		this.updateMediaPlayer();
	}.bind(this), this.MEDIA_PLAYER_UPDATE_INTERVAL );
}

// Turn off media player updates (ie. checking for changes in overlays, questions, etc.).
ximpel.MediaPlayer.prototype.turnOffMediaPlayerUpdates = function(){
	if( this.mediaPlayerUpdateHandler ){
		clearTimeout( this.mediaPlayerUpdateHandler );
	}
	this.mediaPlayerUpdateHandler = null;
}

// Destroy all overlay views.
ximpel.MediaPlayer.prototype.destroyPlayingOverlays = function(){
	this.playingOverlays.forEach( function( playingOverlay ){
		playingOverlay.view.destroy();
	}.bind(this) );
}

// Return a new array containing the overlayModels from the given array sorted by startTime.
ximpel.MediaPlayer.prototype.getOverlaysSortedByStartTime = function( overlays ){
	// overlays.slice() creates a copy of the overlays array and then sort() sorts them by start time.
	var overlaysSorted = overlays.slice().sort( function( overlay1, overlay2 ){
		return overlay1.startTime - overlay2.startTime;
	} );
	
	// Return the copy of the overlays array
	return overlaysSorted;
}

ximpel.MediaPlayer.prototype.onEnd = function( callback ){
	this.pubSub.subscribe( this.EVENT_MEDIA_PLAYER_END, callback );
	return this;
}
ximpel.MediaPlayer.prototype.clearEventHandlers = function( callback ){
	this.pubSub.reset();
	return this;
}
ximpel.MediaPlayer.prototype.isPlaying = function(){
	return this.state === this.STATE_PLAYING;
}
ximpel.MediaPlayer.prototype.isPaused = function(){
	return this.state === this.STATE_PAUSED;
}
ximpel.MediaPlayer.prototype.isStopped = function(){
	return this.state === this.STATE_STOPPED;
}