
export default {
	el : function(name) {return document.createElement(name)},
	atr : function(el, name, value) {el.setAttribute(name, value)},
	txt : function(text) {return document.createTextNode(text)},
	cmm : function(text) {return document.createComment(text)},
	add : function(el, child) {el.appendChild(child); return child;},
	df : function() {return document.createDocumentFragment()}
};

