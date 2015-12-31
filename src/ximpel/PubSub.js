// PubSub()
// The PubSub object is a publish subscribe system. It allows you to subscribe a callback function 
// for a certain topic (ie. event). This is done with the subscribe(<event>,<callback>) method. Then 
// With the publish(<event>) method you can throw the event, causing all registered functions to be 
// called. This makes it easy to listen for events and throw these events. For example:
// 		var pubSub = new ximpel.PubSub();
// 		pubSub.subscribe('playerEnded', function(){
// 			alert("player has ended");
// 		} );
// then somewhere else in your code you can do:
//		pubSub.publish('playerEnded');
// which will cause your registered event handler to be called.

ximpel.PubSub = function(){
	this.topics = {};
}

// Resets the PubSub causing all subscribed functions to be lost.
ximpel.PubSub.prototype.reset = function(){
	this.topics = {};
}



// Subscribe a function for a certain event/topic.
ximpel.PubSub.prototype.subscribe = function( topic, func ){
	if( ! this.topics[topic] ){
		this.topics[topic] = [];
	}

	// add the handler function to the array of handlers for the given topic.
	this.topics[topic].push( func );

	// we return the function reference which can be used for unsubscribing the function again.
	return func; 
}



// Unsubscribe a function that was previously subscribed for a certain topic/event.
ximpel.PubSub.prototype.unsubscribe = function( topic, func ){
	// If the topic doesnt exist then there is no subscription so we just return.
	if( ! this.topics[topic] ){
		return this;
	}

	// The topic exists, so search through all subscriptions for the given topic 
	// and look for a subscription with the given token.
	var topicSubscriptions = this.topics[topic];

	for( var i=0; i<topicSubscriptions.length; i++ ){
		var subscription = topicSubscriptions[i];

		// Check if the current subscription is equal to the function which must be unsubscribed.
		if( subscription == func ){

			// the current subscription is the subscription that must be unsubscribed so we splice it out of the array.
			topicSubscriptions.splice( i, 1 ); 
			
			// We removed a subscription, now we check if there are any subscriptions left, if not, we remove the topic.
			if( topicSubscriptions.length <= 0 ){
				delete this.topics[topic];
			}
		}
	}

	return this;
}



// Publish an event/topic. This causes all subscribed functions for that event/topic to be called.
ximpel.PubSub.prototype.publish = function( topic, data ){
	// Check if there are any subscribers for this topic, if not we just return.
	if( !this.topics[topic] || this.topics[topic].length <= 0 ){
		return this;
	}

	var topicSubscriptions = this.topics[topic];
	for( var i=0; i<topicSubscriptions.length; i++ ){
		var callback = topicSubscriptions[i];
		callback( data );
	}
	
	return this;
}



// This method deletes a specific topic. Causing all registered functions for 
// that topic/event to be removed.
ximpel.PubSub.prototype.deleteTopic = function( topic ){
	delete this.topics[topic];
	return this;
}



// Checks whether there are subscribed functions for the given topic/event.
ximpel.PubSub.prototype.hasSubscribers = function( topic ){
	if( this.topics[topic] && this.topics[topic].length > 0 ){
		return true;
	}
}