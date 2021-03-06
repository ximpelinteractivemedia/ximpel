// XimpelApp()
// XimpelApp is the main object to create XIMPEL players. For each XIMPEL player that you want
// to add on your page you create an instance of XimpelApp. This object can load playlist
// and config files from the server, then ask the parser to parse the XML documents and create
// a playlist that plays the PlaylistModel anc ConfigModel that the parser produced. So
// XimpelApp manages everything to start the player. When it has started the Player() lobject
// does everything.
// ########################################################################################################################################################

ximpel.XimpelApp = function( appId, playlistFile, configFile, options ){
	var options = options || {}; // prevents errors when no options are specified.
	var ximpelAppModel = this.ximpelAppModel = new ximpel.XimpelAppModel();

	// There is one main element to which XIMPEL will attach all DOM elements. This element can 
	// be specified using the "appElement" option, if not specified XIMPEL will create an element.
	// Additionally, you can specify a "parentElement" option. This will cause the main ximpel element
	// (whether you specified one explicitly or one is created) to be attached to that "parentElement".

	// Get the jquery selector for the parent element to which the appElement will be attached (null if not specified)	
	ximpelAppModel.$parentElement = ximpel.getElement( options.parentElement ) || ximpelAppModel.$parentElement;	

	// A unique ID for this specific XIMPEL app (is used for running multiple ximpel apps on one page).
	ximpelAppModel.appId = appId;

	// Create a ximpelApp view, without rendering it yet.	
	this.ximpelAppView = new ximpel.XimpelAppView( ximpelAppModel, options.appElement, options.appWidth, options.appHeight );

	// Will hold the ximpel.Player() object which plays the ximpel presentation.
	this.ximpelPlayer = null;

	// Create a Parser object, which can parse playlist and xml files and create a playlist and config model.
	this.parser = new ximpel.Parser();

	// The path the the playlist file (relative to the page that includes this javascript file).
	ximpelAppModel.playlistFile = playlistFile;

	// The path the the config file (relative to the page that includes this javascript file).
	ximpelAppModel.configFile = configFile;

	// Will hold the retrieved XML content for the specified playlist file.
	ximpelAppModel.playlistXmlDocument = null;

	// Will hold the retrieved XML content for the specified config file.
	ximpelAppModel.configXmlDocument = null;						
	
	// Will hold the config model that is used by this ximpel Player.
	ximpelAppModel.configModel = null;

	// Will hold the playlist model that is used by this ximpel Player.
	ximpelAppModel.playlistModel = null;

	// Will hold a jquery promise object, which indicates whether the ximpel files (playlist/config) have been loaded.
	ximpelAppModel.filesRequestPromise = null;

	// Will hold a jquery promise object, indicating whether specifically the playlist file has been loaded.
	ximpelAppModel.playlistRequestPromise = null;

	// Will hold a jquery promise object, indicating whether specifically the config file has been loaded.
	ximpelAppModel.configRequestPromise = null;

	// This timeout handler is used to set and cancel timeouts for hiding the controls bar.
	ximpelAppModel.hideControlsTimeoutHandler = null;

	// This timeout handler is used to set and cancel timeouts for hiding the mouse cursor.
	ximpelAppModel.hideCursorTimeoutHandler = null;

	// This holds the state of the XIMPEL app. This indicates if the XimpelApp is still loading or not.
	ximpelAppModel.appReadyState = this.APP_STATE_LOADING;

	// this indicates the state of the Player (whether it is playing or paused or stopped.)
	ximpelAppModel.playerState = this.ximpelAppModel.PLAYER_STATE_STOPPED;
}



// The load function does several things:
// - It retrieves the playlist (and config if specified) file from the server.
// - It parses these files, giving back a playlist and config model (ie an in-memory representation of the playlist and config files).
// - It creates a Player object which makes use of these playlist and config models.
// Return value: A jQuery promise object which is resolved when the playlist (and if applicable also the config file) has been loaded.
ximpel.XimpelApp.prototype.load = function( options ){
	var ximpelAppModel = this.ximpelAppModel;
	var options = options || {};
	var autoPlay = options.autoPlay === false ? false : true;

	// First we send a request to load the files from the server.  We get back a jquery promise object and store it.
	ximpelAppModel.filesRequestPromise = this.loadFiles( ximpelAppModel.playlistFile, ximpelAppModel.configFile );

	// Then we specify what will be done when the request finishes (ie. when the promise is resolved). Since this is the first callback
	// function attached to the promise object, it will also be the first to execute. This guarantees that our own callback function is
	// executed before any callback function defined by the caller of .load()
	ximpelAppModel.filesRequestPromise.done( function( playlistStatus, configStatus ){
		// Store the resulting XMLDoc of the playlist file.
		ximpelAppModel.playlistXmlDocument = playlistStatus[0];

		// Store the resulting XMLDoc of the config file if a config file was specified.
		// configStatus[0] may not exist if no config file was specified.
		ximpelAppModel.configXmlDocument = configStatus ? configStatus[0] : null; 

		// We parse the content of the loaded files. parseResult will have the form: {'playlist':<PlaylistModel>, 'config':<configModel>}
		// Even if no config file was specified, there will still be a config model filled with default values for a config model.
		var parseResult = this.parse( ximpelAppModel.playlistXmlDocument, ximpelAppModel.configXmlDocument );
		if( !parseResult ){
			ximpel.error("XimelApp.load(): No XIMPEL player was created because the playlist or config file was invalid.");
			return false;
		}

		// Store the config model and the playlist model.
		ximpelAppModel.playlistModel = parseResult['playlist'];
		ximpelAppModel.configModel = parseResult['config'];

		// We then create a player and pass to it the playlist and config models which will specify what the player will do.
		this.ximpelPlayer = new ximpel.Player( this.getPlayerElement(), parseResult['playlist'], parseResult['config'] );

		// We set the  appReadyState to the ready state to indicate loading is finished and the player is ready.
		this.ximpelAppModel.appReadyState = this.ximpelAppModel.APP_READY_STATE_READY;

		// Register the functions to be executed when the play/pause/stop buttons are clicked.
		this.ximpelAppView.registerPlayHandler( this.startPlayer.bind(this) );
		this.ximpelAppView.registerPauseHandler( this.pausePlayer.bind(this) );
		this.ximpelAppView.registerStopHandler( this.stopPlayer.bind(this) );

		// Render the view (this adds some DOM elements to the main ximpel element, including the controls)
		this.ximpelAppView.render( ximpelAppModel.$parentElement );

		// Tell the player to start playing immediately if autoPlay is true.
		// If its false then the user should click the play button to start playing.
		if( autoPlay === true ){
			this.startPlayer();

			// Update the controls.
			//this.ximpelAppView.renderControls();
		}
	}.bind(this) );

	// We return the "loadFilesRequest" promise object so that the caller of the load() method can also attach callback functions to it.
	return ximpelAppModel.filesRequestPromise;
}



// Load the given playlistFile and configFile (if specified) from the server.
// Return value: a jquery Promise. The promise object is used to keep track of the status of the
// 				 request. Handler functions can be attached to it to react upon the request succeeding or failing.
ximpel.XimpelApp.prototype.loadFiles = function( playlistFile, configFile, options ){
	var ximpelAppModel = this.ximpelAppModel;
	var options = options || {};

	// Make the actual AJAX request for the playlist XML file.
	ximpelAppModel.playlistRequestPromise = this.requestXmlFile( playlistFile ).fail( function( jqXHR, textStatus, errorThrown ){
		ximpel.error("XimpelApp.loadFiles(): Failed to load the playlist file (" + playlistFile + ") from the server or the XML syntax is invalid (HTTP status='" + jqXHR.status + " " + jqXHR.statusText + "', message='" + textStatus + "')");
	}.bind(this) );

	// If a configFile has been specified then also make an ajax request for the config XML file.
	if( configFile ){
		ximpelAppModel.configRequestPromise = this.requestXmlFile( configFile ).fail( function( jqXHR, textStatus, errorThrown ){
			ximpel.error("XimpelApp.loadFiles(): Failed to load the config file (" + configFile + ") from the server or the XML syntax is invalid! (HTTP status='" + jqXHR.status + " " + jqXHR.statusText + "', message='" + textStatus + "')");
		}.bind(this) );
	}

	// $.when() returns a promise that is resolved when both the playlistRequestPromise and the configRequestPromise are resolved.
	// Note that if no config file request was made and thus configRequestPromise is null, configRequest is treated
	// as a resolved promise and thus $.when() will only wait for playlistRequestPromise to resolve.
	// We return the combined jquery Promise object, so that the caller of loadFiles() can attach callback handlers to it.
	return $.when( ximpelAppModel.playlistRequestPromise, ximpelAppModel.configRequestPromise );
}



// Load an xml file with the specified url from the server. 
ximpel.XimpelApp.prototype.requestXmlFile = function( fileUrl, options ){
	var options = options || {};

	var xmlRequest = $.ajax({
		type: "GET",
		url: fileUrl,
		dataType: "xml",
		cache: false // for during development, so that we always get an up-to-date version
	});

	// Return a jquery XHR object (which looks alot like a a jquery Promise object)
	// This can be used to keep track of the status of a request.
	return xmlRequest;
}



// This method takes the playlistXml content and (if it exists) the configXml content and parses it to return
// a PlaylistModel object and a ConfigModel object.
// Return value: an object with format: {'playlist':<PlaylistModel>, 'config':<configModel>}
//               or false if parsing failed.
ximpel.XimpelApp.prototype.parse = function( playlistXml, configXml ){
	var ximpelAppModel = this.ximpelAppModel;
	
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



// Returns the main player element that the player uses to attach DOM elements to. (this is
// not the same as the main ximpel element, the player element is a descendant of the main ximpel element)
ximpel.XimpelApp.prototype.getPlayerElement = function(){
	return this.ximpelAppView.getPlayerElement();
}



// Tell the Player to start playing.
ximpel.XimpelApp.prototype.startPlayer = function(){
	if( this.ximpelAppModel.appReadyState !== this.ximpelAppModel.APP_READY_STATE_READY ){
		ximpel.warn("XimpelApp.startPlayer(): XimpelApp.startPlayer(): cannot start player when app is not ready yet.");
		return;
	} else if( this.ximpelAppModel.playerState !== this.ximpelAppModel.PLAYER_STATE_PAUSED && this.ximpelAppModel.playerState !== this.ximpelAppModel.PLAYER_STATE_STOPPED ){
		ximpel.warn("XimpelApp.startPlayer(): cannot start player when the player is not paused or stopped.");
		return;
	}

	this.ximpelAppModel.playerState = this.ximpelAppModel.PLAYER_STATE_PLAYING;
	this.ximpelPlayer.play();
	this.ximpelAppView.renderControls();
}



// Tell the Player to pause.
ximpel.XimpelApp.prototype.pausePlayer = function(){
	if( this.ximpelAppModel.appReadyState !== this.ximpelAppModel.APP_READY_STATE_READY ){
		ximpel.warn("XimpelApp.pausePlayer(): cannot pause player when app is not ready yet.");
		return;
	} 

	if( this.ximpelAppModel.playerState === this.ximpelAppModel.PLAYER_STATE_PLAYING ){
		this.ximpelAppModel.playerState = this.ximpelAppModel.PLAYER_STATE_PAUSED;
		this.ximpelPlayer.pause();
	} else if( this.ximpelAppModel.playerState === this.ximpelAppModel.PLAYER_STATE_PAUSED ){
		ximpel.warn("XimpelApp.pausePlayer(): cannot pause player when the player is already paused.");
	} else{
		ximpel.warn("XimpelApp.pausePlayer(): cannot pause player when the player is stopped.");
		return;
	}
	this.ximpelAppView.renderControls();
}



// Tell the Player to start playing.
ximpel.XimpelApp.prototype.stopPlayer = function(){
	if( this.ximpelAppModel.appReadyState !== this.ximpelAppModel.APP_READY_STATE_READY ){
		ximpel.warn("XimpelApp.stopPlayer(): cannot stop player when app is not ready yet.");
		return;
	} else if( this.ximpelAppModel.playerState !== this.ximpelAppModel.PLAYER_STATE_PLAYING && this.ximpelAppModel.playerState !== this.ximpelAppModel.PLAYER_STATE_PAUSED ){
		ximpel.warn("XimpelApp.stopPlayer(): cannot stop player when the player is already stopped.");
		return;
	}
	this.ximpelAppModel.playerState = this.ximpelAppModel.PLAYER_STATE_STOPPED;
	this.ximpelPlayer.stop();
	this.ximpelAppView.renderControls();
}



// Returns the width of the main XIMPEL element.
ximpel.XimpelApp.prototype.getAppElementWidth = function(){
	var width = this.ximpelAppModel.$appElement.width();
}



// Returns the height of the main XIMPEL element.
ximpel.XimpelApp.prototype.getAppElementHeight = function(){
	var height = this.ximpelAppModel.$appElement.height();
}
