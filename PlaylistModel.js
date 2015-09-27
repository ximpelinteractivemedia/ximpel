// ############################################################################

// ############################################################################
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
ximpel.PlaylistModel = function(){
	this.subjectModels = {};
	this.initialScores = []; // An array of Score() objects.
	this.mediaList = []; // an array in which all the media models used within the playlist will be stored.
}
ximpel.PlaylistModel.prototype = new ximpel.Model();






// ############################################################################
ximpel.SubjectModel = function(){
	this.scoreModifier = null; // how to modify score when subject is played.
	this.mediaSequenceModel = null;
}
ximpel.SubjectModel.prototype = new ximpel.Model();
ximpel.SubjectModel.prototype.description = '';
ximpel.SubjectModel.prototype.subjectId = '';
ximpel.SubjectModel.prototype.firstSubjectIdToPlay = '';
ximpel.SubjectModel.prototype.leadTo = ''; 		// subjectId to which to jump when subject finished playing.
ximpel.SubjectModel.prototype.getId = function(){
	return this.subjectId;
}



// ############################################################################
ximpel.MediaSequenceModel = function(){
	// a sequence can contain:
	// - A media item
	// - A ParallelGroup
	this.list = []; 
}
ximpel.MediaSequenceModel.prototype = new ximpel.Model();
ximpel.MediaSequenceModel.prototype.ORDER_DEFAULT = 'default'; 
ximpel.MediaSequenceModel.prototype.ORDER_RANDOM = 'random';
ximpel.MediaSequenceModel.prototype.order = ximpel.MediaSequenceModel.prototype.ORDER_DEFAULT;

ximpel.MediaSequenceModel.prototype.add = function( item ){
	this.list.push( item );
}


// ############################################################################
ximpel.ParallelMediaModel = function(){
	// a ParallelGroup can contain only media items.
	this.list = []; 
}
ximpel.ParallelMediaModel.prototype = new ximpel.Model();
ximpel.ParallelMediaModel.prototype.add = function( item ){
	this.list.push( item );
}


// ############################################################################

ximpel.MediaModel = function(){
	this.overlays = [];
	// this.customAttributes is an array containing objects in the form:
	// [
	//		{'name': 'nameofattribute', 'value': 'attributevalue'}, 
	//		{'name': 'nameofattribute', 'value': 'attributevalue'}
	// ]
	this.customAttributes = {};

	// this.customElements is an array containing objects in the form: 
	// 		{
	//		 'elementName': 'nameofelement', 
	//		 'elementAttributes': [{'name': 'nameofattribute', 'value': 'attributevalue'}, {'name': 'nameofattribute', 'value': 'attributevalue'}] 
	//		}
	this.customElements = [];	
}
ximpel.MediaModel.prototype = new ximpel.Model();
ximpel.MediaModel.prototype.x = 0;
ximpel.MediaModel.prototype.y = 0;
ximpel.MediaModel.prototype.mediaType = null;
ximpel.MediaModel.prototype.duration = 0; // 0 = indefinitely
ximpel.MediaModel.prototype.description = "";
ximpel.MediaModel.prototype.leadsTo = null;
ximpel.MediaModel.prototype.repeat = false;
ximpel.MediaModel.prototype.mediaId = null;


ximpel.MediaModel.prototype.getId = function(){
	return this.mediaId;
}


// ############################################################################

ximpel.ScoreModel = function(){
	this.scoreId = '';
}
ximpel.ScoreModel.prototype = new ximpel.Model();
ximpel.ScoreModel.prototype.scoreValue = 0;
ximpel.ScoreModel.prototype.applyModifier = function( scoreModifier ){
 	this.scoreValue = scoreModifier.modify( this.scoreValue );
 	return this;
}



// ############################################################################

ximpel.ScoreModifierModel = function(){
}
ximpel.ScoreModifierModel.prototype = new ximpel.Model();
ximpel.ScoreModifierModel.prototype.SET= 'set';
ximpel.ScoreModifierModel.prototype.ADD = 'add';
ximpel.ScoreModifierModel.prototype.SUBSTRACT = 'substract';
ximpel.ScoreModifierModel.prototype.MULTIPLY = 'multiply';
ximpel.ScoreModifierModel.prototype.DIVIDE= 'divide';

ximpel.ScoreModifierModel.prototype.scoreId = "";
ximpel.ScoreModifierModel.prototype.operation = ximpel.ScoreModifierModel.prototype.SET;
ximpel.ScoreModifierModel.prototype.value = 0;



// ############################################################################
ximpel.OverlayModel = function(){

}
ximpel.OverlayModel.prototype = new ximpel.Model();
ximpel.OverlayModel.prototype.SHAPE_RECTANGLE = 'rectangle';

//ximpel.OverlayModel.prototype.x = null;
//ximpel.OverlayModel.prototype.y = null;
ximpel.OverlayModel.prototype.waitForMediaComplete = false;
ximpel.OverlayModel.prototype.leadsTo = '';
//ximpel.OverlayModel.prototype.scoreModifier = null;
ximpel.OverlayModel.prototype.startTime = 0;
ximpel.OverlayModel.prototype.duration = 0;
//ximpel.OverlayModel.prototype.text = "";
ximpel.OverlayModel.prototype.shape = "rectangle";
ximpel.OverlayModel.prototype.sides = "100";

//ximpel.OverlayModel.prototype.color = null;
//ximpel.OverlayModel.prototype.opacity = null;
//ximpel.OverlayModel.prototype.hoverColor = null;
//ximpel.OverlayModel.prototype.hoverOpacity = null;
//ximpel.OverlayModel.prototype.textColor = null;
//ximpel.OverlayModel.prototype.textFont = null;
//ximpel.OverlayModel.prototype.textSize = null;


// ############################################################################

ximpel.ConfigModel = function(){
}
ximpel.ConfigModel.prototype = new ximpel.Model();
ximpel.ConfigModel.prototype.assetsDirectory = 'assets';
ximpel.ConfigModel.prototype.videoDirectory = 'media/video';
ximpel.ConfigModel.prototype.pictureDirectory = 'media/pictures';
ximpel.ConfigModel.prototype.audioDirectory = 'media/udio';
ximpel.ConfigModel.prototype.titleScreenImage = 'assets/ximpel_title_screen.png';

// ############################################################################


ximpel.CustomElementModel = function( elementName, elementAttributes ){
	this.elementName = elementName || '';
	this.elementAttributes = elementAttributes || {};
}
ximpel.ConfigModel.prototype = new ximpel.Model();


// ############################################################################

ximpel.ConfigModel.prototype.extend = function( extendWithConfig ){
	var extendWithPropertyNames = Object.getOwnPropertyNames( extendWithConfig );

	extendWithPropertyNames.forEach( function( propertyName ){
		this[propertyName] = extendWithConfig[propertyName];
	}, this );
}



