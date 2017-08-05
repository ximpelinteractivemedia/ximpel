// Models()
// This file contains all the predefined models that XIMPEL uses. These models don't have functionality but they only
// indicate what information is available for specific things. When the parser parses a playlist or config file it translates
// the information from these files to different models. For example a subject is processed and ends up as a SubjectModel 
// containing all information about that subject. The SubjectModel itself contains a SequenceModel which in turn contains MediaModels
// with information about the media items that have to be played. The models often have default values, which may be overwritten by
// the parser.
// ########################################################################################################################################################

// Each model has a Model() object as its prototype. This provides each model with a get() and set() method.
ximpel.Model = function(){
}
ximpel.Model.prototype.get = function( propertyName ){
	return this[propertyName];
}
ximpel.Model.prototype.set = function( propertyName, value ){
	this[propertyName] = value;
	return this;
}

// ############################################################################
// PlaylistModel
// ############################################################################
// The PlaylistModel is the main model containing all information about the playlist.
// This is the model that the Player() object requires to play a presentation.

ximpel.PlaylistModel = function(){
	// An object containing all the subject models. Stored in format:
	// {'subjectId': <subjectModel>, 'subjectId2': <subjectModel>}
	this.subjectModels = {};

	// an array in which all the media models used within the playlist will be stored.
	this.mediaList = []; 

	// The subjectId of the first subject that should be played.
	this.firstSubjectToPlay = "";

	// The variable modifiers on the playlist model are used to initialize variables.
	this.variableModifiers = [];
}
ximpel.PlaylistModel.prototype = new ximpel.Model();



// ############################################################################
// SubjectModel
// ############################################################################
ximpel.SubjectModel = function(){
	// The variable modifiers to apply when the subject is played.
	this.variableModifiers = [];

	// The sequence model that this subject should play (the sequence model contains the list of media items to play)
	this.sequenceModel = null;

	// An array of leadsToModels. These leadsToModels specify the leadsTo value that is used when the subject ends.
	this.leadsToList = [];

	// A key-value object where the key is an event type (like 'swipeleft', 'swiperight') and the value is a leadsToModel
	this.swipeTo = {};
}
ximpel.SubjectModel.prototype = new ximpel.Model();
ximpel.SubjectModel.prototype.description = '';
ximpel.SubjectModel.prototype.subjectId = '';
ximpel.SubjectModel.prototype.getId = function(){
	return this.subjectId;
}



// ############################################################################
// SequenceModel
// ############################################################################
ximpel.SequenceModel = function(){
	// The list of a sequence model may contain MediaModels or ParallelModels
	this.list = [];
}
ximpel.SequenceModel.prototype = new ximpel.Model();
ximpel.SequenceModel.prototype.ORDER_DEFAULT = 'default'; 
ximpel.SequenceModel.prototype.ORDER_RANDOM = 'random';
ximpel.SequenceModel.prototype.order = ximpel.SequenceModel.prototype.ORDER_DEFAULT;

ximpel.SequenceModel.prototype.add = function( item ){
	this.list.push( item );
}



// ############################################################################
// ParallelModel
// ############################################################################
ximpel.ParallelModel = function(){
	// The list of a ParallelModel may contain MediaModels or SequenceModels
	this.list = [];
}
ximpel.ParallelModel.prototype = new ximpel.Model();
ximpel.ParallelModel.prototype.add = function( item ){
	this.list.push( item );
}



// ############################################################################
// MediaModel
// ############################################################################
ximpel.MediaModel = function(){
	// The OverlayModels that are to be played during this media item.
	this.overlays = [];

	// The QuestionModels that are to be played during the media item.
	this.questionLists = [];

	// The custom attributes provided on the media tags (ie. on <video> for example)
	this.customAttributes = {};
    
    // The custom elements provided between the media tags (ie. between <video> and <video> for example)
	this.customElements = [];

	// An array of leadsToModels. These leadsToModels specify the leadsTo value that is used when the media ends.
	this.leadsToList = [];

	// The variable modifiers to apply when the media is played.
	this.variableModifiers = [];
}
ximpel.MediaModel.prototype = new ximpel.Model();
ximpel.MediaModel.prototype.description = "";

// The type of the media that this media item represents (ie. video or audio or picture, etc.). This is filled in by the parser.
ximpel.MediaModel.prototype.mediaType = null;

// How long the media item should play (0 is indefinitely)
ximpel.MediaModel.prototype.duration = 0;

// Defines if the media item should repeat when it comes to its playback end.
ximpel.MediaModel.prototype.repeat = false;

// This is a unique id for each media item (generated in by the parser)
ximpel.MediaModel.prototype.mediaId = null;

ximpel.MediaModel.prototype.getId = function(){
	return this.mediaId;
}



// ############################################################################
// QuestionListModel
// ############################################################################
ximpel.QuestionListModel = function(){
	// When the questionList should start relative to the media item's startTime
	this.startTime = 0;

	// The timelimit of the questions in this question list.
	this.questionTimeLimit = 0;
	
	// The list of questionModels that are part of this question list.
	this.questions = [];

}
ximpel.QuestionListModel.prototype = new ximpel.Model();




// ############################################################################
// QuestionModel
// ############################################################################
ximpel.QuestionModel = function(){
	// The type of the question (determined by the parser)
	this.type = "boolean";

	// The start time of this specific question.
	this.startTime = 0;

	// The timelimit of this specific question.
	this.timeLimit = null;

	// The text of the question
	this.questionText = "";

	// The answer (true or false for boolean questions, or a number for questions with specific options.)
	this.answer = true;

	// A list of QuestionOptionModels that form the choosable options for the question.
	this.options = [];

	// The variable modifiers to apply when the question is answered correctly.
	this.variableModifiers = [];
}
ximpel.QuestionModel.prototype = new ximpel.Model();



// ############################################################################
// QuestionOptionModel
// ############################################################################
ximpel.QuestionOptionModel = function(){
	// the option name is used to reference the option. The answer attribute of the question holds the name of the option.
	this.optionName = "";
	
	// The option text indicates the text to be shown for the option.
	this.optionText = "";
}
ximpel.QuestionOptionModel.prototype = new ximpel.Model();



// ############################################################################
// VariableModifierModel
// ############################################################################
ximpel.VariableModifierModel = function(){
}
ximpel.VariableModifierModel.prototype = new ximpel.Model();
// These specify some constants that define the operations that can be used in a variable modifier.
ximpel.VariableModifierModel.prototype.OPERATION_SET = 'set';
ximpel.VariableModifierModel.prototype.OPERATION_ADD = 'add';
ximpel.VariableModifierModel.prototype.OPERATION_SUBSTRACT = 'substract';
ximpel.VariableModifierModel.prototype.OPERATION_MULTIPLY = 'multiply';
ximpel.VariableModifierModel.prototype.OPERATION_DIVIDE = 'divide';
ximpel.VariableModifierModel.prototype.OPERATION_POWER = 'power';

// The ID of the variable to be modified.
ximpel.VariableModifierModel.prototype.id = '';

// The operation to perform on the variable.
ximpel.VariableModifierModel.prototype.operation = 'set';

// The value to perform the operation with.
ximpel.VariableModifierModel.prototype.value = 0;



// ############################################################################
// ConditionModel
// ############################################################################
ximpel.ConditionModel = function(){
}
ximpel.ConditionModel.prototype = new ximpel.Model();

// A string containing a condition.
ximpel.ConditionModel.prototype.condition = null;



// ############################################################################
// LeadsToModel
// ############################################################################
ximpel.LeadsToModel = function(){
}
ximpel.LeadsToModel.prototype = new ximpel.Model();

// The subjectId 
ximpel.LeadsToModel.prototype.subject = null;

// The condition underwhich that subjectId is used.
ximpel.LeadsToModel.prototype.conditionModel = null;



// ############################################################################
// OverlayModel
// ############################################################################
ximpel.OverlayModel = function(){
	// The variable modifiers to apply when the overlay is clicked.
	this.variableModifiers = [];

	// An array of leadsToModels. These leadsToModels specify the leadsTo value that is used when the overlay is clicked.
	this.leadsToList = [];
}
ximpel.OverlayModel.prototype = new ximpel.Model();
ximpel.OverlayModel.prototype.SHAPE_RECTANGLE = 'rectangle';
ximpel.OverlayModel.prototype.x = 0;
ximpel.OverlayModel.prototype.y = 0;
ximpel.OverlayModel.prototype.waitForMediaComplete = false;
ximpel.OverlayModel.prototype.leadsTo = null;
ximpel.OverlayModel.prototype.startTime = 0;
ximpel.OverlayModel.prototype.duration = 0;
ximpel.OverlayModel.prototype.text = "";
ximpel.OverlayModel.prototype.shape = 'rectangle';
ximpel.OverlayModel.prototype.width = '200px';
ximpel.OverlayModel.prototype.height = '100px';
ximpel.OverlayModel.prototype.side = '150px';
ximpel.OverlayModel.prototype.diameter = '150px';
ximpel.OverlayModel.prototype.textAlign = "center";
ximpel.OverlayModel.prototype.opacity = 0.4;
ximpel.OverlayModel.prototype.hoverOpacity = 0.6;
ximpel.OverlayModel.prototype.backgroundColor = "white";
ximpel.OverlayModel.prototype.hoverBackgroundColor = null; 	// null means the same as the non-hover style.
ximpel.OverlayModel.prototype.textColor = "white";
ximpel.OverlayModel.prototype.hoverTextColor = null;		// null means the same as the non-hover style.
ximpel.OverlayModel.prototype.fontFamily = "Arial";
ximpel.OverlayModel.prototype.hoverFontFamily = null;		// null means the same as the non-hover style.
ximpel.OverlayModel.prototype.fontSize = "50px";
ximpel.OverlayModel.prototype.hoverFontSize = null;			// null means the same as the non-hover style.
ximpel.OverlayModel.prototype.backgroundImage = null;
ximpel.OverlayModel.prototype.description = null;



// ############################################################################
// ConfigModel
// ############################################################################
ximpel.ConfigModel = function(){
}
ximpel.ConfigModel.prototype = new ximpel.Model();
ximpel.ConfigModel.prototype.mediaDirectory = '';
ximpel.ConfigModel.prototype.titleScreenImage = 'assets/ximpel_title_screen.png';
ximpel.ConfigModel.prototype.enableControls = true;
ximpel.ConfigModel.prototype.controlsDisplayMethod = 'overlay';
ximpel.ConfigModel.prototype.showScore = false;
ximpel.ConfigModel.prototype.minimumSwipeVelocity = 0.10;
ximpel.ConfigModel.prototype.minimumSwipeTranslation = 50;

// This extend method allows for extending one ConfigModel with another ConfigModel
// The config model that is being extended gets all values overwritten from the ConfigModel
// that you extend it with.
ximpel.ConfigModel.prototype.extend = function( extendWithConfig ){
	var extendWithPropertyNames = Object.getOwnPropertyNames( extendWithConfig );
	extendWithPropertyNames.forEach( function( propertyName ){
		this[propertyName] = extendWithConfig[propertyName];
	}, this );
}



// ############################################################################
// ConfigModel
// ############################################################################
ximpel.CustomElementModel = function( elementName, elementAttributes ){
	this.elementName = elementName || '';
	this.elementAttributes = elementAttributes || {};
}



// ############################################################################
// XimpelAppModel
// ############################################################################
ximpel.XimpelAppModel = function(){
	this.initialAppWidth = "1080px"; // can be overwritten at the moment the app is created.
	this.initialAppHeight = "720px"; // can be overwritten at the moment the app is created.
	this.$appElement = null;
	this.$parentElement = null;

	this.playlistFile = null;
	this.configFile =null;
	this.ximpelPlayer = null;
 	this.parser = null;
 	this.configModel = new ximpel.ConfigModel();
	this.playlistModel = null;
	this.playlistXmlDocument = null;
	this.configXmlDocument = null;
 	this.filesRequestPromise = null;
	this.playlistRequestPromise = null;
	this.configRequestPromise = 0;
/*	this.enableControls = true;
	this.controlsDisplayMethod = "overlay";*/
	this.appReadyState = null;
	this.playerState = null;

}
ximpel.XimpelAppModel.prototype = new ximpel.Model();
ximpel.XimpelAppModel.prototype.PLAYER_STATE_PLAYING = 'player_state_playing';
ximpel.XimpelAppModel.prototype.PLAYER_STATE_PAUSED = 'player_state_paused';
ximpel.XimpelAppModel.prototype.PLAYER_STATE_STOPPED = 'player_state_stopped';
