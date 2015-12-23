$( document ).ready(function(){
	SyntaxHighlighter.all();
	$( "#mainMenu" ).accordion({
		"heightStyle": "content",
		"collapsible": true,
		"active": activeSection
	});
} );