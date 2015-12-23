ximpel.View = function(){
	// This View() object offers some common functionality that is shared between all views. The View() object is meant to serve as the prototype
	// for other objects which implement the specific details of the view. For instance the prototype of the OverlayView() is set to: new ximpel.View(); 
	// As there will be many instances of OverlayView() and each instance has the same View() prototype, this View() object should not store any
	// instance specific data on itself. Whenever one of the methods of the View() stores something by doing:
	//		this.propertyName = value;
	// the 'this' keyword will not refer to the View() itsself but will always refer to a "child" object which has a View() object as its prototype.
	// ie. the this keyword will point to the OverlayView() instance and not to the View() object.
	// This is because the method is always called via the OverlayView instance and thus will the 'this' keyword be bound to that object.
}
ximpel.View.prototype.RENDER_EVENT = 'view_render';
ximpel.View.prototype.ATTACH_EVENT = 'view_attach';
ximpel.View.prototype.DETACH_EVENT = 'view_detach';
ximpel.View.prototype.DESTROY_EVENT = 'view_destroyed';


// The init() function must be called at the top of the constructor of the object that has an instance of this View() object as its prototype.
// So for example if you implement a OverlayView() class then in the constructor of that class you must call this.init() at the top. Passing
// the model and optionally an element in which the view is rendered as arguments.
ximpel.View.prototype.init = function( model, el ){
	// Create a publish subscribe object used by View() to register callback functions  for certain events and to trigger 
	// the callbacks when those events happen. Note that since this method is used in the .init() method (which is called by a
	// child instance of this view class), the 'this' keyword will point to that child instance and thus the pubSub will be only 
	// for that child instance and not all child instances.

	this.pubSub = new ximpel.PubSub();

	// The el property is the view's actual DOM element. This element is being appeneded to the DOM in order to make it visible on the page.
	el = el || $( document.createElement('div') );

	// If a non-jquery wrapped object was passed then wrap it as a jquery element.
	this.$el = ximpel.wrapInJquery( el );

	// The model on which to base the rendering of the view 
	this.model = model;
}


// The render() method is the method that should be called to render the view. It calls the renderView() method on the "child" object
// which is the object that the 'this' keyword points to. This means that each child object should implement the renderView() method.
// So for example if we have an OverlayView() class which has a new ximpel.View() as its prototype then we do:
// 		var overlayView = new ximpel.OverlayView(...);
// 		overlayView.render();
// in order to render the view. A newParentElement can be specified as an argument. By doing so, the view will be detached from any DOM 
// element that it is currently attached to and then re-attached to the newParentElement.
// The render() method throws a RENDER_EVENT, callback functions can be registered to be called when such an event happens by using the
// onRender() method: overlayView.onRender( callbackFunc );
// newParentElement must be a jquery object.
ximpel.View.prototype.render = function( $newParentElement ){
	if( this.renderView ){
		this.renderView( $newParentElement ); 
	}
	
	// If a new parent is specified then detach the view and re-attach it to the specified parent element.
	var $currentParentElement = this.$el.parent();
	if( $newParentElement && $currentParentElement[0] !== $newParentElement[0] ){
		this.detach();
		this.attachTo( $newParentElement );
	}

	// Throw a render event, causing all callbacks registered with onRender() to be called.
	this.pubSub.publish( this.RENDER_EVENT );
	return this;
}

// The destroy method removes the DOM-element of the view from the DOM. Additionally it sets all data of the view to NULL. 
// If the child object has a function called destroyView() this will be called first. After the destroyView() method is 
// finished the element is removed from the DOM if it is not already and then all data is NULL'ED.
ximpel.View.prototype.destroy = function(){
	// First call the more specific destroy function if it has been overwritten.
	if( this.destroyView && typeof this.destroyView === "function" ){
		this.destroyView();
	}

	// If the the this.$el hasnt been unset yet, then do it now.
	if( this.$el ){
		this.$el.remove();
	}
	this.$el = null;
	this.model = null;

	// Throw a destroy event, causing all callbacks registered with onDestroy() to be called.
	// This is only thrown if the child's destroyView() method has not already unset the pubSub property.
	if( this.pubSub ){
		this.pubSub.publish( this.DESTROY_EVENT );
	}
	this.pubSub = null;

	return;
}

// The attachTo method is used to attach the view's DOM element to another parent DOM element.
ximpel.View.prototype.attachTo = function( elementToAttachTo ){
	// jQuery's appendTo moves the element on which it is called to the parent element specified in its argument.
	this.$el.appendTo( elementToAttachTo );

	// Throw a attach event, causing all callbacks registered with onAttach() to be called.
	this.pubSub.publish( this.ATTACH_EVENT );
	return this;
}

// The detach method detaches the view's DOM element from the DOM. This does not delete the element it just makes sure
// it is not part of the DOM tree anymore and as such it is not visible.
ximpel.View.prototype.detach = function(){
	this.$el.detach();

	// throw a detach event, causing all callbacks registered with onDetach() to be called.
	this.pubSub.publish( this.DETACH_EVENT );
	return this;
}

// This allows the child object to register a callback for when the view's DOM element is clicked once. The callback function
// will only be called on the first click, after that the registered callback function is removed.
ximpel.View.prototype.onOneClick = function( callback ){
	this.$el.one('click', callback );
	return this;
}

// This allows the child object to register a callback for when the view's DOM element is clicked. The callbacks are called
// for each click on the view's DOM element.
ximpel.View.prototype.onClick = function( callback ){
	this.$el.click( callback );
	return this;
}

// This allows the child object to register a callback for when the view is rendered.
ximpel.View.prototype.onRender = function( callback ){
	this.pubSub.subscribe( this.RENDER_EVENT, callback );
	return this;
}

// This allows the child object to register a callback for when the view is updated.
ximpel.View.prototype.onUpdate = function( callback ){
	this.pubSub.subscribe( this.UPDATE_EVENT, callback );
	return this;
}

// This allows the child object to register a callback for when the view is attached to a DOM element.
ximpel.View.prototype.onAttach = function( callback ){
	this.pubSub.subscribe( this.ATTACH_EVENT, callback );
	return this;
}
// This allows the child object to register a callback for when the view is detached from a DOM element.
ximpel.View.prototype.onDetach = function( callback ){
	this.pubSub.subscribe( this.DETACH_EVENT, callback );
	return this;
}
ximpel.View.prototype.setElement = function( el ){
	this.$el = el instanceof Jquery ? el : $( el );
	return this;
}