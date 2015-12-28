// ########################################################################################################################################################
// The Parser..... description... comes later...
// ########################################################################################################################################################
	// TODO:
	// 	- Check if the shape of an overlay is valid (ie. if square then the "sides" attribute must exist, if rectangle then width and height must exist etc.)
	//	- Start using the this.validChildren object to enforce only using validChildren
	//  - Start making sure that units are specified. (note that width/heights/x and y should have units specified, if not given then we should add 'px'.)
	//  - Right now in every process<node>() function I call the actual node that is being processed the parent node. This is confusing so should be called "currentNode" orso.
	//  - Right now for the media type nodes we store the custom elements in a special format. We should probably just store the raw DOM elements.
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




ximpel.Parser.prototype.processXimpelNode = function( domElement ){
	var info = this.getDomElementInfo( domElement );
	var result = {};

	// The ximpel node can have a playlist child-node, a config child-node, or both. We process each child node.
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];

		if( child.nodeName === 'playlist' ){
			result['playlist'] = this.processPlaylistNode( child );
		} else if( child.nodeName === 'config' ){
			result['config'] = this.processConfigNode( child );
		} else{
			ximpel.warn('Parser.processXimpelNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+child.nodeName+'>. Allowed children: ' + this.validChildren[info.tagName].toString() + '.');
		}
	}
	return result;
}



ximpel.Parser.prototype.processPlaylistNode = function( domElement ){
	var info = this.getDomElementInfo( domElement );
	var playlistModel = new ximpel.PlaylistModel();
	var firstSubjectToPlay = null;

	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];

		if( child.nodeName === 'subject' ){
			var subject = this.processSubjectNode( playlistModel, child );

			// Store the subjectModels under their ID so that they can be retrieved using subjectModels[subjectId]
			playlistModel.subjectModels[subject.subjectId] = subject;

			// By default, the first subject in the playlist file is the one that will be played at the start of the ximpel presentation.
			if( firstSubjectToPlay === null ){
				// firstSubjectToPlay has not been set yet, so this is the first subject and we store its ID.
				firstSubjectToPlay = subject.subjectId;
			}
		} else if( child.nodeName === 'score' || child.nodeName === 'variable' ){
			playlistModel.variableModifiers.push( this.processVariableNode( playlistModel, child ) );
		} else{
			ximpel.warn('Parser.processPlaylistNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+child.nodeName+'>. Allowed children: ' + this.validChildren[info.tagName].toString() + '.');
		}
	}
	playlistModel.firstSubjectToPlay = firstSubjectToPlay;

	return playlistModel;
}

ximpel.Parser.prototype.processSubjectNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var subjectModel = new ximpel.SubjectModel();

	// Process and store the attributes of the <subject> element.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;
		if( attributeName === 'id' ){
			subjectModel.subjectId = attributeValue;
		} else if( attributeName === 'leadsTo' ){
			var leadsToModel = new ximpel.LeadsToModel();
			leadsToModel.subject = attributeValue;
			subjectModel.leadsToList.push( leadsToModel );
		} else{
			ximpel.warn('Parser.processSubjectNode(): Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+info.tagName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Process and store the child elements of the <subject> element.
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;

		if( childName === 'description' ){
			subjectModel.description = this.processDescriptionNode( playlistModel, child );
		} else if( childName === 'media' ){
			subjectModel.sequenceModel = this.processMediaNode( playlistModel, child );
		} else if( childName === 'score' || childName === 'variable' ){
			var variableModifier = this.processVariableNode( playlistModel, child );
			subjectModel.variableModifiers.push( variableModifier );
		} else if( childName === 'leadsTo' ){
			var leadsToModel = this.processLeadsToNode( playlistModel, child );
			subjectModel.leadsToList.push( leadsToModel );
		} else {
			ximpel.warn('Parser.processSubjectNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[info.tagName].toString() + '.');
		}
	}

	return subjectModel;
}

ximpel.Parser.prototype.processMediaNode = function( playlistModel, domElement ){
	return this.processSequenceNode( playlistModel, domElement );
}

ximpel.Parser.prototype.processSequenceNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var sequenceModel = new ximpel.SequenceModel();

	// Process and store the attributes of the <sequence> element.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;
		if( attributeName === 'order' ){
			sequenceModel.order = attributeValue;
		} else{
			ximpel.warn('Parser.processSequenceNode(): Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+info.tagName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Process and store the child elements of the parent element.
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;

		if( $.inArray( childName, this.registeredMediaTags ) > -1 ){
			// The child-node is a registered media item...
			sequenceModel.add( this.processMediaTypeNode( playlistModel, child ) );
		} else if( childName === 'parallel' ){
			sequenceModel.add( this.processParallelNode( playlistModel, child ) );
		} else if( childName === 'sequence' ){
			sequenceModel.add( this.processSequenceNode( playlistModel, child ) );
		} else{
			ximpel.warn('Parser.processSequenceNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[info.tagName].toString()  + '.');
		}
	}
	return sequenceModel;
}

ximpel.Parser.prototype.processParallelNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var parallelModel = new ximpel.ParallelModel();

	// Process and store the child elements of the <parallel> element.
	for( var i=0; i<info.childElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;
		
		if( $.inArray( childName, this.registeredMediaTags ) > -1 ){
			// The child-node is a registered media item...
			parallelModel.add( this.processMediaTypeNode( playlistModel, child ) );
		} else if( childName === 'sequence' ){
			parallelModel.add( this.processSequenceNode( playlistModel, child ) );
		} else{
			ximpel.warn('Parser.processParallelNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[info.tagName].toString()  + '.');
		}
	}
	return parallelModel;
}

ximpel.Parser.prototype.processMediaTypeNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var mediaModel = new ximpel.MediaModel();
	mediaModel.mediaType = info.tagName;

	// Store the attributes defined in the custom-media tag within the playlist.
	// For instance in the case of: <video src=".." width=".." leadsto="..." /> we store: "src", "width" and "loadsto" attributes.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;

		if( attributeName === 'leadsTo' ){
			var leadsToModel = new ximpel.LeadsToModel();
			leadsToModel.subject = attributeValue;
			mediaModel.leadsToList.push( leadsToModel );
		} else if( attributeName === 'duration' ){
			mediaModel.duration = parseFloat(attributeValue)*1000;
		} else if( attributeName === 'repeat' ){
			mediaModel.repeat = attributeValue === "true" ? true : false;
		} else{
			// The media model has a 'customAttributes' property which stores all the attributes that are not known to ximpel.
			// We do this because these attributes may be used by the media type which ximpel knows nothing about.
			mediaModel.customAttributes[attributeName] = attributeValue;
		}
	}

	// Process and store the child elements of the custom media type element.
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;

		if( childName === 'overlay' ){
			mediaModel.overlays.push( this.processOverlayNode( playlistModel, child ) );
		} else if( childName === 'score' || childName === 'variable' ){
			var variableModifier = this.processVariableNode( playlistModel, child );
			mediaModel.variableModifiers.push( variableModifier );
		} else if( childName === 'question' ){
			mediaModel.questionLists.push( this.processQuestionNode( playlistModel, child ) );
		} else if( childName === 'questions' ){
			mediaModel.questionLists.push( this.processQuestionsNode( playlistModel, child ) );
		} else if( childName === 'leadsTo' ){
			var leadsToModel = this.processLeadsToNode( playlistModel, child );
			mediaModel.leadsToList.push( leadsToModel );
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

	// we add the media items to mediaList of the playlistModel.
	playlistModel.mediaList.push( mediaModel ); 

	return mediaModel;
}




ximpel.Parser.prototype.processQuestionsNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var questionListModel = new ximpel.QuestionListModel();

	// Process and store the attributes of the <questions> element.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;
		if( attributeName === 'startTime' ){
			questionListModel.startTime = parseFloat(attributeValue)*1000;
		} else if( attributeName === 'questionTimeLimit' ){
			questionListModel.questionTimeLimit = parseFloat(attributeValue)*1000;
		} else if( attributeName === 'nrOfQuestionsToAsk' ){
			questionListModel.nrOfQuestionsToAsk = parseInt(attributeValue);
		} else if( attributeName === 'questionOrder' ){
			questionListModel.questionOrder = attributeValue;
		} else{
			ximpel.warn('Parser.processQuestionsNode(): Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+info.tagName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Process and store the child elements of the <questions> element.
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;
		
		if( childName === 'question' ){
			questionListModel.questions.push( this.processQuestionNode( playlistModel, child ) );
		} else{
			ximpel.warn('Parser.processQuestionsNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[info.tagName].toString()  + '.');
		}
	}
	return questionListModel;
}




ximpel.Parser.prototype.processQuestionNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var questionModel = new ximpel.QuestionModel();
	var hasExplicitQuestionList = domElement.parentNode.nodeName === 'questions' ? true : false;

	// Process and store the attributes of the <question> element.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;

		if( attributeName === 'startTime' && hasExplicitQuestionList === false ){
			questionModel.startTime = parseFloat(attributeValue)*1000;
		} else if( attributeName === 'questionTimeLimit' ){
			questionModel.questionTimeLimit = parseFloat(attributeValue)*1000;
		} else if( attributeName === 'answer' ){
			questionModel.answer = attributeValue;
		} else{
			ximpel.warn('Parser.processQuestionNode(): Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+info.tagName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Find the textnode within the <question> tag (ie. the actual question being asked.)
	var questionText = "";
	for( var i=0; i<domElement.childNodes.length; i++ ){
		var node = domElement.childNodes[i];
		if( node.nodeType === 3 ){
			questionText += domElement.childNodes[i].nodeValue;
		}
	}
	// Strip off the whitespace/newline characters around the textnode.
	questionModel.questionText = $.trim( questionText );

	// Process and store the child elements of the <question> element.
	var nrOfOptions=0;
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;
		
		if( childName === 'option' ){
			nrOfOptions+=1;
			var optionModel = this.processOptionNode( playlistModel, child );
			// If the option was not given a name attribute, then we set the optionName equal to the
			// index of the option plus 1. So the first options is named 1, the second option named 2 etc.
			optionModel.optionName = optionModel.optionName === "" ? ""+nrOfOptions : optionModel.optionName;
			questionModel.options.push( optionModel );
		} else if( childName === 'score' || childName === 'variable' ){
			var variableModifier = this.processVariableNode( playlistModel, child );
			questionModel.variableModifiers.push( variableModifier );
		} else{
			ximpel.warn('Parser.processQuestionNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[info.tagName].toString()  + '.');
		}
	}

	// If no options were given then we consider it to be a true false question so we create true/false options.
	if( questionModel.options.length <= 0 ){
		var trueOption = new ximpel.QuestionOptionModel();
		trueOption.optionName = "true";
		trueOption.optionText = "True";
		var falseOption = new ximpel.QuestionOptionModel();
		falseOption.optionName = "false";
		falseOption.optionText = "False";
		questionModel.options.push( trueOption );
		questionModel.options.push( falseOption );
	}

	// The <questions> tag is used to group a set of questions together. Every <question> belongs to a list of questions. 
	// All questions that are within the same <questions> tag, are considered to be part of the same question list. 
	// However, if you don't explicitly wrap a question in a <questions> tag, then the <question> is considered to be 
	// its own list of just one question. So if the question is not explicitly added to a <questions> tag then we let
	// this function create a QuestionListModel just for this one question.
	if( !hasExplicitQuestionList ){
		var questionList = new ximpel.QuestionListModel();
		questionList.startTime = questionModel.startTime || 0;
		questionList.questions.push( questionModel );
		return questionList;
	} 

	return questionModel;
}



ximpel.Parser.prototype.processOptionNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var optionModel = new ximpel.QuestionOptionModel();

	// Process and store the attributes of the <option> element.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;

		if( attributeName === 'name' ){
			optionModel.optionName = attributeValue;
		} 
		ximpel.warn('Parser.processOptionNode(): Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+info.tagName+'> is not supported. Make sure you spelled the attribute name correctly.');
	}

	// Find the textnode within the <option> tag (ie. the actual option text to be shown.)
	var optionText = "";
	for( var i=0; i<domElement.childNodes.length; i++ ){
		if( domElement.childNodes[i].nodeType === 3 ){
			optionText += domElement.childNodes[i].nodeValue;
		}
	}
	// Strip off the whitespace/newline characters around the text.
	optionModel.optionText = $.trim( optionText );
	
	return optionModel;
}


ximpel.Parser.prototype.processVariableNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var variableModifierModel = new ximpel.VariableModifierModel();

	// Process and store the attributes of the element.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;
		if( attributeName === 'id' ){
			variableModifierModel.id = attributeValue;
		} else if( attributeName === 'operation' ){
			variableModifierModel.operation = attributeValue;
		} else if( attributeName === 'value' ){
			variableModifierModel.value = attributeValue;
		} else{
			ximpel.warn('Parser.processVariableNode(): Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+info.tagName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	// Process and store the child elements of the element.
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;
		
		// No child nodes supported for the score element.
		ximpel.warn('Parser.processVariableNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+childName+'>. No children allowed on <'+info.tagName+'>.');
	}

	return variableModifierModel;
}




ximpel.Parser.prototype.processLeadsToNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var leadsToModel = new ximpel.LeadsToModel();


	// Process and store the attributes of the leadsTo element.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;
		if( attributeName === 'condition' ){
			var condition = attributeValue;
		} else if( attributeName === 'subject' ){
			leadsToModel.subject = attributeValue
		} else{
			ximpel.warn('Parser.processLeadsToNode(): Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+info.tagName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}

	
	if( condition || evaluationFunction ){
		var conditionModel = new ximpel.ConditionModel();
		conditionModel.condition = condition ? condition : null;
		leadsToModel.conditionModel = conditionModel;
	} else{
		leadsToModel.conditionModel = null;

	}
	return leadsToModel;
}


ximpel.Parser.prototype.processDescriptionNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var childNode = domElement.childNodes[0];
	var description = "";

	
	if( !childNode ){
		// Nothing was specified between <description> and </description> so the description is empty.
		description = "";
	} else if( childNode.nodeType === 3 ){ 
		// text was specified between <description> and </description> (ie. node type === 3)
		description = $.trim( childNode.nodeValue );
	} else{
		// A non textnode was specified between <description> and </description>, probably an XML tag, which is not allowed.
		ximpel.warn('Parser.processDescriptionNode(): Invalid description! Element <'+info.tagName+'> has an invalid child node. Only text is allowed inside the <description> element.');
	}

	return description;
}

ximpel.Parser.prototype.processOverlayNode = function( playlistModel, domElement ){
	var info = this.getDomElementInfo( domElement );
	var overlayModel = new ximpel.OverlayModel();

	// Process and store the attributes of the <overlay> element.
	for( var i=0; i<info.nrOfAttributes; i++ ){
		var attributeName = info.attributes[i].name;
		var attributeValue = info.attributes[i].value;
		if( attributeName === 'x' ){
			overlayModel.x = parseInt(attributeValue);
		} else if( attributeName === 'y' ){
			overlayModel.y = parseInt( attributeValue);
		} else if( attributeName === 'shape' ){
			overlayModel.shape = attributeValue;
		} else if( attributeName === 'width' ){
			overlayModel.width = parseInt(attributeValue);
		} else if( attributeName === 'height' ){
			overlayModel.height = parseInt(attributeValue);
		} else if( attributeName === 'side' ){
			overlayModel.side = parseInt(attributeValue);
		} else if( attributeName === 'diameter' ){
			overlayModel.diameter = parseInt(attributeValue);
		} else if( attributeName === 'leadsTo' ){
			var leadsToModel = new ximpel.LeadsToModel();
			leadsToModel.subject = attributeValue;
			overlayModel.leadsToList.push( leadsToModel );
		} else if( attributeName === 'startTime' ){
			overlayModel.startTime = parseFloat(attributeValue)*1000;
		} else if( attributeName === 'duration' ){
			overlayModel.duration = parseFloat(attributeValue)*1000;
		} else if( attributeName === 'text' ){
			overlayModel.text = attributeValue;
		} else if( attributeName === 'alpha' ){
			overlayModel.opacity = attributeValue;
		} else if( attributeName === 'hoverAlpha' ){
			overlayModel.hoverOpacity = attributeValue;
		} else if( attributeName === 'backgroundColor' ){
			overlayModel.backgroundColor = attributeValue;
		} else if( attributeName === 'hoverBackgroundColor' ){
			overlayModel.hoverBackgroundColor = attributeValue;
		} else if( attributeName === 'textColor' ){
			overlayModel.textColor = attributeValue;
		} else if( attributeName === 'hoverTextColor' ){
			overlayModel.hoverTextColor = attributeValue;
		} else if( attributeName === 'fontFamily' ){
			overlayModel.fontFamily = attributeValue;
		} else if( attributeName === 'hoverFontFamily' ){
			overlayModel.hoverFontFamily = attributeValue;
		} else if( attributeName === 'fontSize' ){
			overlayModel.fontSize = attributeValue;
		} else if( attributeName === 'hoverFontSize' ){
			overlayModel.hoverFontSize = attributeValue;
		} else if( attributeName === 'image' ){
			overlayModel.backgroundImage = attributeValue;
		} else if( attributeName === 'hoverImage' ){
			overlayModel.hoverBackgroundImage = attributeValue;
		} else if( attributeName === 'waitForMediaComplete' ){
			overlayModel.waitForMediaComplete = attributeValue;
		} else if( attributeName === 'description' ){
			overlayModel.description = attributeValue;
		} else{
			ximpel.warn('Parser.processOverlayNode(): Invalid attribute ignored! Attribute \''+attributeName+'\' on element <'+info.tagName+'> is not supported. Make sure you spelled the attribute name correctly.');
		}
	}
	// Check if the shape is valid (ie. if square then the "sides" attribute must exist, if rectangle then width and height must exist etc.)
	// TODO

	// Process and store the child elements of the <overlay> element.
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;

		if( childName === 'score' || childName === 'variable' ){
			var variableModifier = this.processVariableNode( playlistModel, child );
			overlayModel.variableModifiers.push( variableModifier );
		} else if( childName === 'leadsTo' ){
			var leadsToModel = this.processLeadsToNode( playlistModel, child );
			overlayModel.leadsToList.push( leadsToModel );
		} else{
			ximpel.warn('Parser.processOverlayNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+childName+'>. Allowed children: ' + this.validChildren[info.tagName].toString()  + '.');
		}
	}
	return overlayModel;
}


ximpel.Parser.prototype.processConfigNode = function( domElement ){
	var info = this.getDomElementInfo( domElement );
	var configModel = new ximpel.ConfigModel();
	
	// Process and store the child elements of the <config> element.
	for( var i=0; i<info.nrOfChildElements; i++ ){
		var child = info.childElements[i];
		var childName = child.nodeName;

		if( childName === 'enableControls' ){
			configModel.enableControls = ( $.trim(child.textContent).toLowerCase() === 'false') ? false : true;
		} else if( childName === 'controlsDisplayMethod' ){
			configModel.controlsDisplayMethod = $.trim(child.textContent);
		} else if( childName === 'mediaDirectory' ){
			configModel.mediaDirectory = $.trim(child.textContent);
		} else{
			ximpel.warn('Parser.processConfigNode(): Invalid child ignored! Element <'+info.tagName+'> has child <'+childName+'>.This child element is not allowed on <'+info.tagName+'>.');
		}
	}

	return configModel;
}




ximpel.Parser.prototype.validateOverlayNode = function(   ){
	// TODO
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

// element.children gives the child nodes that are of type 'element'. However, the element.children attribute
// does not work in IE on XML elements. This function is used to get the child elements also for IE browsers.
// Note that for internet explorer we return an array while for other browsers we return domElement.children 
// which doesn't actually return an array but something that looks and functions alot like an array.
ximpel.Parser.prototype.getChildElementNodes = function( domElement ){
	if( domElement.children ){
		// for all browsers
		return domElement.children;
	} else{
		// For internet explorer
		var nrOfChildNodes = domElement.childNodes.length;
		var children = [];
		for( var i=0; i < nrOfChildNodes; i++ ){
    		var child = domElement.childNodes[i];
    		if( child.nodeType === 1 ){
    			children.push( child );
    		}
		}
		return children;
	}
}



ximpel.Parser.prototype.getDomElementInfo = function( domElement ){
	var domElementInfo = {};

	// Get the name (tag) of the DOM element (ie. for <ximpel> it returns gets "ximpel")
	domElementInfo.tagName = domElement.nodeName;

	// Get the attributes of the DOM element.
	domElementInfo.attributes = domElement.attributes;

	// Get the nr of attributes on the DOM element.
	domElementInfo.nrOfAttributes = domElementInfo.attributes.length;

	// Get the child DOM nodes of type 'element' (returns an array like object)
	domElementInfo.childElements = this.getChildElementNodes( domElement );

	// Get the number of child DOM nodes of type 'element'
	domElementInfo.nrOfChildElements = domElementInfo.childElements.length;

	return domElementInfo;
}