ximpel.PubSub = function(){
	this.topics = {};
}

ximpel.PubSub.prototype.reset = function(){
	this.topics = {};
}

ximpel.PubSub.prototype.subscribe = function( topic, func ){
	if( ! this.topics[topic] ){
		this.topics[topic] = [];
	}


	// add the handler function to the array of handlers for the given topic.
	this.topics[topic].push( func );

	return func; // we return the function reference which is used for unsubscribing.
}


ximpel.PubSub.prototype.unsubscribe = function( topic, func ){
	// If the topic doesnt exist then there is no subscription so we just return.
	if( ! this.topics[topic] ){
		return this;
	}

	// The topic exists, so search through all subscriptions for the given topic and look for a subscription with the given token.
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








ximpel.PubSub.prototype.deleteTopic = function( topic ){
	delete this.topics[topic];
	return this;
}

ximpel.PubSub.prototype.hasSubscribers = function( topic ){
	if( this.topics[topic] && this.topics[topic].length > 0 ){
		return true;
	}
}