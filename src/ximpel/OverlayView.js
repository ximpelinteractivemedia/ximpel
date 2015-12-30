// OverlayView()
// This object is used to create a view of an overlay (ie. to visualize the overlay by adding an element to the DOM)
// This is a child object of the View() and as such it has a new ximpel.View() object as its prototype, which allows the overlayView to use common view functionalities.

// ########################################################################################################################################################

// TODO:
// - Overlay text is messed up when it doesnt fit on one line right now. This is because we use css
//   line-height to center it vertically. 


ximpel.OverlayView = function( overlayModel, overlayElement ){
	// All view implementations should call the init method of their prototype.
	this.init( overlayModel, overlayElement );
}
// Create a new View() object and set it as the prototype for OverlayView(). This means that all instances of OverlayView will have that View() object as prototype.
ximpel.OverlayView.prototype = new ximpel.View();

// Constants
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

	// Create and style the main overlay element (a <div>).
	var $el = $("<div></div>")
	.addClass(this.CSS_NO_SELECT_CLASS)
	.addClass(this.CSS_OVERYLAY_CLASS)
	.css({
		'top': model.y,
		'left': model.x
	});

	// Create a span element inside the overlay's main element which will contain the text of the overlay.
	var $span = $("<span></span>");
	if( model.text ){
		$span.text( model.text );
	}


  	// Create a div to apply the background for the overlay to. The reason we have a seperate element for the background is because
  	// in css is is only possible to change background opacity (without also changing text opacity) by using an rgba() value for the css
  	// background-color property, but that would mean we would have to convert the hex color code or the color name to rgb values (because
  	// if you use rgba you have to set the value for red, green, blue and alpha and cannot only set the alpha). Getting these rgb values
  	// for hex color codes and names is a hassle, so we decided to just create a seperate div to which the background/opacity is defined.
	var $elForBg = $('<div></div>');

	// Add the background div to $el which will become the main overlay view DOM element.
	$el.append( $elForBg );

	// Add the span to $el which will become the main overlay view DOM element.
	$el.append( $span );

	// Check which shape has been chosen and make that shape using CSS.
	switch( model.shape ){
		case this.SHAPE_RECTANGLE: 	this.makeRectangle( $el, model.width, model.height ); break;
		case this.SHAPE_SQUARE: 	this.makeSquare( $el, model.side ); break;
		case this.SHAPE_OVAL: 		this.makeOval( $el, model.width, model.height ); break;
		case this.SHAPE_CIRCLE: 	this.makeCircle( $el, model.diameter ); break;
	}
	
	// Set the styling of the overlay according to whats specified in the overlay model.
	this.setInitialOverlayStyle( $el, model );

	// Change styling when the mouse hovers over the overlay
	$el.mouseover( function(){
		this.setHoverOverlayStyle( $el, model );
	}.bind(this) ); 

	// Change styling when the mouse leaves of the overlay.
	$el.mouseout( function(){
		this.setNonHoverOverlayStyle( $el, model );
	}.bind(this) );

	// Remove the view's current DOM element.
	this.$el.remove();

	// Set $el as the view's new main DOM element.
	this.$el = $el;
}



// This method styles the overlayView's element to its initial styling that is specified in the OverlayModel
ximpel.OverlayView.prototype.setInitialOverlayStyle = function( $el, model ){
	$el.children("span").css({
		'text-align': model.textAlign
	});

	if( model.backgroundImage ){
		$el.children("div").css({
			'background-image': 'url('+model.backgroundImage+')',
			'background-size': 'cover',
			'background-repeat': 'no-repeat',
			'background-position': 'center center'
		} );
	}
	this.setNonHoverOverlayStyle( $el, model );
}



// This method sets some styling for when the overlay is not being hovered.
ximpel.OverlayView.prototype.setNonHoverOverlayStyle = function( $el, model ){
	$el.children("span").css({
		'color': model.textColor,
		'font-size': model.fontSize,
		'font-family': model.fontFamily
	} );
	$el.children("div").css({
		'opacity': model.opacity,
		'background-color': model.backgroundColor
	});
}



// This method sets some styling for when the overlay is being hovered.
ximpel.OverlayView.prototype.setHoverOverlayStyle = function( $el, model ){
	$el.children("span").css({
		'color': model.hoverTextColor || model.textColor,
		'font-size': model.hoverFontSize || model.fontSize,
		'font-family': model.hoverFontFamily || model.fontFamily
	});
	$el.children("div").css({
		'opacity': model.hoverOpacity,
		'background-color': model.hoverBackgroundColor || model.backgroundColor
	});
}



// implement a destroyView method which is called when the overlayView.destroy() method is called.
ximpel.OverlayView.prototype.destroyView = function(){
	//	console.log("view destroyed!");
}



// If the specified shape was a rectangle, then this function will apply styles to the given element to make it a rectangle.
ximpel.OverlayView.prototype.makeRectangle = function( el, width, height ){
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
ximpel.OverlayView.prototype.makeSquare = function( el, side ){
	this.makeRectangle( el, side, side );
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

// If the specified shape was a circle, then this function will apply styles to the given element to make it a circle.
ximpel.OverlayView.prototype.makeCircle = function( el, diameter ){
	this.makeOval( el, diameter, diameter );
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