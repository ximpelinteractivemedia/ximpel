// ########################################################################################################################################################
// The main ximpel namespace. Everything directly attached to the ximpel
// property is globally accessible because the ximpel property is attached
// to the global object. The ximpel property can be considered as the global
// namespace for XIMPEL.
// ########################################################################################################################################################

// Define the namespace for ximpel. This is where all object constructors get attached to, as well as
// any other properties that are needed by ximpel.
var ximpel = {};

// An object to which all media type definitions will be attached.
ximpel.mediaTypeDefinitions = {};

// Each media type has a MediaTypeRegistration() object with meta data about that media type. The meta-data
// includes information such as the tag-name used in the playlist, the allowed children and attributes and
// a pointer to the constructor for that media type. These registration objects are stored ximpel.availableMediaTypes. 
// To construct an instance of a media type called 'video' you can do: 
// 		var videoInstance = new ximpel.availableMediaTypes['video'].constructor();
// Note that this property is attached to the global ximpel namespace. So it can be accessed from anywhere.
ximpel.availableMediaTypes = {};

// A number of tags are supported natively by ximpel in the playlist and config files. 
// These tags cannot be used as tags for custom media types.
ximpel.ximpelTags = ['ximpel', 'playlist', 'subject', 'media', 'description','score', 'variable', 'config', 'leadsTo', 'sequence', 'parallel', 'overlay', 'question', 'questions', 'option', 'source'];

// Define the log prefix for the custom log functions. This will be shown as prefix in a log message when doing ximpel.log();
ximpel.LOG_PREFIX = '[XIMPEL] '






// Here we define a default html element for the ximpel player. All media will be attached to this element.
// Defining it here is a temporary solution, eventually it should be passed somehow (as an arguemnt to ximpelApp or in the playlist file)
ximpel.DEFAULT_PLAYER_ELEMENT = 'ximpel_player';

// Get the jquery wrapped html element that corresponds to the 'specifiedElement' argument.
// If the element is a string that corresponds to the id of an html element, that element is returned as a jquery wrapper.
// If the specified element is a DOM element then a jquery object is returned that wraps the given DOM element.
// If the specified element is a jquery object that matches exactly one DOM element, that jquery wrapper is returned.
// If the specified element does not specify a non ambigious html element, then false is returned.
ximpel.getElement = function( specifiedElement ){
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

// wrapInJquery wraps jquery around a DOM element if needed. When it already is a jquery object then this does nothing.
// Note: rewrapping a jquery object that is already a jquery object, does not do harm but it is claimed that wrapping only
// when needed is 30 or more percent faster then just blindly rewrapping the object as jquery.
ximpel.wrapInJquery = function( obj ){
	return (obj instanceof jQuery) ? obj : $( obj );
}

// Returns true of the given obj is a html DOM element and false otherwise.
ximpel.isElement = function( obj ){
	return obj instanceof HTMLElement;
}

// Returns true of the given obj is a jquery object and false otherwise.
ximpel.isJQueryObject = function( obj ){
	return obj instanceof jQuery;
}



// A function factory that returns logging functions that log information in different ways. 
// For example logging a message as error or as a debug message. 
// @param logFunc - The function used for logging.
// @param logPrefix - the prefix shown in front of each log line.
// @param logType - the logType shown as part of the log line (ie. info, warning, error, etc)
ximpel.logFunctionFactory = function( logFunc, logPrefix, logType ){
	return function( output ){
		if( ximpel.isObject( output ) ){
			logFunc( output );
		} else{
			logFunc( logPrefix + "-" + logType + "- " + output );
		}
	}
}

// We use the logFunctionFactory() to create ximpel specific logging functions. The bind()
// calls are  needed because the console functions expect the this keyword to refer to the 
// console object. We use these ximpel specific logging functions so that it is obvious that
// an error or log information belongs to the Ximpel application.
ximpel.error = 	ximpel.logFunctionFactory( console.error.bind(console), ximpel.LOG_PREFIX, "ERROR" );
ximpel.warn = 	ximpel.logFunctionFactory( console.warn.bind(console), ximpel.LOG_PREFIX, "WARNING" );
ximpel.debug = 	ximpel.logFunctionFactory( console.debug.bind(console), ximpel.LOG_PREFIX, "DEBUG" );
ximpel.log = 	ximpel.logFunctionFactory( console.log.bind(console), ximpel.LOG_PREFIX, "INFO" );


// Find out if a variable is an object.
ximpel.isObject = function( obj ){
	return obj === Object( obj );
}







ximpel.filterArrayOfObjects = function( arrayOfObjects, property, value ){
	var filteredArray = arrayOfObjects.filter( function( obj ){
		return obj[property] === value;
	});
	return filteredArray;
}






// This method takes a MediaTypeRegistration() object as an argument. If the registration is a valid registration,
// then the media type registration object will be stored in ximpel.avilableMediaTypes[mediaTypeId]. The 
// registration object contains required information such as a pointer to the constructor function to create
// instances of the media type and information required for the parser (tagnames, allowed child-tags, allowed attributes)
// A registration is valid if:
// - It has a mediaTypeId (ie. the tagname to be used in the playlist file).
// - The mediaTypeId is not equal to one of the native ximpel tags (such as <score> or <media>.
// - The mediaTypeId is not used by another mediaType (if it is then the last registration will fail)
ximpel.registerMediaType = function( mediaTypeRegistrationObject ){
	// Make sure the media type has its 'mediaTypeId' property set.
	if( ! mediaTypeRegistrationObject.hasOwnProperty('mediaTypeId') ){
		ximpel.warn('Media type registration failed! The media type registration object has no "mediaTypeId" property!');
		return false;
	}
	// Make sure that the media type does not use a tag-name that is already part of the native ximpel XML tags.
	var forbiddenTags = ximpel.ximpelTags;
	if( $.inArray( mediaTypeRegistrationObject.mediaTypeId, forbiddenTags ) > -1 ){
		ximpel.warn('Media type registration failed! The media type uses a tag-name ('+mediaTypeRegistrationObject.mediaTypeId+') that is already in use by ximpel!');
		return false;
	}
	// Make sure that the mediaTypeId of the media type has not already been used by another media type.
	var registeredMediaTypeNames = Object.getOwnPropertyNames( ximpel.availableMediaTypes );
	if( $.inArray( mediaTypeRegistrationObject.mediaTypeId, registeredMediaTypeNames ) > -1 ){
		ximpel.warn('Media type registration failed! The media type uses a \'mediaTypeId\' (\'' + mediaTypeRegistrationObject.mediaTypeId + '\') that is already used by another media type.');		
	}

	ximpel.availableMediaTypes[mediaTypeRegistrationObject.mediaTypeId] = mediaTypeRegistrationObject;
}