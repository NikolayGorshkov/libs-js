
const tokenChangeListener = {
    textBuffer : '',
    tokenChanged(previousType, newType, ctx) {
        if (previousType !== TOKENS.TEXT) {
            return;
        }
        //let text = this.textBuffer.trim();
        let text = this.textBuffer;
        if (text.trim().length === 0) {
            return;
        }
        text = text.replace(/(^\s+|\s+$)/g, ' ');
        //console.log('__TEXT:' + this.textBuffer);
        ctx.addText(text);
        this.textBuffer = '';
    }
};

// TOKEN NAMES ORDER IN ARRAYS MATTERS!!!

const CONTENT_TOKENS = ['CODE_HEADER_START', 'CODE_RETURN_TEXT_START', 'CODE_RETURN_DOM_START', 'CODE_NO_RETURN_START', 'HTML_COMMENT_START', 'CLOSE_TAG_START', 'TAG_START', 'TEXT'];

const TOKENS = {
    TEXT : {
        nextToken : CONTENT_TOKENS,
        matches() {
            return true;
        },
        consume(buffer, ctx) {
            //console.log('C:TEXT:' + buffer);
            tokenChangeListener.textBuffer += buffer;
        },
        clearBuffer : true,
        leaveSpacesAfterStart : true
    },
    TAG_START : {
        nextToken : ['TAG_NAME_START'],
        matches(buffer, ctx) {
            return buffer === '<';
        },
        consume(buffer, ctx) {
            // noop
            //console.log('C:TAG_START:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    TAG_NAME_START : {
        nextToken : ['TAG_NAME_END'],
        matches(buffer, ctx) {
            return /[a-z0-9_-]/i.test(buffer);
        },
        consume(buffer, ctx) {
            //console.log('C:TAG_NAME_START:' + buffer);
            ctx.rollbackChars(1);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    TAG_NAME_END : {
        nextToken : ['ATTRIBUTE_NAME_START', 'TAG_SELF_CLOSE', 'TAG_END'],
        matches(buffer, ctx) {
            return !/[a-z0-9_-]/i.test(ctx.nextChars(1));
        },
        consume(buffer, ctx) {
            //console.log('C:TAG_NAME_END:' + buffer);
            ctx.beginStartElement(buffer.toLowerCase());
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    TAG_END : {
        nextToken : CONTENT_TOKENS,
        matches(buffer, ctx) {
            return buffer === '>';
        },
        consume(buffer, ctx) {
            //console.log('C:TAG_END:' + buffer);
            ctx.tagEnd();
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    TAG_SELF_CLOSE : {
        nextToken : CONTENT_TOKENS,
        matches(buffer, ctx) {
            return buffer === '/>';
        },
        consume(buffer, ctx) {
            //console.log('C:TAG_SELF_CLOSE:' + buffer);
            ctx.tagEnd();
            ctx.beginFinishElement();
            ctx.tagEnd();
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    CLOSE_TAG_START : {
        nextToken : ['TAG_NAME_START'],
        matches(buffer, ctx) {
            return buffer === '<' && ctx.nextChars(1) === '/';
        },
        consume(buffer, ctx) {
            //console.log('C:CLOSE_TAG_START:' + buffer);
            ctx.beginFinishElement();
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    ATTRIBUTE_NAME_START : {
        nextToken : ['ATTRIBUTE_NAME_END'],
        matches(buffer, ctx) {
            return /[a-z0-9_-]/i.test(buffer);
        },
        consume(buffer, ctx) {
            //noop
            //console.log('C:ATTRIBUTE_NAME_START:' + buffer);
        },
        clearBuffer : false,
        leaveSpacesAfterStart : false
    },
    ATTRIBUTE_NAME_END : {
        nextToken : ['ATTRIBUTE_EQ', 'ATTRIBUTE_NAME_START', 'TAG_END', 'TAG_SELF_CLOSE'],
        matches(buffer, ctx) {
            return !/[a-z0-9_-]/i.test(ctx.nextChars(1));
        },
        consume(buffer, ctx) {
            //console.log('C:ATTRIBUTE_NAME_END:' + buffer);
            ctx.beginAttribute(buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    ATTRIBUTE_EQ : {
        nextToken : ['CODE_ATTRIBUTE_VALUE_START', 'ATTRIBUTE_VALUE_START'],
        matches(buffer, ctx) {
            return buffer === '=';
        },
        consume(buffer, ctx) {
            // noop
            //console.log('C:ATTRIBUTE_EQ:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    ATTRIBUTE_VALUE_START : {
        nextToken : ['ATTRIBUTE_VALUE_END'],
        matches(buffer, ctx) {
            return buffer === '"';
        },
        consume(buffer) {
            // noop
            //console.log('C:ATTRIBUTE_VALUE_START:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : true
    },
    ATTRIBUTE_VALUE_END : {
        nextToken : ['ATTRIBUTE_NAME_START', 'TAG_END', 'TAG_SELF_CLOSE'],
        matches(buffer, ctx) {
            return buffer[buffer.length - 1] === '"';
        },
        consume(buffer, ctx) {
            //console.log('C:ATTRIBUTE_VALUE_END:' + buffer);
            ctx.endAttribute(buffer.substring(0, buffer.length - 1));
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },

    CODE_ATTRIBUTE_VALUE_START : {
        nextToken : ['CODE_ATTRIBUTE_VALUE_END'],
        matches(buffer, ctx) {
            return buffer === '"' && ctx.nextChars(3) === '<%=';
        },
        consume(buffer) {
            // noop
            //console.log('C:CODE_ATTRIBUTE_VALUE_START:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : true
    },
    CODE_ATTRIBUTE_VALUE_END : {
        nextToken : ['ATTRIBUTE_NAME_START', 'TAG_END', 'TAG_SELF_CLOSE'],
        matches(buffer, ctx) {
            return /%>"$/.test(buffer);
        },
        consume(buffer, ctx) {
            //console.log('C:CODE_ATTRIBUTE_VALUE_END:' + buffer);
            ctx.endCodeAttribute(buffer.substring(3, buffer.length - 3));
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },

    CODE_HEADER_START: {
        nextToken : ['CODE_END'],
        matches(buffer, ctx) {
            return buffer === '<' && ctx.nextChars(2) === '%!';
        },
        consume(buffer, ctx) {
            // noop
            //console.log('C:CODE_HEADER_START:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : true
    },
    CODE_RETURN_TEXT_START: {
        nextToken : ['CODE_END'],
        matches(buffer, ctx) {
            return buffer === '<' && ctx.nextChars(2) === '%=';
        },
        consume(buffer, ctx) {
            // noop
            //console.log('C:CODE_RETURN_TEXT_START:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : true
    },
    CODE_RETURN_DOM_START: {
        nextToken : ['CODE_END'],
        matches(buffer, ctx) {
            return buffer === '<' && ctx.nextChars(2) === '%+';
        },
        consume(buffer, ctx) {
            // noop
            //console.log('C:CODE_RETURN_DOM_START:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : true
    },
    CODE_NO_RETURN_START: {
        nextToken : ['CODE_END'],
        matches(buffer, ctx) {
            return buffer === '<' && ctx.nextChars(1) === '%';
        },
        consume(buffer, ctx) {
            // noop
            //console.log('C:CODE_NO_RETURN_START:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : true
    },
    CODE_END : {
        nextToken : CONTENT_TOKENS,
        matches(buffer, ctx) {
            return /%>$/.test(buffer);
        },
        consume(buffer, ctx) {
            //console.log('C:CODE_END:' + buffer);
            let firstTwoChars = buffer.substring(0, 2);
            let isHeader = firstTwoChars === '%!';
            let shouldReturnText = firstTwoChars === '%=';
            let shouldReturnDom = firstTwoChars === '%+';
            let text = buffer.substring((shouldReturnText || shouldReturnDom || isHeader) ? 2 : 1, buffer.length - 2);
            if (isHeader) {
                ctx.addHeaderCode(text);
                return;
            }
            if (shouldReturnText) {
                ctx.addDynamicText(text);
            } else if (shouldReturnDom) {
                ctx.addDom(text);
            } else {
                ctx.addCode(text);
            }
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },

    HTML_COMMENT_START : {
        nextToken : ['HTML_COMMENT_END'],
        matches(buffer, ctx) {
            return buffer === '<' && ctx.nextChars(3) === '!--';
        },
        consume(buffer, ctx) {
            // noop
            //console.log('C:HTML_COMMENT_START:' + buffer);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : true
    },
    HTML_COMMENT_END : {
        nextToken : CONTENT_TOKENS,
        matches(buffer, ctx) {
            return /-->$/.test(buffer);
        },
        consume(buffer, ctx) {
            //console.log('C:HTML_COMMENT_END:' + buffer);
            let text = buffer.substring(3, buffer.length - 3);
            ctx.addComment(text);
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },

    // special

    HTML_SCRIPT_END : {
        nextToken : CONTENT_TOKENS,
        matches(buffer, ctx) {
            return /<\/script>$/.test(buffer);
        },
        consume(buffer, ctx) {
            ctx.tagEnd();
            //console.log('C:HTML_SCRIPT_END:' + buffer);
            let text = buffer.substring(1, buffer.length - 9);
            ctx.addScriptContent(text);
            ctx.beginFinishElement();
            ctx.tagEnd();
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
    HTML_STYLE_END : {
        nextToken : CONTENT_TOKENS,
        matches(buffer, ctx) {
            return /<\/style>$/.test(buffer);
        },
        consume(buffer, ctx) {
            //console.log('C:HTML_STYLE_END:' + buffer);
            let text = buffer.substring(1, buffer.length - 8);
            ctx.addStyleContent(text);
            ctx.beginFinishElement();
            ctx.tagEnd();
        },
        clearBuffer : true,
        leaveSpacesAfterStart : false
    },
};

function parseHtml(text) {
    let currentToken = null;
    let nextTokenNames = CONTENT_TOKENS;

    let ctx = {
        i : 0,
        nextChars(num) {
            return text.substring(Math.min(this.i + 1, text.length), Math.min(this.i + 1 + num, text.length));
        },
        rollbackChars(num) {
            this.i -= num;
        },

        _result : 'export default function(actions, el) {if (el == null) el = actions.df();',

        _level : 0,
        _openTagStarted : false,
        _closeTagStarted : false,
        _headerSegments : [],
        beginStartElement(name) {
            if (this._closeTagStarted) {
                return;
            }
            if (name === 'script') {
                nextTokenNames = ['HTML_SCRIPT_END'];
            } else if (name === 'style') {
                nextTokenNames = ['HTML_STYLE_END'];
            }
            this._currentAttributeName = null;
            this._openTagStarted = true;
            this._level++;

            this._addStr('{', -1);
            this._addStr('let parent = el;');
            this._addStr('el = actions.el("' + name + '");');
            this._addStr('actions.add(parent, el);');
        },
        _currentAttributeName : null,
        beginAttribute(name) {
            this._currentAttributeName = name;
        },
        endAttribute(value) {
            this._addStr('actions.atr(el, "' + this._currentAttributeName + '", `' + value.replace(/`/g, '\\`') + '`);');
            this._currentAttributeName = null;
        },
        endCodeAttribute(value) {
            this._addStr('actions.atr(el, "' + this._currentAttributeName + '", (' + value + '));');
            this._currentAttributeName = null;
        },
        beginFinishElement() {
            this._closeTagStarted = true;
        },
        tagEnd() {
            if (this._openTagStarted) {
                if (this._currentAttributeName != null) {
                    this.endAttribute('');
                }
            }
            if (this._closeTagStarted) {
                this._addStr('el = parent;');
                this._addStr('}', -1);
                this._level--;
            }
            this._openTagStarted = false,
            this._closeTagStarted = false;
        },
        addText(content) {
            this._addStr('actions.add(el, actions.txt(`' + content.replace(/`/g, '\\`') + '`));');
        },
        addComment(content) {
            this._addStr('actions.add(el, actions.cmm(`' + content.replace(/`/g, '\\`') + '`));');
        },
        addScriptContent(content) {
            this._addStr('actions.add(el, actions.txt(`' + content.replace(/`/g, '\\`') + '`));');
        },
        addStyleContent(content) {
            this._addStr('actions.add(el, actions.txt(`' + content.replace(/`/g, '\\`') + '`));');
        },

        addHeaderCode(code) {
            this._headerSegments.push(code);
        },
        addCode(code) {
            let content = code;
            // dom-variable block start
            if (/[\(=]\s*$/.test(code)) {
                content += '(()=>{let el = actions.df();';
            }
            // dom-variable block end
            if (/^\s*[\);,]/.test(code)) {
                content = 'return el;})()' + content;
            }
            this._addStr(content);
        },
        addDynamicText(code) {
            this._addStr('actions.add(el, actions.txt(' + code + '));');
        },
        addDom(code) {
            this._addStr('actions.add(el, ' + code + ');');
        },

        _addStr(str, adjust) {
        	var level = this._level;
        	if (adjust != null) {
        		level += adjust;
        	}
            this._result += '\n';
            for (let i = 0; i < level; i++) {
                this._result += '\t';
            }
            this._result += str;
        },

        getResult() {
            if (this._headerSegments.length != 0) {
                let headerBlock = this._headerSegments.join('\n') + '\n';
                this._result = headerBlock + this._result;
            }
            return this._result + 'return el;}';
        }
    };
    let buffer = '';
    for (; ctx.i < text.length; ctx.i++) {
        buffer += text[ctx.i];
        if (currentToken != null && !currentToken.leaveSpacesAfterStart && !/\S/.test(buffer)) {
            buffer = '';
            continue;
        }
        for (let tokenName of nextTokenNames) {
            let token = TOKENS[tokenName];
            if (!token.matches(buffer, ctx)) {
                continue;
            }
            if (token !== currentToken) {
                tokenChangeListener.tokenChanged(currentToken, token, ctx);
            }
            currentToken = token;
            nextTokenNames = currentToken.nextToken;
            currentToken.consume(buffer, ctx);
            if (currentToken.clearBuffer) {
                buffer = '';
            }
            break;
        }

    }

    var result = ctx.getResult();
    
    //console.log(result);

    return result;
}

export default {
    parse : parseHtml
}