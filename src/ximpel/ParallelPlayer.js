// ############################################################################

// ############################################################################
ximpel.ParallelPlayer = function(){
	this.parallelPlayer = new ximpel.ParallelPlayer();
	this.mediaPlayer = new ximpel.MediaPlayer();
	this.currentSequence = null;
	this.pubSubLayer = new ximpel.PubSub();
};


ximpel.ParallelPlayer.prototype.play = function( sequence ){
	// set current sequence to the given sequence.
	// 
	return this;
}









ximpel.ParallelPlayer.prototype.publish = function( topic, data ){
	this.pubSubLayer.publish( topic, data );
	return this;
}
ximpel.ParallelPlayer.prototype.subscribe = function( topic, callback ){
	this.pubSubLayer.subscribe( topic, callback );
	return this;
}
ximpel.ParallelPlayer.prototype.unsubscribe = function( topic, token ){
	this.pubSubLayer.unsubscribe( topic, token );
	return this;
}