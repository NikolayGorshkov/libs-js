# TDOM

TDOM, or template-DOM, is a JavaScript templating library that allows you to write templates using HTML-based syntax, and convert them to browser DOM API calls.

Main purpose of this library is to gain control over DOM manipulation and transformations at the time, the DOM is being created, with possibility to add custom logic, clone nodes, add event listeners, etc. This 

Another reason to use this approach is to be able to intercept DOM nodes creation and do some post-processing afterwards.

Template syntax is inspired by Underscore templates and JSP. The result of conversion is, like in Underscore templates, a JavaScript function, that can be called and returns generated DOM as a result. 

The library contains just the logic for templates parsing and transformation to JS code. Converting the code to real JavaScript object and integrating the library into the project will be covered in another plug-ins.

For example, the following template:

```js
<header>
	<h1>Header</h1>
</header>
<nav>Navigation</nav>
<% for (let i = 0; i < 10; i++) { %>
    <section id="<%= "main_" + i %>">text: <%= i %></section>
<% } %>
<footer>Footer</footer>
```

will be converted to:

```js
export default function(actions, el) {
	if (el == null) {
		el = actions.df();
	}
	{
		let parent = el;
		el = actions.el("header");
		actions.add(parent, el);
		{
			let parent = el;
			el = actions.el("h1");
			actions.add(parent, el);
			actions.add(el, actions.txt(`Header`));
			el = parent;
		}
		el = parent;
	}
	{
		let parent = el;
		el = actions.el("nav");
		actions.add(parent, el);
		actions.add(el, actions.txt(`Navigation`));
		el = parent;
	}
	for (let i = 0; i < 10; i++) { 
		{
			let parent = el;
			el = actions.el("section");
			actions.add(parent, el);
			actions.atr(el, "id", ( "main_" + i ));
			actions.add(el, actions.txt(`text: `));
			actions.add(el, actions.txt( i ));
			el = parent;
		}
	} 
	{
		let parent = el;
		el = actions.el("footer");
		actions.add(parent, el);
		actions.add(el, actions.txt(`Footer`));
		el = parent;
	}
	return el;
}
```

Note: the library is not intended to be a full-features HTML parser. It is just a easier way to write DOM API calls. It has, for example, the following limitations:

- All tags must be closed (with closing tag, or self-closing)
- Only double quotes supported for attribute values
- Attributes without values (like *checked*) are not supported
- There is no support for automatically added elements (like tbody for table)

In other words - what you write in HTML is translated to DOM API calls as is.

The resulting JavaScript code generated from the template is intended to be compressed and minified later on by the transpiler and minifier used in the target project.

There also exists demo project - tdom-demo.


## Supported syntax:

### <% %> - JavaScript code block
```js
<%
let x = 185;
function acceptNode(node) {
    console.log(node);
}
%>
<% for (let i = 0; i < 10; i++) { %>
    <section>Section #<%= i %></section>
<% } %>
```

### <%= "" %> - Inserting text in DOM nodes or use the text in attribute values
```js
<section id="<%= "main_" + i %>">Location: <%= window.location %></section>
```

### <%+ domNode %> - Inserting DOM nodes in the tree
```js
<% let div = document.createElement('div'); %>
<section><%+ div %></section>
```

### <%! %> - Statements to be put before the DOM-generating function
```js
<%!
import Utils from "/app/utils/Utils.js";
%>
```

### DOM-generating expressions

Every code block ending with "(" or "=" starts a function wrapper in the resulting code, adding all following elements into the newly created document fragment, and every code block beginning with ")", ";", or "," finishd the wrapper.

```js
<%
// saves document fragment with H1 element in variable h1
let h1 = %><h1>HEADER</h1><% ;

%>

// passes document fragment with generated DOM into the function
<% acceptNode( %>
    <section>
	    <%
	    let loc = window.location.href;
	    %>
	    Location: <%= loc %>
    </section>
<% ); %>
```
