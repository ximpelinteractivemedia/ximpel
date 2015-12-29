// Audio
// The Audio object implements a media type for XIMPEL to use. This media type is one of the core media types that ship with
// XIMPEL by default. MediaTypes are a sort of plugins. Anyone can create their own media type. None of the media types
// (not even the core media types) have a special integration with XIMPEL. There are just a number of requirements that should
// be fulfilled to create a MediaType (See the documentation for more info). 
//
// Notes:
// - The Audio object definition is added to the: ximpel.mediaTypeDefinitions namespace, but this is not required, it
//   could be stored in any variable.
// - The MediaType gets a new instance of ximpel.MediaType() as prototype. This gives the media type a number of predefined 
//   methods. For instance this implements a play(), pause() and stop() method which XIMPEL will call. These methods in turn
//   will call the mediaPlay(), mediaPause() and mediaStop() methods that we implement in this Audio object.
// - Besides the implementation of some required methods of a media type, the media type must be registered. This is
//   done at the bottom using the ximpel.registerMediaType() function.
//
// ##################################################################################################
// ##################################################################################################
// ##################################################################################################

// Todo:
// - Check for loading failures and handle them properly (for example: maybe add an event to the MediaType() prototype
//   object which this Audio object can throw so that XIMPEL can listen for the event and act upon the error).

// The constructor function which XIMPEL will use to create instances of our media type. Four arguments
// should be passed to the constructor function:
// - customElements - contains the child elements that were within the <audio> tag in the playlist.
// - customAttributes - contains the attributes that were on the <audio> tag in the playlist.
// - $parentElement - The element to which the audio will be appended (the ximpel player element).
// - player - A reference to the player object, so that the media type can use functions from the player.
ximpel.mediaTypeDefinitions.Audio = function( customElements, customAttributes, $parentElement, player ){
	// The custom elements that were added inside the <audio> tag in the playlist (<source> for example).
	this.customElements = customElements;

	// The custom attributes that were added to the <audio> tag in the playlist.
	this.customAttributes = customAttributes;

	// The XIMPEL player element to which this audio can attach itself (this is the element to which all media DOM nodes will be attached).
	this.$attachTo = $parentElement;

	// A reference to the XIMPEL player object. The media type can make use of functions on the player object.
	this.player = player;

	// The point in the audio from which the audio should start playing (if not specified in the playlist then it is set to 0.)
	// The statTime should be in seconds but can be a floating point number.
	this.startTime = customAttributes['startTime'] || 0;

	// will hold the audio element (or more specifically a jquery selector that points to the HTML element).
	this.$audio = null;

	// Get the <source> element that was specified in the playlist for this audio (should be one element)
	var playlistSourceElement = ximpel.filterArrayOfObjects( customElements, 'elementName', 'source' )[0];

	// Get a jquery object that selects all the html source elements that should be added to the audio element.
	this.$htmlSourceElements = this.getHtmlSourceElements( playlistSourceElement );

	// The buffering promise will hold a jQuery promise that resolves when the buffering is finished.
	// The state of the jquery promise can be checked to find out if the buffering has finished.
	this.bufferingPromise = null;

	// State of the media item.
	this.state = this.STATE_STOPPED;
}
ximpel.mediaTypeDefinitions.Audio.prototype = new ximpel.MediaType();
ximpel.mediaTypeDefinitions.Audio.prototype.STATE_PLAYING = 'state_audio_playing';
ximpel.mediaTypeDefinitions.Audio.prototype.STATE_PAUSED = 'state_audio_paused';
ximpel.mediaTypeDefinitions.Audio.prototype.STATE_STOPPED = 'state_audio_stopped';



// The mediaPlay() is one of the required methods for a media type. XIMPEL calls the play() method on the
// prototype which in turn calls this mediaPlay() method.
ximpel.mediaTypeDefinitions.Audio.prototype.mediaPlay = function(){
	// Ignore this call if this media item is already playingor resume playback if its paused.
	if( this.state === this.STATE_PLAYING ){
		return;
	} else if( this.state === this.STATE_PAUSED ){
		this.resumePlayback();
		return;
	}

	// Indicate that the media item is in a playing state now.
	this.state = this.STATE_PLAYING;

	// Create the audio element but don't attach it to the DOM yet and don't start loading untill we call .load()
	var $audio = this.$audio = $('<audio />', {
		'preload': 'none'
	});
	var audioElement = $audio[0];

	// Add the HTML source elements to the audio element. (the browser will pick which source to use once the audio starts loading).
	$audio.append( this.$htmlSourceElements );

	// Every media type which has an ending should call the .ended() method when the media has ended. 
	// ended() is a method on the prototype. By calling the ended() method, all handler functions registered
	// with .addEventHandler('end', handlerFunc) will be called. Here we indicate that the .ended() method will be
	// called when the 'ended' event on the audio element is triggered (ie. when the audio has nothing more to play).
	$audio.on('ended', this.ended.bind(this) );
	
	// Set an event listener (that runs only once) for the loadedmetadata event. This waits till the metadata of the audio
	// (duration) has been loaded and then executes the function.
	$audio.one("loadedmetadata", function(){
		// This function is executed once the metadata of the audio has been loaded...
		// Set the current position in the audio to the appropriate startTime (this can only be done after the metadata is loaded).
		audioElement.currentTime = this.startTime;

		// Attach the audio element to the DOM.
		$audio.appendTo( this.$attachTo );
	}.bind(this) );

	// Next we create a jquery deferred object (promise) and we give it a function that runs when the deferred
	// object is resolved. The deferred will be resolved as soon as the canplaythrough event is thrown by the audio element.
	var bufferingDeferred = new $.Deferred();
	bufferingDeferred.done( function(){
		// this functions runs when the deferred is resolved (ie. the initial buffering is finished)...
		// When the buffering is done and the media item is still in a playing state then play the 
		// media item, otherwise do nothing. It may be the case that the media item is in a non-playing
		// state when the pause() method has been called during the buffering.
		if( this.state === this.STATE_PLAYING ){
			audioElement.play();
		}
	}.bind(this) );


	// Set an event listener for the canplaythough event. This waits until enough of the audio has been loaded 
	// to play without stuttering (as estimated by the browser). Note that the canplaythrough event has some browser 
	// differences. Some browsers call it multiple times and others call it only once. It is also not clear whether
	// canplaythrough means the audio has enough data to play from the beginning or has enough data to play from 
	// the audio's current playback time. This means that the audio may not be preloaded properly even when the 
	// canplaythrough event is thrown. However, every major browser calls it once at least, so we just listen
	// for the event and can only hope that enough of the audio has been buffered to start playing smoothly.
	$audio.one("canplaythrough", function(){
		// The audio is preloaded. We resolve the bufferingDeferred object so that the registered callbacks are 
		// called (the callbacks registered with bufferingDeferred.done() bufferingDeferred.fail() etc)
		bufferingDeferred.resolve();
	}.bind(this) );

	// Attach a handler function for when the audio fails to load.
	$audio.error( function(e){
		ximpel.warn("Audio.mediaPlay(): failed to buffer the audio: '" + audioElement.src + "'.");
		bufferingDeferred.reject();
	}.bind(this) );

	// start loading the audio now.
	audioElement.load();

	this.bufferingPromise = bufferingDeferred.promise();
	return this.bufferingPromise;
}



// The resumePlayback() method resumes playback from a paused state.
ximpel.mediaTypeDefinitions.Audio.prototype.resumePlayback = function(){
	// Indicate that the media item is in a playing state now.
	this.state = this.STATE_PLAYING;
	if( this.bufferingPromise.state() === "resolved" ){
		this.$audio[0].play();
	}
}



// The mediaPause() is one of the required methods for a media type. XIMPEL calls the pause() method on the
// prototype which in turn calls this mediaPause() method.
ximpel.mediaTypeDefinitions.Audio.prototype.mediaPause = function(){
	// Ignore this pause request if the audio is not in a playing state.
	if( this.state !== this.STATE_PLAYING ){
		return;
	}
	this.state = this.STATE_PAUSED;

	// Pause the audio element.
	this.$audio[0].pause();
}



// The mediaStop() is one of the required methods for a media type. XIMPEL calls the stop() method on the
// prototype which in turn calls this mediaStop() method. This method stops the audio entirely without being 
// able to resume later on. After this method the audio playback pointer has been reset to its start position
// and the audio element is removed such that the browser will not proceed loading the audio and nothing is
// visible anymore.
ximpel.mediaTypeDefinitions.Audio.prototype.mediaStop = function(){
	// Ignore this stop request if the audio is already in a stopped state.
	if( this.state === this.STATE_STOPPED ){
		return;
	}
	// Indicate that the media item is now in a stopped state.
	this.state = this.STATE_STOPPED;

	var $audio = this.$audio;
	var audioElement = this.$audio[0];
	audioElement.pause();

	// We need to tell the audio to stop loading. We do this by setting the src of the audio element to "" and
	// then tell it to start loading that. Because "" is not a valid src browsers will stop loading the audio
	// element entirely.
	audioElement.src = "";
	audioElement.load();

	// We detach and remove the audio element. We just create it again when the play method is called.
	$audio.detach();
	$audio.remove();

	// Make sure we are back in the state the media item was in before it started playing.
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



// Every media item can implement a getPlayTime() method. If the media type implements this method then 
// ximpel will use this method to determine how long the media item has been playing. If this method is 
// not implemented then ximpel itself will calculate how long a media item has been playing. Note that
// the media item can sometimes better determine the play time. For instance, if the network has problems
// causing the audio to stop loading, then ximpel would not be able to detect this and use an incorrect 
// play time. An audio media item could still determine the correct play time by looking at the current 
// playback time of the audio element (something that the core of ximpel has no access to). This is exactly 
// what the getPlayTime method of this audio media item does. It returns the play time in miliseconds.
ximpel.mediaTypeDefinitions.Audio.prototype.getPlayTime = function(){
	var audioElement = this.$audio[0];
	if( audioElement.currentTime == 0 ){
		return 0;
	} else{
		return (audioElement.currentTime - this.startTime) * 1000;
	}
}



// In the ximpel playlist there is one source element for each <audio>. Within this source element multiple sources can 
// be specified by using the extensions and types attribute to specify multiple source files. This method takes the 
// custom source element specified in the playlist and returns a jquery object containing one or more HTML5 source 
// elements. The returned set of HTML5 source elements can be appended to the html5 <audio> element such that the 
// browser can choose wich source it uses.
ximpel.mediaTypeDefinitions.Audio.prototype.getHtmlSourceElements = function( playlistSourceElement ){
	// The source element in the playlist looks like this: 
	// <source file="somefilename" extensions="mp3, ogg" types="audio/mp3, audio/ogg" />
	// The attributes "file", "extensions" and "types" are accesible via: playlistSourceElement.elementAttributes.<attributename>

	// The name/path of the file (without the file extension)
	var filename = playlistSourceElement.elementAttributes.file;
	
	// The extensions attribute contains a comma seperated list of available file extensions. If the extension attribute
	// has the value: "mp3, wav", then it means that there is a <filePath>.mp3 and a <filePath>.wav availabe.
	var extensions = playlistSourceElement.elementAttributes.extensions || "";
	extensions = extensions.replace(/\s/g, ""); // remove white space characters
	extensionsArray = extensions.split(",");    // split the comma seperated extensions into an array.

	// The types attribute contains a comma seperated list of mime types. The first mime type corresponds to the first extension
	// listed in the extensions attribute, the second mime type to the second extension and so on. 
	var types = playlistSourceElement.elementAttributes.types || "";
	types = types.replace(/\s/g, "");
	typesArray = types !== "" ? types.split(",") : [];

	// For each of the listed extensions we create a <source> element with a corresponding src attribute and type attribute.
	var $sources = $([]);
	for( var i=0; i<extensionsArray.length; i++ ){
		var type = typesArray[i] || "";
		var src = filename+"."+extensionsArray[i];

		// Check if a media directory was specified in the XIMPEL config, if so the src is made to be relative to this mediaDirectory
		var mediaDirectory = this.player.getConfigProperty("mediaDirectory") || "";
		if( mediaDirectory != "" ){
			src = mediaDirectory + "/" + src; 
		}

		// Create the actual <source> element with a src and type attribute.
		var $source = $('<source />').attr({
			'src': src,
			'type': type
		});

		// Add the created source to a jquery selected that will select all source elements.
		$sources = $sources.add( $source );
	}

	// return a jquery object containing the source elements.
	return $sources;
}




// Finally we register the media type to XIMPEL such that XIMPEL knows some information about the media type.
// Information for the parser (tagname, allowedAttributes, requiredAttributes, allowedElements and requiredElements)
// and information for the XIMPEL player (the constructor such that it can create instances of the media type)
var mediaTypeRegistrationObject = new ximpel.MediaTypeRegistration( 
	'audio', 								// = the media type ID (and also the tagname used in the playlist)
	ximpel.mediaTypeDefinitions.Audio, 		// a pointer to the constructor function to create instances of the media type.
	{
		'allowedAttributes': [],			// the attributes that are allowed on the <audio> tag (excluding the attributes that are available for every media type like duration).	
		'requiredAttributes': [],			// the attributes that are required on the <audio> tag.
		'allowedChildren': ['source'],		// the child elements that are allowed on the <audio> tag.
		'requiredChildren': ['source']		// The child elements that are required on the <audio> tag.
	}
);

ximpel.registerMediaType( mediaTypeRegistrationObject );
