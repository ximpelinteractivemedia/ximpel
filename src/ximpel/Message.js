var Message = function( customElements, customAttributes, $el ){
    this.customElements = customElements;
    this.customAttributes = customAttributes;
    this.$parentElement = $el;
 
    this.$messageSpan = $('<span></span>');
    this.$messageSpan.html( customAttributes.text );
    this.$messageSpan.css({
        'color': 'red',
        'font-size': '100px'
    });
 
    this.state = 'stopped';
}
Message.prototype = new ximpel.MediaType();
 
Message.prototype.mediaPlay = function(){
    this.state = 'playing';
    this.$parentElement.append( this.$messageSpan );
    setTimeout( function(){
        this.ended();
    }.bind(this), 3000 );
}
 
Message.prototype.mediaPause = function(){
    this.state = 'paused';
}
 
Message.prototype.mediaStop = function(){
    this.state = 'stopped';
    this.$messageSpan.detach();
}
 
Message.prototype.mediaIsPlaying = function(){
    return this.state === 'playing';
}
 
Message.prototype.mediaIsPaused = function(){
    return this.state === 'paused';
}
 
Message.prototype.mediaIsStopped = function(){
    return this.state === 'stopped';
}

// Register the media type with XIMPEL
var r = new ximpel.MediaTypeRegistration( 'message', Message, {
        'allowedAttributes': ['text'],
        'requiredAttributes': ['text'],
        'allowedChildren': [],
        'requiredChildren': [],
} );
ximpel.registerMediaType( r );