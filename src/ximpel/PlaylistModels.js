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
ximpel.XimpelAppModel.prototype.APP_READY_STATE_NOT_READY = 1;
ximpel.XimpelAppModel.prototype.APP_READY_STATE_READY = 2;
ximpel.XimpelAppModel.prototype.PLAYER_STATE_PLAYING = 'player_state_playing';
ximpel.XimpelAppModel.prototype.PLAYER_STATE_PAUSED = 'player_state_paused';
ximpel.XimpelAppModel.prototype.PLAYER_STATE_STOPPED = 'player_state_stopped';

// ############################################################################

ximpel.PlaylistModel = function(){
	this.subjectModels = {};
	this.mediaList = []; // an array in which all the media models used within the playlist will be stored.
	this.firstSubjectToPlay = "";

	// The variable modifiers on the playlist model are used to initialize variables.
	this.variableModifiers = [];
}
ximpel.PlaylistModel.prototype = new ximpel.Model();


// ############################################################################

ximpel.SubjectModel = function(){
	// The variable modifiers to apply when the subject is played.
	this.variableModifiers = [];

	this.sequenceModel = null;

	this.leadsToList = [];
}
ximpel.SubjectModel.prototype = new ximpel.Model();
ximpel.SubjectModel.prototype.description = '';
ximpel.SubjectModel.prototype.subjectId = '';
ximpel.SubjectModel.prototype.getId = function(){
	return this.subjectId;
}

// ############################################################################

ximpel.SequenceModel = function(){
	// a sequence can contain:
	// - A media item
	// - A ParallelGroup
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

ximpel.ParallelModel = function(){
	// a ParallelGroup can contain only media items.
	this.list = [];
}
ximpel.ParallelModel.prototype = new ximpel.Model();
ximpel.ParallelModel.prototype.add = function( item ){
	this.list.push( item );
}

// ############################################################################

ximpel.MediaModel = function(){
	this.overlays = [];
	this.questionLists = [];

	this.customAttributes = {};

	this.customElements = [];

	this.leadsToList = [];

	// The variable modifiers to apply when the media is played.
	this.variableModifiers = [];
}
ximpel.MediaModel.prototype = new ximpel.Model();
/*ximpel.MediaModel.prototype.x = 0;
ximpel.MediaModel.prototype.y = 0;*/
ximpel.MediaModel.prototype.mediaType = null;
ximpel.MediaModel.prototype.duration = 0; // 0 = indefinitely
ximpel.MediaModel.prototype.description = "";
ximpel.MediaModel.prototype.repeat = false;
ximpel.MediaModel.prototype.mediaId = null;


ximpel.MediaModel.prototype.getId = function(){
	return this.mediaId;
}


// ############################################################################
ximpel.QuestionListModel = function(){
	this.startTime = 0;
	this.questionTimeLimit = 0;
	this.nrOfQuestionsToAsk = 2;
	this.questionOrder = "random"; // sequential / random
	this.questions = [];

}
ximpel.QuestionListModel.prototype = new ximpel.Model();

// ############################################################################

ximpel.QuestionModel = function(){
	this.type = "boolean";
	this.startTime = 0;
	this.timeLimit = null;
	this.questionText = "";
	this.answer = true;
	this.options = [];

	// The variable modifiers to apply when the question is answered correctly.
	this.variableModifiers = [];
}
ximpel.QuestionModel.prototype = new ximpel.Model();

// ############################################################################

ximpel.QuestionOptionModel = function(){
	this.optionName = "";	// the option name is used to reference the option. The answer attribute of the question holds the name of the option.
	this.optionText = ""; 	// The option text indicates the text to be shown for the option.
}
ximpel.QuestionOptionModel.prototype = new ximpel.Model();

// ############################################################################


ximpel.VariableModifierModel = function(){
}
ximpel.VariableModifierModel.prototype = new ximpel.Model();
ximpel.VariableModifierModel.prototype.OPERATION_SET = 'set';
ximpel.VariableModifierModel.prototype.OPERATION_ADD = 'add';
ximpel.VariableModifierModel.prototype.OPERATION_SUBSTRACT = 'substract';
ximpel.VariableModifierModel.prototype.OPERATION_MULTIPLY = 'multiply';
ximpel.VariableModifierModel.prototype.OPERATION_DIVIDE = 'divide';

ximpel.VariableModifierModel.prototype.id = '';
ximpel.VariableModifierModel.prototype.operation = 'set';
ximpel.VariableModifierModel.prototype.value = 0;

// ############################################################################

ximpel.ConditionModel = function(){
}
ximpel.ConditionModel.prototype = new ximpel.Model();
ximpel.ConditionModel.prototype.condition = null;


// ############################################################################

ximpel.LeadsToModel = function(){
}
ximpel.LeadsToModel.prototype = new ximpel.Model();
ximpel.LeadsToModel.prototype.subject = null;
ximpel.LeadsToModel.prototype.conditionModel = null;


// ############################################################################

ximpel.OverlayModel = function(){
	this.variableModifiers = [];

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
ximpel.OverlayModel.prototype.sides = '150px';
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

ximpel.ConfigModel = function(){
}
ximpel.ConfigModel.prototype = new ximpel.Model();
ximpel.ConfigModel.prototype.mediaDirectory = '';
ximpel.ConfigModel.prototype.titleScreenImage = 'assets/ximpel_title_screen.png';
ximpel.ConfigModel.prototype.enableControls = true;
ximpel.ConfigModel.prototype.controlsDisplayMethod = 'overlay';

ximpel.ConfigModel.prototype.extend = function( extendWithConfig ){
	var extendWithPropertyNames = Object.getOwnPropertyNames( extendWithConfig );
	extendWithPropertyNames.forEach( function( propertyName ){
		this[propertyName] = extendWithConfig[propertyName];
	}, this );
}


// ############################################################################


ximpel.CustomElementModel = function( elementName, elementAttributes ){
	this.elementName = elementName || '';
	this.elementAttributes = elementAttributes || {};
}



// ############################################################################



