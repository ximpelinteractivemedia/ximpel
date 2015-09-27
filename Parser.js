// ########################################################################################################################################################
// The Parser..... description... comes later...
// ########################################################################################################################################################
	// TODO:
	// 		-Check if the shape of an overlay is valid (ie. if square then the "sides" attribute must exist, if rectangle then width and height must exist etc.)

ximpel.Parser = function(){
	// The mediaTypeRegistrations variable is an object that contains the registrations of the media types.
	// This is needed by the parser to know which custom media tags can be used and which child-tags and attributes 
	// are allowed on the custom media tag. It is stored in the form: {'<mediaTypeId>': <MediaTypeRegistrationObject>, ... }
	this.mediaTypeRegistrations = ximpel.availableMediaTypes;

	// Get an array containing the media type ID's (ie. tag names) that are allowed to be used in the playlist.
	this.registeredMediaTags = Object.getOwnPropertyNames( this.mediaTypeRegistrations );
	
	// An object that defines which children are allowed on each of the elements.
	this.validChildren = {
		'ximpel': 	['playlist','config'],
		'playlist': ['subject', 'score'],
		'subject': 	['description', 'media', 'score', 'sequence', 'parallel'],
		'media': 	['parallel', 'sequence'].concat(this.registeredMediaTags), // add the custom media tags to the allowed children of <media>
		'parallel': ['sequence'].concat(this.registeredMediaTags), 	// add the custom media tags to the allowed children of <parallel>
		'sequence': ['parallel'].concat(this.registeredMediaTags), 	// add the custom media tags to the allowed children of <sequence>;
		'overlay': 	['score'],
 		'score': 	[''],
 		'question':	[''],
 		'description': [''],
		'config': [''],
		// We want to define valid children that will apply to each custom media type, we use __MEDIA_TYPE__ for this.
		 '__MEDIA_TYPE__': ['branchquestion', 'overlay', 'score', 'question'], // ie. these tags are valid children for each custom media type.
	}

	// This counter is used to give each media item a unique ID that is used within ximpel to refer to that media item.
	this.mediaIdCounter = 1;
}


// The parse() method takes two xmlDoc objects as argument for the the playlist and config file.
// Return value: 	Object in the form: {'playlist': <playlistModelObject>, 'config': <configModelObject>}
ximpel.Parser.prototype.parse = function( playlistXml, configXml ){
	// Parse the given playlist XML with parseXml(). The result is a Playlist() object or an empty object of it is invalid.
	var playlistParseResult = this.parseXml( playlistXml );
	var playlist = playlistParseResult['playlist'] || null;
	var playlistConfig = playlistParseResult['config'];
	if( !playlist ){
		ximpel.error("Failed to parse the playlist file. The playlist file is invalid.");
		return false;
	}

	// If a config xmlDoc is specified then parse it.
	if( configXml ){
		// Parse the given config XML. The result is a Config() object or an empty object if it is invalid.
		var configParseResult = this.parseXml( configXml );
		var config = configParseResult['config'] || null;
		if( !config ){
			ximpel.error("Failed to parse the config file. The config file is invalid.");
			return false;
		}
	} else{
		// No config XML content specified, so just create a new ConfigModel() object containing the default values.
		var config = new ximpel.ConfigModel();
	}

	// Configuration settings can be defined both in a seperate config file, as well as in a config node within the playlist file. If the 
	// playlist file contained a <config> node, then use these config settings to overwrite the settings specified in the config XML file.
	if( playlistConfig ){
		config.extend( playlistConfig );
	}

	return {'playlist': playlist, 'config': config };

}



// This method parses the given XML document. Depending on the content of the xmlDoc it will return a playlist
// object or a Config object. Or false if the xmlDoc is not a valid ximpel document.
ximpel.Parser.prototype.parseXml = function( rootDomElement ){
	var ximpelNode = rootDomElement.childNodes[0];
	// Check if the XML document is empty.
	if( ! ximpelNode ){
		ximpel.error("Cannot parse the XML contents, the given XML document is empty");
		return false; 
	}
	
	// Make sure the root element is <ximpel>
	if( ximpelNode.nodeName !== 'ximpel' ){
		ximpel.error("Invalid document specified. The Root element must be the <ximpel> element.");
		return false;
	}

	// process the ximpel node.
	var result = this.processXimpelNode( ximpelNode );
	return result;
}



// Parse the ximpel node of a xml DOM tree.
ximpel.Parser.prototype.processXimpelNode = function( domElement ){
	var parentName = domElement.nodeName;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var result = {};

	// The ximpel node can have a playlist child-node, a config child-node, or both. We process each child node..
	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;

		if( childName === 'playlist' ){
			result['playlist'] = this.processPlaylistNode( child );
		} else if( childName === 'config' ){
			result['config'] = this.processConfigNode( child );
		} else{
			ximpel.warn('Invalid child ignored! Element <'+parentName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[parentName].toString() + '.');
		}
	}

	return result;
}



ximpel.Parser.prototype.processPlaylistNode = function( domElement ){
	var parentName = domElement.nodeName;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var playlist = new ximpel.PlaylistModel();
	var firstSubjectIdToPlay = null;

	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;

		if( childName === 'subject' ){
			var subject = this.processSubjectNode( playlist, child );

			// Store the subjectModels under their ID so that they can be retrieved using subjectModels[subjectId]
			playlist.subjectModels[subject.subjectId] = subject;

			// By default, the first subject in the playlist is the one that will be played at the start of the ximpel presentation.
			if( firstSubjectIdToPlay === null ){
				// firstSubjectIdToPlay has not been set yet, so this is the first subject and we store its ID.
				playlist.firstSubjectIdToPlay = subject.subjectId;
			}
		} else if( childName === 'score' ){
			playlist.initialScores.push( this.processScoreNode( playlist, child ) );
		} else{
			ximpel.warn('Invalid child ignored! Element <'+parentName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[parentName].toString() + '.');
		}
	}
	return playlist;
}



ximpel.Parser.prototype.processSubjectNode = function( playlist, domElement ){
	var parentName = domElement.nodeName;
	var parentAttributes = domElement.attributes;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var subject = new ximpel.SubjectModel();

	// Process and store the attributes of the <subject> element.
	for( var i=0; i<parentAttributes.length; i++ ){
		var attributeName = parentAttributes[i].name;
		var attributeValue = parentAttributes[i].value;
		if( attributeName === 'id' ){
			subject.subjectId = attributeValue;
		} else if( attributeName === 'leadsTo' ){
			subject.leadsTo = attributeValue;
		} else{
			ximpel.warn('Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+parentName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Process and store the child elements of the <subject> element.
	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;

		if( childName === 'description' ){
			subject.description = this.processDescriptionNode( playlist, child );
		} else if( childName === 'media' ){
			subject.mediaSequenceModel = this.processMediaNode( playlist, child );
		} else if( childName === 'score' ){
			subject.scoreModifier = this.processScoreNode( playlist, child );
		} else {
			ximpel.warn('Invalid child ignored! Element <'+parentName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[parentName].toString() + '.');
		}
	}


	return subject;
}






ximpel.Parser.prototype.processMediaNode = function( playlist, domElement ){
	var parentName = domElement.nodeName;
	var parentAttributes = domElement.attributes;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var mediaSequenceModel = new ximpel.MediaSequenceModel();

	// Process and store the attributes of the <media> element.
	for( var i=0; i<parentAttributes.length; i++ ){
		var attributeName = parentAttributes[i].name;
		var attributeValue = parentAttributes[i].value;
		if( attributeName === 'order' ){
			mediaSequenceModel.order = attributeValue;
		} else{
			ximpel.warn('Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+parentName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Process and store the child elements of the <media> element.
	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;

		if( $.inArray( childName, this.registeredMediaTags ) > -1 ){
			// The child-node is a registered media item...
			mediaSequenceModel.add( this.processMediaTypeNode( playlist, child ) );
		} else if( childName === 'parallel' ){
			mediaSequenceModel.add( this.processParallelNode( playlist, child ) );
		} else if( childName === 'sequence' ){
			mediaSequenceModel.add( this.processSequenceNode( playlist, child ) );
		} else{
			ximpel.warn('Invalid child ignored! Element <'+parentName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[parentName].toString()  + '.');
		}
	}
	return mediaSequenceModel;
}





ximpel.Parser.prototype.processSequenceNode = function( playlist, domElement ){
	var parentName = domElement.nodeName;
	var parentAttributes = domElement.attributes;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var mediaSequenceModel = new ximpel.MediaSequenceModel();
	
	// Process and store the attributes of the <sequence> element.
	for( var i=0; i<parentAttributes.length; i++ ){
		var attributeName = parentAttributes[i].name;
		var attributeValue = parentAttributes[i].value;
		if( attributeName === 'order' ){
			mediaSequenceModel.order = attributeValue;
		} else{
			ximpel.warn('Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+parentName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Process and store the child elements of the <sequence> element.
	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;

		if( $.inArray( childName, this.registeredMediaTags ) > -1 ){
			// The child-node is a registered media item...
			mediaSequenceModel.add( this.processCustomMediaTypeNode( playlist, child ) );
		} else if( childName === 'parallel' ){
			mediaSequenceModel.add( this.processParallelNode( playlist, child ) );
		} else{
			ximpel.warn('Invalid child ignored! Element <'+parentName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[parentName].toString()  + '.');
		}
	}
	return mediaSequenceModel;
}







ximpel.Parser.prototype.processParallelNode = function( playlist, domElement ){
	var parentName = domElement.nodeName;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var parallelMediaModel = new ximpel.ParallelMediaModel();

	// Process and store the child elements of the <parallel> element.
	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;
		
		if( $.inArray( childName, this.registeredMediaTags ) > -1 ){
			// The child-node is a registered media item...
			parallelMediaModel.add( this.processMediaTypeNode( playlist, child ) );
		} else if( childName === 'sequence' ){
			parallelMediaModel.add( this.processSequenceNode( playlist, child ) );
		} else{
			ximpel.warn('Invalid child ignored! Element <'+parentName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[parentName].toString()  + '.');
		}
	}
	return parallelMediaModel;
}








ximpel.Parser.prototype.processMediaTypeNode = function( playlist, domElement ){
	var parentName = domElement.nodeName;
	var parentAttributes = domElement.attributes;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var mediaModel = new ximpel.MediaModel();
	mediaModel.mediaType = parentName;

	// Store the attributes defined in the custom-media tag within the playlist.
	// For instance in the case of: <video src=".." width=".." leadsto="..." /> we store: "src", "width" and "loadsto" attributes.
	for( var i=0; i<parentAttributes.length; i++ ){
		var attributeName = parentAttributes[i].name;
		var attributeValue = parentAttributes[i].value;

		if( attributeName === 'leadsTo' ){
			mediaModel.leadsTo = attributeValue;
		} else if( attributeName === 'duration' ){
			mediaModel.duration = attributeValue;
		} else if( attributeName === 'repeat' ){
			mediaModel.repeat = attributeValue;
		} else{
			mediaModel.customAttributes[attributeName] = attributeValue;
		}
	}


	// Process and store the child elements of the custom media type element.
	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;
		if( childName === 'overlay' ){
			mediaModel.overlays.push( this.processOverlayNode( playlist, child ) );
		} else if( childName === 'score' ){
			mediaModel.scoreModifier = this.processScoreNode( playlist, child );
		} else{
			// If the name of the child element is unknown then we assume its a custom element for the media type.
			var childAttributes = {};
			for( var j=0; j<child.attributes.length; j++ ){
				childAttributes[child.attributes[j].name] = child.attributes[j].value;
			}
			var customElementModel = new ximpel.CustomElementModel( childName, childAttributes );
			mediaModel.customElements.push( customElementModel );
		}
	}
	
	// We set the mediaId to a unique ID value which we use to distinguish the media items.
	mediaModel.mediaId = this.mediaIdCounter++;

	// We sort the overlays array in the mediaModel on startTime
	mediaModel.overlays.sort( function( overlay1, overlay2 ){
		return overlay1.startTime - overlay2.startTime;
	});

	// we add the media items to mediaList of the playlist.
	playlist.mediaList.push( mediaModel ); 

	return mediaModel;
}



ximpel.Parser.prototype.processScoreNode = function( playlist, domElement ){
	var parentName = domElement.nodeName;
	var parentAttributes = domElement.attributes;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var scoreModifier = new ximpel.ScoreModifierModel();

	// Process and store the attributes of the <score> element.
	for( var i=0; i<parentAttributes.length; i++ ){
		var attributeName = parentAttributes[i].name;
		var attributeValue = parentAttributes[i].value;
		if( attributeName === 'id' ){
			scoreModifier.scoreId = attributeValue;
		} else if( attributeName === 'operation' ){
			scoreModifier.operation = attributeValue;
		} else if( attributeName === 'value' ){
			scoreModifier.value = attributeValue;
		} else{
			ximpel.warn('Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+parentName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Process and store the child elements of the <score> element.
	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;
		
		// No child nodes supported for the score element.
		ximpel.warn('Invalid child ignored! Element <'+parentName+'> has child <'+childName+'>. No children allowed on <'+parentName+'>.');
	}

	return scoreModifier;
}



ximpel.Parser.prototype.processDescriptionNode = function( playlist, domElement ){
	var parentName = domElement.nodeName;
	var childNode = domElement.childNodes[0];
	var description = "";

	if( childNode.nodeType === 3 ){ // the node is a textnode.
		description = childNode.nodeValue;
	} else{
		ximpel.warn('Invalid description! Element <'+parentName+'> has an invalid child node. Only text is allowed inside the <description> element.');
	}

	return description;
}









ximpel.Parser.prototype.processOverlayNode = function( playlist, domElement ){
	var parentName = domElement.nodeName;
	var parentAttributes = domElement.attributes;
	var children = domElement.children;
	var nrOfChildren = children.length;
	var overlay = new ximpel.OverlayModel();

	// Process and store the attributes of the <overlay> element.
	for( var i=0; i<parentAttributes.length; i++ ){
		var attributeName = parentAttributes[i].name;
		var attributeValue = parentAttributes[i].value;
		if( attributeName === 'x' ){
			overlay.x = parseInt(attributeValue);
		} else if( attributeName === 'y' ){
			overlay.y =parseInt( attributeValue);
		} else if( attributeName === 'width' ){
			//overlay.shape = overlay.shape || {};
			overlay.width = parseInt(attributeValue);
		} else if( attributeName === 'height' ){
			//overlay.shape = overlay.shape || {};
			overlay.height = parseInt(attributeValue);
		} else if( attributeName === 'sides' ){
			//overlay.shape = overlay.shape || {};
			overlay.sides = parseInt(attributeValue);
		} else if( attributeName === 'diameter' ){
			overlay.diameter = parseInt(attributeValue);
		} else if( attributeName === 'leadsTo' ){
			overlay.leadsTo = attributeValue;
		} else if( attributeName === 'startTime' ){
			overlay.startTime = parseInt(attributeValue);
		} else if( attributeName === 'duration' ){
			overlay.duration = parseInt(attributeValue);
		} else if( attributeName === 'text' ){
			overlay.text = attributeValue;
		} else if( attributeName === 'shape' ){
			//overlay.shape = overlay.shape || {};
			overlay.shape = attributeValue;
		} else if( attributeName === 'color' ){
			overlay.color = attributeValue;
		} else if( attributeName === 'opacity' ){
			overlay.opacity = attributeValue;
		} else if( attributeName === 'hoverColor' ){
			overlay.hoverColor = attributeValue;
		} else if( attributeName === 'hoverOpacity' ){
			overlay.hoverOpacity = attributeValue;
		} else if( attributeName === 'textColor' ){
			overlay.textColor = attributeValue;
		} else if( attributeName === 'textFont' ){
			overlay.textFont = attributeValue;
		} else if( attributeName === 'textSize' ){
			overlay.textSize = attributeValue;
		} else if( attributeName === 'waitForMediaComplete' ){
			overlay.waitForMediaComplete = attributeValue;
		} else{
			ximpel.warn('Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+parentName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Check if the shape is valid (ie. if square then the "sides" attribute must exist, if rectangle then width and height must exist etc.)
	// TODO


	// Process and store the child elements of the <overlay> element.
	for( var i=0; i<nrOfChildren; i++ ){
		var child = children[i];
		var childName = child.nodeName;

		if( childName === 'score' ){
			overlay.scoreModifier = this.processScoreNode( playlist, child );
		} else{
			ximpel.warn('Invalid child ignored! Element <'+parentName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[parentName].toString()  + '.');
		}
	}
	return overlay;
}


ximpel.Parser.prototype.processConfigNode = function( domElement ){
	// TODO
	return new ximpel.ConfigModel();
}

ximpel.Parser.prototype.validatePlaylist = function( xmlDoc ){
	// TODO

}

ximpel.Parser.prototype.validateConfig = function( xmlDoc ){
	// TODO
}

ximpel.Parser.prototype.validateXml = function( xmlDoc ){
	// TODO
}


ximpel.Parser.prototype.getNextSiblingElement = function( domElement ){
	var sibling = domElement.nextSibling();
	while( sibling !== null && sibling.nodeType !== 1 ){
		sibling = sibling.nextSibling();
	}

	if( sibling === null ){
		return null;
	} else{
		// There is a sibling node with nodeType 1 (ie. an element node).
		return sibling;
	}
}