// This OverlayView() object is used to create views of overlays which can be rendered. This is a child object of the View() and as 
// such it has a new ximpel.View() object as its prototype, which allows the overlayView to use common view functionalities.
ximpel.OverlayView = function( overlayModel, overlayElement ){
	// All view implementations should call the init method of their prototype.
	this.init( overlayModel, overlayElement );
}

// Create a new View() object and set it as the prototype for OverlayView(). This means that all instances of OverlayView will have that View() object as prototype.
ximpel.OverlayView.prototype = new ximpel.View();

// Constants..
ximpel.OverlayView.prototype.SHAPE_RECTANGLE = 'rectangle';
ximpel.OverlayView.prototype.SHAPE_SQUARE = 'square';
ximpel.OverlayView.prototype.SHAPE_OVAL = 'oval';
ximpel.OverlayView.prototype.SHAPE_CIRCLE = 'circle';
ximpel.OverlayView.prototype.CSS_OVERYLAY_CLASS = 'overlay';
ximpel.OverlayView.prototype.CSS_OVERLAY_OVAL_CLASS = 'overlayOval';
ximpel.OverlayView.prototype.CSS_NO_SELECT_CLASS = 'noSelect';


// The renderView() method is mandatory to implement for any object that wants to be a view and has a View() object as prototype.
// This renderView() will be run when render() is called which is implemented in the prototype (a View() object).
// So this is called when doing: new ximpel.OverlayView(...).render();
ximpel.OverlayView.prototype.renderView = function(){
	var model = this.model;

	// Create and style the main overlay element.
	var $el = $("<div></div>")
	.addClass(this.CSS_NO_SELECT_CLASS)
	.addClass(this.CSS_OVERYLAY_CLASS)
	.css({
		'top': model.y,
		'left': model.x
	});

	// Create a span element inside the overlay's main element which will contain the text of the overlay.
	var $span = $("<span></span>").text( 
		model.text 
	).css({
		'color': model.textColor
	});

	// Apply styles as specified in the model.
	this.restyleSpan( $span, model );


  	// Create a div to apply the background for the overlay to. The reason we have a seperate element for the background is because
  	// in css is is only possible to change background opacity (without also changing text opacity) by using rgba() but that would mean
  	// we have to convert the hex color code or the color name to rgb values (as rgba cannot only set the alpha). Getting these rgb values
  	// for hex color codes and names is a hassle, so we decided to just create a seperate div to which the background/opacity is defined.
	var $elForBg = $('<div></div>');

	// Apply styles as specified in the model.
	this.restyleBackground( $el, $elForBg, model );

	// Check which shape has been chosen and make that shape using CSS.
	switch( model.shape ){
		case this.SHAPE_RECTANGLE: 	this.makeRectangle( $el, model.width, model.height ); break;
		case this.SHAPE_SQUARE: 	this.makeSquare( $el, model.sides ); break;
		case this.SHAPE_OVAL: 		this.makeOval( $el, model.width, model.height ); break;
		case this.SHAPE_CIRCLE: 	this.makeOval( $el, model.diameter, model.diameter ); break;
	}
	
	// Add the background div to $el which will become the main overlay view DOM element.
	$el.append( $elForBg );

	// Add the span to $el which will become the main overlay view DOM element.
	$el.append( $span );

	// Remove the view's current DOM element.
	this.$el.remove();

	// Set $el as the view's new main DOM element.
	this.$el = $el;
}



// implement a destroyView method which is called when the overlayView.destroy() method is called.
ximpel.OverlayView.prototype.destroyView = function(){

}


// Apply styles to the span that contains the text of the overlay as specified in the model.
ximpel.OverlayView.prototype.restyleSpan = function( $span, model ){
	if( model.fontSize ) 	$span.css('font-size', model.fontSize );
	if( model.fontFamily ) 	$span.css('font-family', model.fontFamily );
	if( model.textAlign ) 	$span.css('text-align', model.textAlign );
	if( model.color ) 		$span.css('color', model.color );
}


// Apply styles to the element that is used only to give the overlay a background if required.
ximpel.OverlayView.prototype.restyleBackground = function( $el, $elForBg, model ){
	if( model.backgroundImage ){
		$elForBg.css({
			'background-image': 'url('+model.backgroundImage+')',
			'background-size': 'cover',
			'background-repeat': 'no-repeat',
			'background-position': 'center center'
		} );
	}

	if( model.opacity ) 		$elForBg.css('opacity', model.opacity );
	if( model.backgroundColor ) $elForBg.css('background-color', model.backgroundColor );

}


// If the specified shape was a rectangle, then this function will apply styles to the given element to make it a rectangle.
ximpel.OverlayView.prototype.makeRectangle = function( el, width, height ){
	console.log( width );
	width = this.ensureUnit(width,'px');
	height = this.ensureUnit(height,'px');
	el.css({
		'width': width,
		'height': height,
		'line-height': height,
	});
	return this;
}

// If the specified shape was a square, then this function will apply styles to the given element to make it a square.
ximpel.OverlayView.prototype.makeSquare = function( el, sides ){
	sides = this.ensureUnit(sides,'px');
	el.css({
		'width': sides,
		'height': sides,
		'line-height': sides,
	});
	return this;
}

// If the specified shape was an oval, then this function will apply styles to the given element to make it an oval.
ximpel.OverlayView.prototype.makeOval = function( el, width, height ){
	width = this.ensureUnit(width,'px');
	height = this.ensureUnit(height,'px');
	el.addClass(this.CSS_OVERLAY_OVAL_CLASS);
	el.css({
		'width': width,
		'height': height,
		'line-height': height,
		'border-radius': '50%'
	});
	return this;
}

// This function takes a value and checks if the value is numeric, if it is then no units have been specified.
// We then add the specified units to the value or if no unit to use was specified then we just add "px" to the value.
// ie. if value is '6' and unit is 'px' then the return value will be '6px'
ximpel.OverlayView.prototype.ensureUnit = function( value, unit ){
	// If the last character of value is numeric, then it doesn't have units specified so we add the specified unit or 'px' if none was specified.
	var unit = unit || 'px';

	if( this.isNumeric( value.toString().slice(-1) ) ){
		return value+unit;
	} else{
		return value; // the value doens't end with a number so it already has a unit specified.
	}
}

// Check if a value is numeric or not.
ximpel.OverlayView.prototype.isNumeric = function( num ){
    return (num > 0 || num === 0 || num === '0' || num < 0) && num !== true && isFinite(num);
}