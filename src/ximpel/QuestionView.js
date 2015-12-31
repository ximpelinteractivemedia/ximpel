// QuestionView()
// The QuestionView object just displays a question based on a question model.
// This object is used to create a view of a question (ie. to visualize the question by adding an element to the DOM)
// This is a child object of the View() and as such it has a new ximpel.View() object as its prototype, which allows
// the overlayView to use common view functionalities.

//
ximpel.QuestionView = function( questionModel, questionElement ){
	// All view implementations should call the init method of their prototype.
	this.init( questionModel, questionElement );

	// The font size of the Question text.
	this.questionFontSize = "40px";
	
	// This wills store the index of the question that will play next.
	this.nextQuestionIndex = 0;

	// The container html element in which the options of the question will be shown
	this.$optionsContainer = null;

	// Indicates if the question is answered.
	this.isAnswered = false;

	// When a question is answered a timeout is set, this is the handler for the timeout.
	this.timeoutHandlerQuestionAnsweredPause = null;
}

// Create a new View() object and set it as the prototype for QuestionView(). 
// This means that all instances of QuestionView will have that View() object as prototype.
ximpel.QuestionView.prototype = new ximpel.View();
ximpel.QuestionView.prototype.EVENT_QUESTION_ANSWERED = 'answered';
ximpel.QuestionView.prototype.EVENT_QUESTION_ENDED = 'ended';
ximpel.QuestionView.prototype.CSS_QUESTION_CLASS = 'question';
ximpel.QuestionView.prototype.CSS_QUESTION_TEXT_CLASS = 'questionText';
ximpel.QuestionView.prototype.CSS_QUESTION_OPTION_CLASS = 'questionOption';
ximpel.QuestionView.prototype.CSS_NO_SELECT_CLASS = 'noSelect';


// The renderView() method is mandatory to implement for any object that wants to be a view and has a View() object as prototype.
// This renderView() will be run when render() is called which is implemented in the prototype (a View() object).
// So this is called when doing: new ximpel.QuestionView(...).render();
ximpel.QuestionView.prototype.renderView = function(){
	var model = this.model;

	// The main element that functions as a wrapper.
	var $question = this.$question = $("<div></div>")
	.addClass(this.CSS_QUESTION_CLASS)
	.addClass(this.CSS_NO_SELECT_CLASS)
	.css({
		'text-align': 'center',
		'width': '100%',
		'min-height': '100px',
		'top': '15%',
		'left': '0px',
		'font-size': this.questionFontSize,
		'padding': '0px 0px 0px 0px'
	});

	// The element for the question itself.
	var $questionTextContainer = $("<div></div>")
	.addClass( this.CSS_QUESTION_TEXT_CLASS )
	.css({
		'background-color': 'rgba( 0, 0, 0, 0.8 )',
		'color': 'white',
		'float': 'left',
		'width': '70%',
		'padding': '10px 0px 10px 0px',
		'margin': '0px 15% 0px 15%'
	}).html( model.questionText );

	// The container element for the options.
	var $optionsContainer = $("<div></div>")
	.css({
		'float': 'left',
		'width': '70%',
		'padding': '0px 15% 0px 15%',
	});

	// Add the options to the container element.
	for( var i=0; i<model.options.length; i++ ){
		var optionModel = model.options[i];
		var $option = $('<span></span>').css({
			'background-color': 'rgba( 255, 255, 255, 0.7 )',
			'color': 'black',
			'display': 'block',
			'cursor': 'pointer',
			'width': '100%',
			'padding': '10px 0px 10px 0px'
		}).mouseover( function() {
    		$(this).css("background-color","rgba( 255, 255, 255, 0.9 )");
		}).mouseout( function() {
    		$(this).css("background-color","rgba( 255, 255, 255, 0.7 )");
		}).addClass( this.CSS_QUESTION_OPTION_CLASS );

		// Define what happens when the option is clicked.
		$option.one('click', function( $optionsContainer, $option, chosenOption ){
			this.questionAnswerHandler( $optionsContainer, $option, chosenOption );
		}.bind(this, $optionsContainer, $option, optionModel.optionName ) )

		var text = optionModel.optionText;
		var $optionText = $( document.createTextNode( text ) );
		$option.append( $optionText );
		$optionsContainer.append( $option );
	}

	// Add the question text and the options to the question wrapper element.
	$question.append( $questionTextContainer );
	$question.append( $optionsContainer );
	this.$optionsContainer = $optionsContainer;

	// Remove the view's current DOM element.
	this.$el.remove();

	// Set $el as the view's new main DOM element.
	this.$el = $question;
}



// The method that will be called when the question is answered.
ximpel.QuestionView.prototype.questionAnswerHandler = function( $optionsContainer, $option, chosenOption ){
	this.isAnswered = true;

	// find all the <option> elements.
	var $options = $optionsContainer.find('.'+this.CSS_QUESTION_OPTION_CLASS);

	// Turn off the hover effect of the options now that the answere is given.
	$options.off('mouseover mouseout click');

	// Depending on the corectness of the answer change the background color of the chosen option
	if( this.model.answer === chosenOption ){
		$option.css('background-color', 'rgba(0, 255, 0, 0.7)');		
	} else{
		$option.css('background-color', 'rgba(255, 0, 0, 0.7)');
	}

	// After one second hide the question using an animation. When the animation finishes, publish an event
	// that indicated the question has ended.
	this.timeoutHandlerQuestionAnsweredPause = setTimeout( function(){
		this.$el.fadeOut( 400, function(){
			this.pubSub.publish( this.EVENT_QUESTION_ENDED, chosenOption );
		}.bind(this) );
	}.bind(this), 1000 );

	// publish an event that the question has been answered.
	this.pubSub.publish( this.EVENT_QUESTION_ANSWERED, chosenOption );
}



// Hide the question using an animation. This method is used by the QuestionManager
// if the user did not give an answer in time.
ximpel.QuestionView.prototype.hideQuestion = function(){
	var $options = this.$optionsContainer.find('.'+this.CSS_QUESTION_OPTION_CLASS);
	$options.off('mouseover mouseout click');
	this.$el.fadeOut( 400, function(){
		this.pubSub.publish( this.EVENT_QUESTION_ENDED );
	}.bind(this) );
}



// Add an event handler to this QuestionView. This is done by the QuestionManager
// to find out when a question has been answered/ended.
ximpel.QuestionView.prototype.addEventHandler = function( eventName, callback ){
	switch( eventName ){
		case this.EVENT_QUESTION_ENDED:
			return this.pubSub.subscribe( this.EVENT_QUESTION_ENDED, callback );
		case this.EVENT_QUESTION_ANSWERED:
			return this.pubSub.subscribe( this.EVENT_QUESTION_ANSWERED, callback );
		default:
			ximpel.warn("QuestionView.addEventHandler(): event type '" + eventName + "' is not supported.");    
			return null;
	}
}



// Remove an event handler.
ximpel.QuestionView.prototype.removeEventHandler = function( eventName, callback ){
	switch( eventName ){
		case 'end':
			this.pubSub.unsubscribe( this.EVENT_QUESTION_ENDED, callback ); 
			return 	true;
		default: 
			ximpel.warn("QuestionView.removeEventHandler(): event type '" + eventName + "' is not supported. Can't add/remove event handlers of this type.");
			return false;
	}
}


// implement a destroyView method which is called when the destroy() method is called.
ximpel.QuestionView.prototype.destroyView = function(){
	// Remove a jquery animation that may be in progress.
	this.$el.stop( true ); // any callbacks for the animation complete will not be called.
	clearTimeout( this.timeoutHandlerQuestionAnsweredPause );
}