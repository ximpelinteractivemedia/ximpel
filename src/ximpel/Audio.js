// ##################################################################################################
// ##################################################################################################
// ##################################################################################################
ximpel.mediaTypeDefinitions.Audio = function( customElements, customAttributes, $parentElement, player ){

	// The custom elements that were added inside the <audio> tag in the playlist (if any).
	this.customElements = customElements;

	// The custom attributes that were added to the <audio> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this audio can attach itself (this is the element to which all media DOM nodes will be attached).
	this.$attachTo = $parentElement;

	// A reference to the XIMPEL player object. The media type can make use of functions on the player object.
	this.player = player;

	// The point in the audio from which the audio should start playing (if not specified in the playlist then it is set to 0.)
	this.startTime = customAttributes['startTime'] || 0;

	// will hold the audio element (jquery)
	this.$audio = null;

	// Get the <source> element that was specified in the playlist for this audio (should be one element)
	var playlistSourceElement = ximpel.filterArrayOfObjects( customElements, 'elementName', 'source' )[0];

	// Get a jquery object that contains all the html source elements that should be added to the audio element.
	this.$htmlSourceElements = this.getHtmlSourceElements( playlistSourceElement );

	this.bufferingPromise = null;

	// Specify in what state this media item is. (ie. playing, paused, stopped)
	this.state = this.STATE_STOPPED;
}
ximpel.mediaTypeDefinitions.Audio.prototype = new ximpel.MediaType();
// this is the ID of the media type as well as the name of the element in the playlist (<audio>).
ximpel.mediaTypeDefinitions.Audio.prototype.mediaTypeId = 'audio';

ximpel.mediaTypeDefinitions.Audio.prototype.STATE_PLAYING = 'state_audio_playing';
ximpel.mediaTypeDefinitions.Audio.prototype.STATE_PAUSED = 'state_audio_paused';
ximpel.mediaTypeDefinitions.Audio.prototype.STATE_STOPPED = 'state_audio_stopped';


ximpel.mediaTypeDefinitions.Audio.prototype.mediaPlay = function(){
	// Ignore this call if this media item is already playing.
	if( this.state === this.STATE_PLAYING ){
		return;
	} else if( this.state === this.STATE_PAUSED ){
		this.resume();
		return;
	}

	// Indicate that the media item is in a playing state now.
	this.state = this.STATE_PLAYING;

	// create the audio element but don't start loading untill we call .load()
	var $audio = this.$audio = $('<audio />', {
		'preload': 'none'
	});
	var audioElement = $audio[0];

	// Add the HTML source elements to the audio element.
	$audio.append( this.$htmlSourceElements );

	// Every media type which has an ending should call the .ended() method when the media has ended. 
	// ended() is a method on the prototype. By calling the ended() method, all handler functions registered
	// with .addEventHandler('end', func) will be called.
	$audio.on('ended', this.ended.bind(this) );
	
	// Set an event listener (that runs only once) for the loadedmetadata event. 
	// This waits till the metadata (duration) has been loaded.
	$audio.one("loadedmetadata", function(){
		// Set the current position in the aidop to the appropriate startTime (can only be done after the metadata is loaded).
		audioElement.currentTime = this.startTime;
		$audio.appendTo( this.$attachTo );
	}.bind(this) );

	// Next we create a jquery deferred object (promise) and we define that the audio element
	// starts playing when the deferred is resolved. The deferred will be resolved as soon as
	// the canplaythrough event is thrown by the audio element.
	var deferred = new $.Deferred();
	deferred.done( function(){
		// When the buffering is done and the media item is still in a playing state then play the 
		// media item, otherwise do nothing. It may be the case that the media item is in a non-playing
		// state when the pause() method has been called during the buffering.
		if( this.state === this.STATE_PLAYING ){
			audioElement.play();
		}
	}.bind(this) );


	// Set an event listener for the canplaythough event. This waits until enough of the audio has been loaded 
	// to play without stuttering (as estimated by the browser). Note that canplaythrough event has some browsers 
	// differences. Some browsers call it multiple times and others call it only once. It is also not clear whether
	// canplaythrough means the audio has enough data to play from the beginning or has enough data to play from 
	// the audio's current time. This means that the audio may not be preloaded properly even when the 
	// canplaythrough event is thrown.
	$audio.one("canplaythrough", function(){
		// The audio has buffered enough. We resolve the deferred object so that the registered 
		// callbacks are called (the callbacks registered with .done() .succeed() etc)
		deferred.resolve();
	}.bind(this) );

	// Attach a handler function for when the audio fails to load.
	$audio.error( function(e){
		ximpel.warn("Audio.mediaPlay(): failed to buffer the audio: '" + audioElement.src + "'.");
		deferred.reject();
	}.bind(this) );

	// start loading now.
	audioElement.load();
	
	this.bufferingPromise = deferred.promise();
	return this.bufferingPromise;
}


ximpel.mediaTypeDefinitions.Audio.prototype.resume = function(){
	// Indicate that the media item is in a playing state now.
	this.state = this.STATE_PLAYING;
	if( this.bufferingPromise.state() === "resolved" ){
		this.$audio[0].play();
	}
}



ximpel.mediaTypeDefinitions.Audio.prototype.mediaPause = function(){
	// Ignore this pause request if the audio is not in a playing state.
	if( this.state !== this.STATE_PLAYING ){
		return;
	}
	this.state = this.STATE_PAUSED;
	this.$audio[0].pause();
}


ximpel.mediaTypeDefinitions.Audio.prototype.mediaStop = function(){
	// Ignore this stop request if the audio is already in a stopped state.
	if( this.state === this.STATE_STOPPED ){
		return;
	}
	var $audio = this.$audio;
	this.state = this.STATE_STOPPED;

	var audioElement = this.$audio[0];
	audioElement.pause();
	audioElement.src = "";
	audioElement.load();
	$audio.detach();
	$audio.remove();
	this.$audio = null;
	this.bufferingPromise = null;
}

// Returns whether the audio is playing.
ximpel.mediaTypeDefinitions.Audio.prototype.mediaIsPlaying = function(){
	return this.state === this.STATE_PLAYING;
}

// Returns whether the audio is paused.
ximpel.mediaTypeDefinitions.Audio.prototype.mediaIsPaused = function(){
	return this.state === this.STATE_PAUSED;
}

// Returns whether the audio is stopped.
ximpel.mediaTypeDefinitions.Audio.prototype.mediaIsStopped = function(){
	return this.state === this.STATE_STOPPED;
}

// Every media item can implement a getPlayTime() method. If this method is implemented by the media item then ximpel will use this method to determine
// how long the media item has been playing. If this method is not implemented then ximpel itself will calculate how long a media item has been playing. Note that
// the media item can sometimes better determine the play time. For instance, if the network has problems causing the audio to stop loading, then ximpel
// would not be able to detect this and use an incorrect play time. An audio media item could still determine the correct play time by looking at the current playback
// time of the audio element. This is exactly what the getPlayTime method of this audio media item does. It returns the play time in miliseconds.
ximpel.mediaTypeDefinitions.Audio.prototype.getPlayTime = function(){
	var audioElement = this.$audio[0];
	if( audioElement.currentTime == 0 ){
		return 0;
	} else{
		return (audioElement.currentTime - this.startTime) * 1000;
	}
}


// In the ximpel playlist there is one source element for each audio. Within this source element multiple sources can be specified by
// using the extensions and types attribute to specify multiple source files. This method takes the custom source element specified in the
// playlist and returns a jquery object containing one or more HTML5 source elements. The returned set of HTML5 source elements can be
// appended to the html5 <audio> element such that the browser can choose wich source it uses.
ximpel.mediaTypeDefinitions.Audio.prototype.getHtmlSourceElements = function( playlistSourceElement ){
	// The name/path of the file (without the file extension)
	var filename = playlistSourceElement.elementAttributes.file;
	
	// The extensions attribute contains a comma seperated list of available file extensions. If the extension attribute
	// has the value: "mp3, wav", then it means that there is a <filename>.mp3 and a <filename>.wav availabe.
	var extensions = playlistSourceElement.elementAttributes.extensions;
	extensions = extensions.replace(/\s/g, "");
	extensionsArray = extensions.split(",");

	// The types attribute contains a comma seperated list of mime types. The first mime type corresponds to the first extension
	// listed in the extensions attribute, the second mime type to the second extension and so on. 
	var types = playlistSourceElement.elementAttributes.types || "";
	types = types.replace(/\s/g, ""); // remove white space characters
	typesArray = types !== "" ? types.split(",") : [];


	// For each of the listed extensions we create a <source> element with a corresponding src attribute and type attribute.
	var $sources = $([]);
	for( var i=0; i<extensionsArray.length; i++ ){
		var type = typesArray[i] || "";
		var src = filename+"."+extensionsArray[i];

		// Check if a media directory was specified, if so the src is made to be relative to this mediaDirectory
		var mediaDirectory = this.player.getConfigProperty("mediaDirectory") || "";
		if( mediaDirectory != "" ){
			src = mediaDirectory + "/" + src; 
		}

		var $source = $('<source />').attr({
			'src': src,
			'type': type
		});
		$sources = $sources.add( $source );
	}

	// return a jquery object containing the source elements.
	return $sources;
}


// Multiple sources can be specified between the <audio></audio> tags. In the playlist the audio definition 
// would look like: <audio><source src="file.mp4" type="audio/mp4" /><source src="file.webm" type="audio/webm" /></audio>
// The determineBestSource() method will decide which of the specified sources can and will be used (if any).
// The source for which the browser estimates that it has the best support will be used, for equal support estimations
// the first mentioned source is chosen.
// 		@pre: each <source> element had a src attribute and the value of that attribute is available through the sources array.
ximpel.mediaTypeDefinitions.Audio.prototype.determineBestSource = function( sources ){
	var audioElement = this.$audio[0];

	// Will have value "maybe", "probably", "unknown" or "" (no support) for each of the sources. Indicating the likelihood for support.
	var sourceSupport = [];

	// For each of the sources determine likelihood for support.
	for( var i=0; i<sources.length; i++ ){
		// For the current <source>, get the "type" attribute that was specified on the <source> element if there was no type attribute then set it to null.
		var typeAttributeValue = sources[i].elementAttributes.type;

		// if no type attribute on <source> was specified then we cannot determine the likelihood for support so we set it to unknown.
		if( !typeAttributeValue ){
			sourceSupport[i] = 'unknown'; 
		} else{
			sourceSupport[i] = audioElement.canPlayType( typeAttributeValue );
		}
	}

	// This steps through all sources and checks if there is a source with support level "probably", which is the highest. If no source has that
	// support-level then we try all sources for support level "maybe" (which is the second highest). When we find a source that matches
	// the current support level, we know it must be the source with the highest support because we step through the support levels from high to low. 
	// Note that this is only an estimation by the browser. So It may be the case that the chosen source turns out to not be supported anyway.
	var supportLevels = ['probably', 'maybe', 'unknown', ''];
	for( var i=0; i<supportLevels.length; i++ ){
		for( var j=0; j<sourceSupport.length; j++ ){
			if( supportLevels[i] === sourceSupport[j] ){
				if( supportLevels[i] === '' ){
					// If we get here it means that the browser probably supports none of the sources.
					ximpel.warn("None of the specified sources seem to be supported!");
				}
				// get only the src attribute from the <source> element
				var srcValue = sources[j].elementAttributes.src; 
				return srcValue || false;
			}
		}		
	}

	ximpel.error("No <source> tag specified for the <audio> element.");
	return false; 
}


ximpel.registerMediaType(
	new ximpel.MediaTypeRegistration( 'audio', ximpel.mediaTypeDefinitions.Audio, [], {
		'allowedAttributes': [],
		'requiredAttributes': [],
		'allowedChildren': ['source'],
		'requiredChildren': ['source']
	} )
);