/* The QuestionManager is used to manage the playback of question(lists) during a media item.
 * - Thq QuestionManager
 *
 * Public methods:
 * - update() - checks whether a question list are ready to be started or a question has exceeded its timelimit.
 * - use() - Resets the question manager and makes it use a different array of question lists to play.
 * - destory() - detroys any active question
 */

ximpel.QuestionManager = function( player, $el, getPlayTime, questionLists ){
	this.player = player;
	this.$el = $el;

	// The getPlayTime argument is a function pointer. 
	// The QuestionManager uses it to get the current playtime of the media item.
	this.getPlayTime = getPlayTime;

	this.queuedQuestionLists = [];
	this.currentQuestionListModel = null;
	this.currentQuestion = null;
	this.questionListsSortedByStartTime = null;
	this.questionListIndexToQueueNext = 0;
	this.questionIndexToStartNext = 0;
	
	if( questionLists ){
		this.use( questionLists, true );
	}
}


ximpel.QuestionManager.prototype.update = function( currentPlayTime ){
	// Check if there are question lists that are ready to be played (ie. their starttime has been reached). if so, then
	// we add them to the list of queued question-lists. The question lists will be played in FIFO order.
	this.checkForQuestionListsToQueue( currentPlayTime );

	// check for current question end
	if( this.currentQuestion && this.currentQuestionListModel ){
		if( currentPlayTime >=  this.currentQuestion.endAt && this.currentQuestion.endAt !== 0 ){
			var view = this.currentQuestion.view;
			// If the question is not yet answered then we hide the question now because the time has passed.
			if( view.isAnswered !== true ){
				view.hideQuestion(); 
			}
		}
	}

	// If there are question lists that are queued for playback and no questionlist 
	// is currently in progress then play the next question list.
	if( this.queuedQuestionLists.length > 0 && !this.currentQuestionListModel && currentPlayTime > 0 ){
		this.playNextQuestionListInQueue( currentPlayTime );
	}
}

ximpel.QuestionManager.prototype.use = function( questionLists, preventReset ){
	if( !preventReset ){
		this.reset();
	}
	// Take the list of overlays from the new questionLists and store them sorted by starttime.
	this.questionListsSortedByStartTime = this.getQuestionListsSortedByStartTime( questionLists );
}


ximpel.QuestionManager.prototype.stop = function(){
	this.reset();
}


ximpel.QuestionManager.prototype.reset = function(){
	if( this.currentQuestion ){
		this.currentQuestion.view.destroy();
	}
	this.queuedQuestionLists = [];
	this.currentQuestionListModel = null;
	this.questionListsSortedByStartTime = null;
	this.questionListIndexToQueueNext = 0;
	this.currentQuestion = null;
	this.questionIndexToStartNext = 0;
}

ximpel.QuestionManager.prototype.checkForQuestionListsToQueue = function( currentPlayTime ){
	for( var i=this.questionListIndexToQueueNext; i<this.questionListsSortedByStartTime.length; i++ ){
		var questionListModel = this.questionListsSortedByStartTime[i];
		if( questionListModel.startTime > currentPlayTime ){
			// The questionlist 'i' does not start yet, so all questionlists after it are also not ready to start yet (they are order by startime).
			return;
		}
		this.queuedQuestionLists.push( questionListModel );
		this.questionListIndexToQueueNext++;
	}
}

ximpel.QuestionManager.prototype.playNextQuestionListInQueue = function( currentPlayTime ){
	var questionListModel = this.queuedQuestionLists.shift(); // get and remove first item from the array.
	if( questionListModel ){
		this.currentQuestionListModel = questionListModel;
		this.playQuestion( this.questionIndexToStartNext, currentPlayTime );
	}
}

ximpel.QuestionManager.prototype.playQuestion = function( index, currentPlayTime ){
	var questionModel = this.currentQuestionListModel.questions[index];
	var questionView = new ximpel.QuestionView( questionModel );

	// The default time limit for all questions in the current question list.
	var defaultTimeLimit = this.currentQuestionListModel.questionTimeLimit;

	// The specific time limit for this question.
	var questionTimeLimit = questionModel.questionTimeLimit;

	// the actual time limit for this question (a time limit of 0 means unlimited)
	var actualTimeLimit = ( !questionTimeLimit && questionTimeLimit !== 0 ) ? defaultTimeLimit : questionTimeLimit;

	// The play time at which the question should stop. (endAt of 0 means there is no end time)
	var endAt = actualTimeLimit === 0 ? 0 : (currentPlayTime+actualTimeLimit);

	// Safe the current question that is being played and all info/object related to this question.
	this.currentQuestion = {
		'index': index,
		'model': questionModel,
		'view': questionView,
		'endAt': endAt
	};

	// The index of the questionList.questions array to play after this question finishes.
	this.questionIndexToStartNext = index+1;

	// When the question is answered...
	questionView.addEventHandler( questionView.EVENT_QUESTION_ENDED, this.handleQuestionAnswer.bind(this, questionModel ) );

	// When the question is ended the nextQuestion() function is called.
	questionView.addEventHandler( questionView.EVENT_QUESTION_ENDED, this.nextQuestion.bind(this) );
	questionView.render( this.$el );
}

ximpel.QuestionManager.prototype.handleQuestionAnswer = function( questionModel, chosenOption ){
	if( questionModel.answer === chosenOption ){
		// If the question is right we apply the variable modifiers for this question.
		// If there are any modifiers for this question, then the player's variables will have
		// changed after this.
		this.player.applyVariableModifiers( questionModel.variableModifiers );
	}
}

ximpel.QuestionManager.prototype.nextQuestion = function(){
	this.currentQuestion.view.destroy();
	this.currentQuestion = null;
	if( this.hasNextQuestion() ){
		this.playQuestion( this.questionIndexToStartNext, this.getPlayTime() );
	} else{
		this.stopQuestionList();
	}
}

ximpel.QuestionManager.prototype.hasNextQuestion = function(){
	return this.currentQuestionListModel.questions[this.questionIndexToStartNext] ? true : false;
}

ximpel.QuestionManager.prototype.stopQuestionList = function(){
	this.questionIndexToStartNext = 0;
	this.currentQuestionListModel = null;
}

// This method sorts the array of question lists that is passed as an argument. The method returns a new array
// containing the question lists but order by start time (ie. the first question list to start is index 0).
ximpel.QuestionManager.prototype.getQuestionListsSortedByStartTime = function( questionLists ){
	// overlays.slice() creates a copy of the overlays array and then sort() sorts them by start time.
	var questionListsSorted = questionLists.slice().sort( function( questionList1, questionList2 ){
		return questionList1.startTime - questionList2.startTime;
	} );
	
	// Return the copy of the overlays array
	return questionListsSorted;
}