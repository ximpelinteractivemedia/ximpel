// ##################################################################################################
// ##################################################################################################
// ##################################################################################################
ximpel.mediaTypeDefinitions.Audio = function( customElements, customAttributes, $parentElement ){

	// The custom elements that were added inside the <audio> tag in the playlist (if any).
	this.customElements = customElements;

	// The custom attributes that were added to the <audio> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this audio can attach itself (this is the element to which all media DOM nodes will be attached).
	this.attachTo = $parentElement;

	// The point in the audio from which the audio should start playing (if not specified in the playlist then it is set to 0.)
	this.startTime = customAttributes['startTime'] || 0;

	// The number of seconds the audio should play from the startTime point onward. (if not specified it will be set to 0 which means: play till the end.)
	this.duration = customAttributes['duration'] || 0; 

	// This is the jquery wrapper for the audio element which is to be played. 
	this.$audio = $('<audio />', {
		'preload': 'none',
		'autoplay': false,
		'controls': true,
	});

	// Get an array with the <source> elements that were specified in the playlist.
	this.sources = ximpel.filterArrayOfObjects( customElements, 'elementName', 'source' );

	// Get the source (from among the sources specified in the playlist) that is most likely to have the best suppport.
	this.audioSource = this.determineBestSource( this.sources );

	// Set the source of the audio. Note that this does not preload the audio yet as we have set
	// the 'preload' property of the audio element to 'none'.
	this.$audio.attr( 'src', this.audioSource );
}
ximpel.mediaTypeDefinitions.Audio.prototype = new ximpel.MediaType();
ximpel.mediaTypeDefinitions.Audio.prototype.mediaTypeId = 'audio';




ximpel.mediaTypeDefinitions.Audio.prototype.mediaPlay = function(){
	var $audio = this.$audio;
	var audioElement = $audio[0];
	
	// Append the audio element to the DOM on the specified parentElement.
	$audio.appendTo( this.attachTo );
	
	// Tell the audio element to start playing the audio file.	
	audioElement.play();
}

ximpel.mediaTypeDefinitions.Audio.prototype.mediaPause = function(){
	var audioElement = this.$audio[0];

	// Tell the audio element to pause the audio file.
	audioElement.pause();
}


ximpel.mediaTypeDefinitions.Audio.prototype.mediaStop = function(){
	var $audio = this.$audio;
	var audioElement = $audio[0];
	
	// Tell the audio element to pause playing.
	audioElement.pause();

	// Remove the audio element from the dom.
	$audio.remove();
}


ximpel.mediaTypeDefinitions.Audio.prototype.mediaPreload = function(){
	var $audio = this.$audio;
	var audioElement = $audio[0];
	var deferred = new $.Deferred();
	
	// Set an event listener (that runs only once) for the loadedmetadata event. This waits till the metadata (duration, videoWidth, videoHeight, etc) has been loaded.
	$audio.one("loadedmetadata", function(){
		console.log("loadedmetadata of audio object");
		// Set the current position in the audio to the appropriate startTime (can only be done after the metadata is loaded).
		audioElement.currentTime = this.startTime;
	}.bind(this) );

	// Set an event listener for the canplaythough event. This waits until enough of the audio has been loaded to play without stuttering (as estimated by the browser).
	$audio.one("canplaythrough", function(){
		console.log( "canplaythrough of audio object" );

		// The audio is preloaded. We resolve the deferred object so that the registered callbacks are called (the callbacks registered with .done() .succeed() etc)
		deferred.resolve();
	}.bind(this) );

	// Attach an error event handler. This will trigger if the audio fails to load for example because the specified source is invalid.
	$audio.error( function( e ){
		ximpel.warn("failed to preload audio!");
		deferred.reject(); // this will trigger any .fail() handlers that the caller of preload() may have attached to the promise.
	}.bind(this) );



	// Start preloading the audio file
	audioElement.load();
    return deferred.promise();
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
				//console.log("sourceSupport=" + sourceSupport[j] + ", " + srcValue );
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