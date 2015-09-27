// ########################################################################################################################################################
// The XimpelApp..... description... comes later...
// ########################################################################################################################################################

// TODO:


// ############################################################################
ximpel.XimpelApp = function( playlistFile, configFile, options ){
	var options = options || {}; // prevents errors when no options are specified.
	var playerElement = options.playerElement || null;
	var parentPlayerElement = options.parentPlayerElement || null;

	// The $playerElement is a jquery wrapped DOM object that will contain the html content of the presentation. In otherwords all media items,
	// overlays, question forms, etc. for this presentation will be attached to the $playerElement.
	this.$playerElement = this.getElement( playerElement ) || this.createXimpelElement( parentPlayerElement, playerElement );

	// The path the the playlist file (relative to the page that includes this javascript file).
	this.playlistFile = playlistFile;

	// The path the the config file (relative to the page that includes this javascript file).
	this.configFile = configFile;

	// The retrieved XML content for the specified playlist file.
	this.playlistXmlDocument = null;

	// The retrieved XML content for the specified config file.
	this.configXmlDocument = null;						
	
	// The ximpel.Player() object which plays the ximpel presentation.
	this.ximpelPlayer = null;

	// Create a Parser object, which can parse playlist and xml files and create a playlist and config model.
	this.parser = new ximpel.Parser();

	// A jquery promise object, which indicates whether the ximpel files (playlist/config) have been loaded.
	this.filesRequestPromise = null;

	// A jquery promise object, indicating whether specifically the playlist file has been loaded.
	this.playlistRequestPromise = null;

	// A jquery promise object, indicating whether specifically the config file has been loaded.
	this.configRequestPromise = null;
}

// A constant indicating the default name to be used for the player element if non is provided.
ximpel.XimpelApp.prototype.DEFAULT_PLAYER_ELEMENT_ID = 'XIMPEL'; 
ximpel.XimpelApp.prototype.PLAYER_ELEMENT_CLASS = 'ximpel'; 



// [PUBLIC] 
// The load function does several things:
// - It retrieves the playlist (and config if specified) file from the server.
// - It parses these files, giving back a playlist and config model (ie an in-memory representation of the playlist and config files).
// - It creates a Player object which makes use of these playlist and config models.
// Return value: A jQuery promise object which is resolved when the playlist (and if applicable also the config file) has been loaded.
ximpel.XimpelApp.prototype.load = function( options ){
	var options = options || {};
	var autoPlay = options.autoPlay === false ? false : true;

	// First we send a request to load the files from the server.  We get back a jquery promise object and store it.
	this.filesRequestPromise = this.loadFiles( this.playlistFile, this.configFile );

	// Then we specify what will be done when the request finishes (ie. when the promise is resolved). Since this is the first callback
	// function attached to the promise object, it will also be the first to execute. This guarantees that our own callback function is
	// executed before any callback function defined by the caller of .load()
	this.filesRequestPromise.done( function( playlistStatus, configStatus ){
		this.playlistXmlDocument = playlistStatus[0];
		this.configXmlDocument = configStatus[0] || null; // configStatus[0] may not exist if no config file was specified.

		// We parse the content of the loaded files. parseResult will have the form: {'playlist':<PlaylistModel-object>, 'config':<configModel-object>}
		// Even if no config file was specified, there were still be a config model filled with default values.
		var parseResult = this.parse( this.playlistXmlDocument, this.configXmlDocument );
		if( !parseResult ){
			ximpel.error("XimelApp.load(): No XIMPEL player was created because the playlist or config was invalid.");
			return false;
		}
		// We then create a player and pass to it the playlist and config models which will specify what the player will do.
		this.ximpelPlayer = new ximpel.Player( this.$playerElement, parseResult['playlist'], parseResult['config'] );

		// Tell the player to start playing immediately if autoPlay is true.
		if( autoPlay === true ){
			this.ximpelPlayer.play();	
		}
	}.bind(this) );

	// Add the CSS class to the ximpel player element.
	if( ! this.$playerElement.hasClass( this.PLAYER_ELEMENT_CLASS ) ){
		this.$playerElement.addClass( this.PLAYER_ELEMENT_CLASS );
	}

	// We return the "loadFilesRequest" promise object so that the caller of the load() method can also attach callback functions to it.
	return this.filesRequestPromise;
}


// [PRIVATE]
// Load the given playlistFile and configFile (if specified) from the server.
// Return value: a jquery Promise. The promise object is used to keep track of the status of the
// 				 request. Handler functions can be attached to it to react upon the request succeeding or failing.
ximpel.XimpelApp.prototype.loadFiles = function( playlistFile, configFile, options ){
	var options = options || {};

	// Make the actual AJAX request for the playlist XML file.
	this.playlistRequestPromise = this.requestXmlFile( playlistFile ).fail( function( error ){
		ximpel.error("Failed to load the playlist file (" + this.playlistFile + ") from the server! (" + error.status + " " + error.statusText + ")");
	}.bind(this) );

	// If a configFile has been specified then also make an ajax request for the config XML file.
	if( configFile ){
		this.configRequestPromise = this.requestXmlFile( configFile ).fail( function( error ){
			ximpel.error("Failed to load the config file (" + this.configFile + ") from the server! (" + error.status + " " + error.statusText + ")");
		}.bind(this) );
	}

	// $.when() returns a promise that is resolved when both the playlistRequestPromise and the configRequestPromise are resolved.
	// Note that if no config file request was made and thus configRequestPromise is null, configRequest is treated
	// as a resolved promise and thus $.when() will only wait for playlistRequestPromise to resolve.
	// We return the combined jquery Promise object, so that the caller of loadFiles() can attach callback handlers to it.
	return $.when( this.playlistRequestPromise, this.configRequestPromise );
}



// [PRIVATE]
// Load an xml file with the specified url from the server. 
ximpel.XimpelApp.prototype.requestXmlFile = function( fileUrl, options ){
	var options = options || {};

	var xmlRequest = $.ajax({
		type: "GET",
		url: fileUrl,
		dataType: "xml",
		cache: false // for during development, so that we always get an up-to-date version
	});

	// Return a jquery XHR object (which is practically the same as a jquery Promise object)
	// This can be used to keep track of the status of a request.
	return xmlRequest;
}



// [PRIVATE]
// This method takes the playlistXml content and (if it exists) the configXml content and parses it to return
// a PlaylistModel object and a ConfigModel object.
ximpel.XimpelApp.prototype.parse = function( playlistXml, configXml ){
	// Tell the parser to parse the playlist and config xml files. 
	var parseResult = this.parser.parse( playlistXml, configXml );

	// parseResult has the form {'playlist': <PlaylistModel>, 'config': <ConfigModel}
	var playlistModel = parseResult['playlist'] || null;
	var configModel = parseResult['config'] || null;

	// If the parser returns something falsy (empty string, null, undefined, false, etc) then the parsing failed.
	if( !playlistModel || !configModel ){
		ximpel.error("XimpelApp.parse(): Failed to parse playlist or config document.");
		return false;
	}

	return parseResult;
}


// [PRIVATE]
// Get the jquery wrapped html element that corresponds to the 'specifiedElement' argument.
// If the specifiedElement is a string that corresponds to the id of an html element, then a jquery obj is returned matching that html element.
// If the specified element is a dom element then a jquery object is returned that wraps the given DOM element.
// If the specified element is a jquery object that matches exactly one DOM element, that specified element is returned.
// If the specified element does not specify a non ambigious html element, then false is returned.
ximpel.XimpelApp.prototype.getElement = function( specifiedElement ){
	if( !specifiedElement ){
		// no specified element argument has been passed, return false: no such element.
		return false;
	} else if( typeof specifiedElement === 'string' || specifiedElement instanceof String ){
		// The specifiedElement argument is a string, if the string is a valid HTML element ID then return that element (jquery wrapped).
		var $el = $('#'+specifiedElement);

		// Check if the jquery obj matches exactly one DOM element, if so we return it.
		if( $el.length === 1 ){
			return $el;
		}
	} else if( ximpel.isElement( specifiedElement) ){
		// The specifiedElement argument is a DOM element, wrap it as jquery and return it.
		return $(specifiedElement);
	} else if( ximpel.isJQueryObject( specifiedElement ) && specifiedElement.length === 1 ){
		// The specified element is a jquery object that matches exactly one html element. Return it...
		return specifiedElement;
	}

	// No (valid) unambigious element was specified, so we return false.
	return false;
}


// [PRIVATE]s
// Create the XIMPEL element. The element will have the ID as specified in "specifiedElementId" or the default name if none is specified.
// If that ID is already in use by another element, then a suffix number will be added to the "specifiedElementId" to get an ID that is not in use.
// The newly created element will be appended to the element that corresponds to the "attachTo" argument or to the <body> if not specified.
// Arg0: attachTo - String  /DOM object/ Jquery wrapped DOM object.
// Arg1: specifiedElementId - String
ximpel.XimpelApp.prototype.createXimpelElement = function( attachTo, specifiedEementId ){
	var specifiedEementId = specifiedEementId || this.DEFAULT_PLAYER_ELEMENT_ID;
	var elementId = specifiedEementId;
	var suffixCounter = 2;
	var parentElement = this.getElement( attachTo ) || $(document.body);

	// Keep trying to generate new element id's until we found an element ID that does not yet exist.
	while( document.getElementById(elementId) ){
		elementId = specifiedEementId + "-" + suffixCounter;
		suffixCounter++;
	}
	
	// We found an elementId that doesn't exist yet, so we create a <div> with that ID.
	var $el = $("<div></div>").attr({'id': elementId});

	// And we append the created element to the element specfied in attachTo.
	$el.appendTo( parentElement );
	return $el;
}
