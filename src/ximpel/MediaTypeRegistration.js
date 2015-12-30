// MediaTypeRegistration()
// The MediaTypeRegistration() object is used when registering a media type to XIMPEL.
// You create an instance of this object and pass it to ximpel.registerMediaType()

// ########################################################################################################################################################

ximpel.MediaTypeRegistration = function( mediaTypeId, mediaTypeConstructor, options ){
	var options = options || {};

	// The mediaTypeId is the unique identifier for the media type. It is also the tag-name of the media type in the playlist file.
	// So If the mediaTypeId is "video" then you add a video media item to the playlist like this: <video>
	this.mediaTypeId = mediaTypeId;

	// The mediaTypeConstructor points to the constructor function of this media type. This is used by the Player() object
	// in order to construct instances of the media type. So if the playlist file has a subject with four <video> tags, then
	// the player will call this constructor four times to make four video objects.
	this.mediaTypeConstructor = mediaTypeConstructor;
	
	// the "allowedAttributes" property specifies which attributes are allowed to be present on the element of this media type in the playlist.
	this.allowedAttributes = options.allowedAttributes || [];

	// the "requiredAttributes" property specifies which attributes must be present on the element of this media type in the playlist.
	this.requiredAttributes = options.reguiredAttributes || [];

	// the "allowedChildren" property specifies which XML elements are allowed be children of this media type element in the playlist file.
	this.allowedChildren = options.allowedChildren || [];

	// the "requiredChildren" property specifies which XML elements must be present as children of this media type element in the playlist file.
	this.requiredChildren = options.requiredChildren || [];
}