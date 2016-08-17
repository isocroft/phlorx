/*!
 * @projectname: Phlorx 
 * @version: v0.0.2
 * @file: Phlorx.js
 * @repo: https://www.github.com/isocroft/phlorx
 * @author(s): Okechukwu Ifeora (@isocroft)
 * @contributor(s): nil 
 * @copyright: Synergixe™ Copyright(c) 2016 All rights reserved
 * @desc: {light-weight, task efficient, JavaScript library for functional reactive programming inspired by Bacon.js & RxJS}
 * @tags: {library, functional, flow-based}
 * @license: MIT  
 * @releasedate: 12/01/2016
 * @modifieddate : 17/08/2016
 *
 *
 * It does not requires jQuery to work properly ;)
 */

window.Phlorx = (function(w, d, factory){

        factory.uuid = 0;
		
		/*!
		   Helpers
		*/
	    var st = "string",
	 
	        $h = ({}).hasOwnProperty,
	   
	        $s = ([]).slice,
			
	        getAttributeByName = function(obj, attrName){
    
						var attributes = obj.attributes;
						
						try {

							return attributes.getNamedItem(attrName);
							
						} 
						catch (ex) {
							var i;
							
							for (i = 0; i < attributes.length; i++) {
								var attr = attributes[i]
								if (attr.nodeName == attrName && attr.specified) {
									return attr;
								}
							}
							return null;
						}
            
            },
			
			requestComplete = function (xhr, control) {
						var requestCompleteResult = {xhr:null},
							notFoundOk,
							httpStatus;

						//
						// XDomainRequest doesn't give us a way to get the status,
						// so allow passing in a forged one
						//
						if (typeof xhr.status === "undefined") {
							httpStatus = control.fakeStatus;
						}
						else {
							//
							// older versions of IE don't properly handle 204 status codes
							// so correct when receiving a 1223 to be 204 locally
							// http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
							//
							httpStatus = (xhr.status === 1223) ? 204 : xhr.status;
						}

						if (!control.finished) {
							// may be in sync or async mode, using XMLHttpRequest or IE XDomainRequest, onreadystatechange or
							// onload or both might fire depending upon browser, just covering all bases with event hooks and
							// using 'finished' flag to avoid triggering events multiple times
							control.finished = true;

							notFound = (httpStatus === 404);
							if ((httpStatus >= 200 && httpStatus < 400) || !notFound) {
								
									requestCompleteResult = {
										err: null,
										xhr:(xhr.statusText || xhr.responseText)
									};
									
									return requestCompleteResult;
								
							}
							else {
								requestCompleteResult = {
									err: httpStatus,
									xhr:(xhr.responseText || xhr.response)
								};
								
								if (httpStatus === 0) {
									throw new Error('Server Offline Or Unavailable');
								}
								
								return requestCompleteResult;
							}
						}
						else {
							return requestCompleteResult;
						}
            },
		
		    CreateMSXMLDocument = function(){
				 
				   var progIDs = [
							   'Msxml2.DOMDocument.3.0',
							   'Msxml2.DOMDocument',
							   "Msxml2.DOMDocument.6.0", 
							   "Msxml2.DOMDocument.5.0", 
							   "Msxml2.DOMDocument.4.0", 
							   "MSXML2.DOMDocument", 
							   "MSXML.DOMDocument"
							];
								   
					if(w.ActiveXObject){
						for(var i=0;i<progIDs.length;i++){
								try{
									  return (new ActiveXObject(progIDs[i]));
								} catch(ex){ }
						}
						return new ActiveXObject("Microsoft.XMLHTTP");
					}
                return null;
			},
			 
			futuresStates = {
				  STARTED:0,
				  AWAIT:1,
				  RESOLVED:2,
				  REJECTED:3
			},
			formatOptions = function(opts){
				  var options = {};
				  (String(opts).split(",")).forEach(function(key){
							options[key] = true;
				  });
				  options.savedData = !1;
				  return options;
			},
			
			/*!
			 * Base module for handling callbacks
		     */
			
            Routines = function(opts){
	
					   var options = formatOptions(opts),
						   fireStart,
						   fireEnd,
						   index,
						   fired,
						   firing,
						   pending = [],
						   queue = options.multiple && [],
						   fire = function(data){
								 options.savedData = !fire.$decline && options.save && data; // save it only when we are not rejecting {fire.$decline != true}!
								 fired = true;
								 firing = true; // firing has begun!
								 index = fireStart || 0;
								 fireEnd = pending.length;
								 for(fireStart = 0; index < fireEnd; index++){
									  setTimeout(pending[index].bind(data[0], data[1]), 50); // fire asynchronously (Promises/A+ spec requirement)
								 }
								 firing = false; // firing has ended!
			
								 if(queue){ // deal with the queue if it exists and has any contents...
									 if(queue.length){
										 return fire(queue.shift()); // fire on the {queue} items recursively
									 }
									  // if queue is empty.... then end [flow of control] at this point!
								 }
			
								 fire.$decline = false;
								 
						if(options.savedData){
							if(options.unpack){
								// clear our {pending} list and free up some memeory!!
								pending.length = 0; // saves the reference {pending} and does not replace it!
							}
						}
					};
					
				return {
					add:function(){
						var len = 0;
						if(pending){ // if not disbaled
							
							var start = pending.length;
							(function add(args){
							 
								   args.forEach(function(arg){
										  var type = typeof arg;
										  
										  if(type == "function"){
											//if(!fired){  this seems to be the reason for not triggering on late activation!!
												len = pending.push(arg);
											//}
										  }else{
											 if(!!arg && arg.length && typeof arg != "string")
												 add([].slice.call(arg)); // inspect recursively
										  }
								   });
							 
							 }([].slice.call(arguments)));
							
							
							if( fired ){ // if we have already run the {pending} list of routines at least once, ...
								   if(options.join){
									  fireStart = start; 
									  fireEnd = len; // update info again...
									  fire.$decline = true;
									  fire( options.savedData ); // fire with the saved data 
									  this.disable();
									  
								   }  
							}
							
							
						}
						return len;
					},
					hasFn:function(fn){
						var result = false;
						Object.each(pending, function(val){
							 if(typeof fn === "function" && fn === val)
								  result = true;
						}, this);
						return result;
					},
					hasList:function(){
						return !!pending; // [false] only when the disabled(); method has been called!!
					},
					fireWith:function(/* context, args */){
						if(pending && (!fired || queue)){
							var args = arguments.length && [].slice.call(arguments) || [null, 0];
							//,context = args.splice(0, 1) || [];
							//args = [context[0], args];
							
							if(firing){ // we are currently iterating on the {pending} list of routines
								queue.push( args ); // queue assets for recursive firing within {fire} function later
							}else{
								fire( args );
							}
						}
					},
					disable:function(){
						if(!options.savedData){
							 pending = queue = undefined;
						}
					}
				};
    
            },
			
			// Implementation of the Promises/A+ spec 
			Futures = function(){
	
					var defTracks = {
						resolve:['done', 'RESOLVED', Routines(['join', 'save'])],
						reject:['fail', 'REJECTED', Routines(['join','save'])],
						notify:['progress', 'AWAIT', Routines(['join', 'multiple'])]
					},
					self = this,
					keys = Object.keys(defTracks),
					setter = function(dx, arr,  forPromise){
						var drop = (dx != "notify");
						if(!arr.length && !forPromise) return defTracks[dx][2].fireWith;
						return (!forPromise)? function(){
							if(self.state >= 0 && self.state <=1){
								self.state = futuresStates[defTracks[dx][1]];
							}
							defTracks[dx][2].fireWith(self === this? self : this, [].slice.call(arguments));
							if(drop){
								defTracks[arr[0]][2].disable();
								defTracks[arr[1]][2].disable();
								switch(dx){	
								   case "reject":
								   case "resolve":
									  self.state = futuresStates[defTracks[dx][1]];
								   break;
								}	
							}
							return true;
						} : function(){
							if(self.state >= 0 && self.state <=1){
								defTracks[dx][2].add.apply(self, $s.call(arguments));
							}
							return self;
						} ;
					},
					i = 0,
					ax = keys.slice(),
					d,
					promise = {};
					
					
					// using a closure to define a function on the fly...
					for(d in defTracks){
						if($h.call(defTracks, d)){
							keys.splice(i++, 1);
							self[d] = setter(d, keys);
							self[d+"With"] = setter(d, []);
							promise[defTracks[d][0]] = setter(d, [], true);
							keys = ax.slice();
						}
					}
					
					
					promise.state = futuresStates.STARTED;
					
					promise.always = function(){
						return this.done.apply(self, arguments).fail.apply(self, arguments);
					};
					
					promise.promise = function(obj){
						if(obj && typeof obj == "object" && !obj.length){
							for(var i in promise){
								if($h.call(promise, i)){
									obj[i] = promise[i];
								}
							}
							return obj;
						}
						return promise;
					};
					
					promise.then = function(/* fnDone, fnFail, fnProgress */){
						var ret, args = [].slice.call(arguments);
						args.forEach(function(item, i){
									 item = (typeof item == "function") && item;
									 self[defTracks[keys[i]][0]](function(){
										   var rt;
										   try{ 
										   // Promises/A+ specifies that errors should be conatined and 
										   // returned as value of rejected promise
											   rt = item && item.apply(this, arguments);
										   }catch(e){ 
											   rt = this.reject(e);
										   }finally{
											   if(rt && typeof rt.promise == "function")
													ret = rt.promise();						   
										   }	   
									 });
						});
						return self.promise(ret);
					};
					
					promise.isResolved = function(){
						return !defTracks['reject'][2].hasList();
					};
					promise.isRejected = function(){
						return !defTracks['resolve'][2].hasList();
					};
					promise.pipe = promise.then;
					
					promise.promise(self);
					
					Futures.STARTED = futuresStates.STARTED;
					Futures.AWAITING = futuresStates.AWAIT;
					Futures.RESOLVED = futuresStates.RESOLVED;
					Futures.REJECTED = futuresStates.REJECTED;
					
					
					setter = ax = d = i = null; // avoid unecessarily leaking memory with each call to Futures constructor!!
					
					// enforce new!
					return (self instanceof Futures)? self : new Futures();
            },
		
	        Phlorx = {},
		
		    PhlorxStreamsMap = {
				'binds':{},
				'promises':{}
		    }, 
		
		    uuid = function(){
		         return (++factory.uuid)+'';
		    },
			
			/*!@submodule
			 * Stream Constructor
			 */
	   
	        DataStream = factory($h, $s, w, PhlorxStreamsMap),
		
		   /*!@submodule    
			* Copyright © 2012
			* Qwery - Mini CSS Selector Engine
			* http://github.com/ded/qwery
			* Dustin Diaz
			*
			* @license MIT
			* @
			*/

            Qwery =  (!('querySelectorAll' in d) && function () {
                    var doc = d
                    , html = doc.documentElement
                    , byClass = 'getElementsByClassName'
                    , byTag = 'getElementsByTagName'
                    , qSA = 'querySelectorAll'
                    , useNativeQSA = 'useNativeQSA'
                    , tagName = 'tagName'
                    , nodeType = 'nodeType'
                    , select // main select() method, assign later
                    , id = /#([\w\-]+)/
                    , clas = /\.[\w\-]+/g
                    , idOnly = /^#([\w\-]+)$/
                    , classOnly = /^\.([\w\-]+)$/
                    , tagOnly = /^([\w\-]+)$/
                    , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
                    , splittable = /(^|,)\s*[>~+]/
                    , normalizr = /^\s+|\s*([,\s\+\~>]|$)\s*/g
                    , splitters = /[\s\>\+\~]/
                    , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
                    , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
                    , simple = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
                    , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/ //[dgg='&5%nns']
                    , pseudo = /:([\w\-]+)(\(['"]?([^()]+)['"]?\))?/ //:----('---') or :not('button')
                    , easy = new RegExp(idOnly.source + '|' + tagOnly.source + '|' + classOnly.source)
                    , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
                    , tokenizr = new RegExp(splitters.source + splittersMore.source)
                    , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?');

					var walker = {
								' ': function (node) {
									return node && node !== html && node.parentNode
								}
								, '>': function (node, contestant) {
									return node && node.parentNode == contestant.parentNode && node.parentNode
								}
								, '~': function (node) {
									return node && node.previousSibling
								}
								, '+': function (node, contestant, p1, p2) {
									if (!node) return false
									return (p1 = previous(node)) && (p2 = previous(contestant)) && p1 == p2 && p1
								}
						}

						function cache() {
							this.c = {}
						}
						cache.prototype = {
							g: function (k) {
								return this.c[k] || undefined
							},
							s: function (k, v, r) {
								v = r ? new RegExp(v) : v
								return (this.c[k] = v)
							}
						}

						var classCache = new cache()
						   , cleanCache = new cache()
						   , attrCache = new cache()
						   , tokenCache = new cache();

						function classRegex(c) {
							return classCache.g(c) || classCache.s(c, '(^|\\s+)' + c + '(\\s+|$)', 1)
						}

						// not quite as fast as inline loops in older browsers so don't use liberally
						function each(a, fn) {
							var i = 0, l = a.length
							for (; i < l; i++) fn(a[i])
						}

						function flatten(ar) {
							for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
							return r
						}

						function arrayify(ar) {
							var i = 0, l = ar.length, r = []
							for (; i < l; i++) r[i] = ar[i]
							return r;
						}

						function previous(n) {
							while (n = n.previousSibling) if (n[nodeType] == 1) break;
							return n
						}

						function q(query) {
							return query.match(chunker)
						}

						// called using `this` as element and arguments from regex group results.
						// given => div.hello[title="world"]:foo('bar')
						// div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
						function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
							var i, m, k, o, classes
							if (this[nodeType] !== 1) return false
							if (tag && tag !== '*' && this[tagName] && this[tagName].toLowerCase() !== tag) return false
							if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
							if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
								for (i = classes.length; i--; ) if (!classRegex(classes[i].slice(1)).test(this.className)) return false
							}
							if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) return false
							if (wholeAttribute && !value) { // select is just for existance of attrib
								o = this.attributes
								for (k in o) {
									if (hOwn.call(o, k) && (o[k].name || k) == attribute) {
										return this
									}
								}
							}
							if (wholeAttribute && !checkAttr(qualifier,(getAttr(this, attribute) || ''), value)) {
								// select is for attrib equality
								return false;
							}
							return this
						}

						function clean(s) {
							return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
						}

						function checkAttr(qualify, actual, val) {
							switch (qualify) {
								case '=':
									return actual == val
								case '^=':
									return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, '^' + clean(val), 1))
								case '$=':
									return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, clean(val) + '$', 1))
								case '*=':
									return actual.match(attrCache.g(val) || attrCache.s(val, clean(val), 1))
								case '~=':
									return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, '(?:^|\\s+)' + clean(val) + '(?:\\s+|$)', 1))
								case '|=':
									return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, '^' + clean(val) + '(-|$)', 1))
							}
							return 0
						}

						// given a selector, first check for simple cases then collect all base candidate matches and filter
						function _qwery(selector, _root) {
							var r = [], ret = [], i, l, m, token, tag, els, intr, item, root = _root
					  , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
					  , dividedTokens = selector.match(dividers)

							if (!tokens.length) return r

							token = (tokens = tokens.slice(0)).pop() // copy cached tokens, take the last one
							if (tokens.length && (m = tokens[tokens.length - 1].match(idOnly))) root = byId(_root, m[1])
							if (!root) return r

							intr = q(token)
							// collect base candidates to filter
							els = root !== _root && root[nodeType] !== 9 && dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ?
					  function (r) {
						  while (root = root.nextSibling) {
							  root[nodeType] == 1 && (intr[1] ? intr[1] == root[tagName].toLowerCase() : 1) && (r[r.length] = root)
						  }
						  return r
					  } ([]) :
					  root[byTag](intr[1] || '*')
							// filter elements according to the right-most part of the selector
							for (i = 0, l = els.length; i < l; i++) {
								if (item = interpret.apply(els[i], intr)) r[r.length] = item
							}
							if (!tokens.length) return r

							// filter further according to the rest of the selector (the left side)
							each(r, function (e) { if (ancestorMatch(e, tokens, dividedTokens)) ret[ret.length] = e })
							return ret
						}

						// compare element to a selector
						function is(el, selector, root) {
							if (isNode(selector)) return el == selector
							if (arrayLike(selector)) return !! ~flatten(selector).indexOf(el) // if selector is an array, is el a member?

							var selectors = selector.split(','), tokens, dividedTokens
							while (selector = selectors.pop()) {
								tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
								dividedTokens = selector.match(dividers)
								tokens = tokens.slice(0) // copy array
								if (interpret.apply(el, q(tokens.pop())) && (!tokens.length || ancestorMatch(el, tokens, dividedTokens, root))) {
									return true
								}
							}
							return false
						}

						// given elements matching the right-most part of a selector, filter out any that don't match the rest
						function ancestorMatch(el, tokens, dividedTokens, root) {
							var cand
							// recursively work backwards through the tokens and up the dom, covering all options
							function crawl(e, i, p) {
								while (p = walker[dividedTokens[i]](p, e)) {
									if (isNode(p) && (interpret.apply(p, q(tokens[i])))) {
										if (i) {
											if (cand = crawl(p, i - 1, p)) return cand
										} else return p
									}
								}
							}
							return (cand = crawl(el, tokens.length - 1, el)) && (!root || isAncestor(cand, root))
						}

						function isNode(el, t) {
							return el && typeof el === 'object' && (t = el[nodeType]) && (t == 1 || t == 9)
						}

						function uniq(ar) {
							var a = [], i, j;
							o:
							for (i = 0; i < ar.length; ++i) {
								for (j = 0; j < a.length; ++j) if (a[j] == ar[i]) continue o
								a[a.length] = ar[i]
							}
							return a
						}

						function arrayLike(o) {
							return (typeof o === 'object' && isFinite(o.length))
						}

						function normalizeRoot(root) {
							if (!root) return doc
							if (typeof root == 'string') return qwery(root)[0]
							if (!root[nodeType] && arrayLike(root)) return root[0]
							return root
						}

						function byId(root, id, el) {
							// if doc, query on it, else query the parent doc or if a detached fragment rewrite the query and run on the fragment
							return root[nodeType] === 9 ? root.getElementById(id) :
					  root.ownerDocument &&
						(((el = root.ownerDocument.getElementById(id)) && isAncestor(el, root) && el) ||
						  (!isAncestor(root, root.ownerDocument) && select('[id="' + id + '"]', root)[0]))
						}

						function qwery(selector) {
							var m, el, root = normalizeRoot(doc)

							// easy, fast cases that we can dispatch with simple DOM calls
							if (!root || !selector) return []
							if (selector === window || isNode(selector)) {
								return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
							}
							if (selector && arrayLike(selector)) return flatten(selector)
							if (m = selector.match(easy)) {
								if (m[1]) return (el = byId(root, m[1])) ? [el] : []
								if (m[2]) return arrayify(root[byTag](m[2]))
								if (hasByClass && m[3]) return arrayify(root[byClass](m[3]))
							}

							return select(selector, root)
						}

						// where the root is not document and a relationship selector is first we have to
						// do some awkward adjustments to get it to work, even with qSA
						function collectSelector(root, collector) {
							return function (s) {
								var oid, nid
								if (splittable.test(s)) {
									if (root[nodeType] !== 9) {
										// make sure the el has an id, rewrite the query, set root to doc and run it
										if (!(nid = oid = root.getAttribute('id'))) root.setAttribute('id', nid = '__qwerymeupscotty')
										s = '[id="' + nid + '"]' + s // avoid byId and allow us to match context element
										collector(root.parentNode || root, s, true)
										oid || root.removeAttribute('id')
									}
									return;
								}
								s.length && collector(root, s, false)
							}
						}

						var isAncestor = 'compareDocumentPosition' in html ?
					function (element, container) {
						return (container.compareDocumentPosition(element) & 16) == 16
					} : 'contains' in html ?
					function (element, container) {
						container = container[nodeType] === 9 || container == window ? html : container
						return container !== element && container.contains(element)
					} :
					function (element, container) {
						while (element = element.parentNode) if (element === container) return 1
						return 0
					}
				  , getAttr = function () {
					  // detect buggy IE src/href getAttribute() call
					  var e = doc.createElement('p')
					  return ((e.innerHTML = '<a href="#x">x</a>') && e.firstChild.getAttribute('href') != '#x') ?
						function (e, a) {
							return a === 'class' ? e.className : (a === 'href' || a === 'src') ?
							e.getAttribute(a, 2) : e.getAttribute(a)
						} :
						function (e, a) { return e.getAttribute(a) }
				  } ()
				  , selectQSA = function (selector, root) {
					  var result = [], ss, e
					  try {
						  if (root[nodeType] === 9 || !splittable.test(selector)) {
							  // most work is done right here, defer to qSA
							  return arrayify(root[qSA](selector))
						  }
						  // special case where we need the services of `collectSelector()`
						  each(ss = selector.split(','), collectSelector(root, function (ctx, s) {
							  e = ctx[qSA](s)
							  if (e.length == 1) result[result.length] = e.item(0)
							  else if (e.length) result = result.concat(arrayify(e))
						  }))
						  return ss.length > 1 && result.length > 1 ? uniq(result) : result
					  } catch (ex) { }
					  return selectNonNative(selector, root)
				  }
						// no native selector support
				  , selectNonNative = function (selector, root) {
					  var result = [], items, m, i, l, r, ss
					  selector = selector.replace(normalizr, '$1')
					  if (m = selector.match(tagAndOrClass)) {
						  r = classRegex(m[2])
						  items = root[byTag](m[1] || '*')
						  for (i = 0, l = items.length; i < l; i++) {
							  if (r.test(items[i].className)) result[result.length] = items[i]
						  }
						  return result
					  }
					  // more complex selector, get `_qwery()` to do the work for us
					  each(ss = selector.split(','), collectSelector(root, function (ctx, s, rewrite) {
						  r = _qwery(s, ctx)
						  for (i = 0, l = r.length; i < l; i++) {
							  if (ctx[nodeType] === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
						  }
					  }))
					  return ss.length > 1 && result.length > 1 ? uniq(result) : result
				  }
				  , configure = function () {
					  // configNativeQSA: use fully-internal selector or native qSA where present
					  select = selectNonNative;

				  }

					configure();

					qwery.configure = configure
					qwery.uniq = uniq
					qwery.is = is
					qwery.pseudos = {}

					return qwery;
    }()) || (d.querySelectorAll.bind(d));
	
	/*!@submodule
	 * Document Object Model Helper
     */
	 
    var DOM = {
		    observe:function(elem, etype, ehandle){
			
					// based on Diego Perini's solution: [http://javascript.nwbox.com/IEContentLoaded/]
					
					var iFrame = false,
						 isDoc = elem[0] === d,
						 bod = d.body, 
						 COMPL = "complete",
						 capture = false,
						 IE_case = (('execScript' in window) && !($h.call(window, 'execScript'))),
						 eventHandle = IE_case ? 'attachEvent' : 'addEventListener',
						 eventObserver = function(target){
						 
						    return function(e){
						
										//NOTE: (if [bod] is undefined) - IE's flag for "DOM not ready"		
										if(etype === "onreadystatechange" && d.readyState !== COMPL){
											 return;
										}
										 
										if(!!~e){
												e = window.event; // update the event object...
												e.stopPropagation = (e.stopPropagation) ? e.stopPropagation : function () { e.cancelBubble = true; }
												e.preventDefault = (e.preventDefault) ? e.preventDefault : function () { e.returnValue = false; }
												e.target = e.srcElement || ((d.documentMode && d.documentMode >= 8)? HTMLDocument : {});
												e.root = e.target.ownerDocument || d;
												e.relatedTarget = (e.type.indexOf("mouse") > -1 && e.fromElement === e.target) ? e.toElement : e.fromElement;
												e.currentTarget = (!e.currentTarget) ? e.srcElement : this.parentNode;
												e.timestamp = (new Date).getTime();
												e.metaKey = (e.type.indexOf("key") > -1 && e.ctrlKey) ? e.ctrlKey : e.shiftKey;
												e.which = (e.type == "click") ? e.button : (e.type.indexOf("key") > -1 && e.charCode !== null) ? e.charCode : e.keyCode;
												e.pageX = e.clientX + (d.body.scrollLeft || d.documentElement.scrollLeft || 0) - (d.body.clientLeft || d.documentElement.clientLeft || 0);
												e.pageY = e.clientY + (d.body.scrollTop || d.documentElement.scrollLeft || 0) - (d.body.clientTop || d.documentElement.clientTop || 0);
										}
										  
										ehandle.call(this, e); // [ehandle] is fired only by a call function...             
									};
						};	
						 
						if(IE_case){
							if(etype == "DOMContentLoaded"){
								 etype = "readystatechange";
							}
							etype = "on" + etype;
						}
						
						function doReady(){
								try {
									d.documentElement.doScroll("left");
									ready();
								} catch(e){   
									w.setTimeout(doReady, 0);
								}
						}
							
					    try{
							 iFrame = (w.frameElement !== null);
						}catch(er){}
						
						function ready() {
						    ehandle.call(null);
						    DomReady = true;
					    }
						
						if(!iFrame && /loaded|readystate/i.test(etype) && isDoc){
							  doReady();		 
						}else{
						    ready = null;
							elem.forEach(function(elm, index){
								elm[eventHandle](etype, eventObserver(index));
							});
						}
						
						/* @TODO: detect safari Apple browser version 2
						if(Safari2){   // Deal with (Safari) browsers here
							if (DomReady) return;
							var set;
							if (!(/loaded|complete/).test(state)) {
								set = setTimeout(arguments.callee, 0); // if [state] is 'interactive', call this function all over again!! 
								return;
							}
							clearInterval(set);
							ready();
						}*/

					
        
            },
			unobserve:function(elem, etype, ehandle){
			
			},
			select: function(selector){
			    return $s.call(Qwery(selector));
			},
			get_current_pixel_style:function(elem, prop) {
				  var value = elem.currentStyle[prop] || 0
				 
				  // we use 'left' property as a place holder so backup values
				  var leftCopy = elem.style.left

				  var runtimeLeftCopy = elem.runtimeStyle.left
				  // assign to runtimeStyle and get pixel value
				  elem.runtimeStyle.left = elem.currentStyle.left
				  elem.style.left = (prop === "fontSize") ? "1em" : value
				  value = elem.style.pixelLeft + "px";
				  // restore values for left
				  elem.style.left = leftCopy
				  elem.runtimeStyle.left = runtimeLeftCopy
				  return value;

			},
			get_css_property:function(sel, prp, unt){
					  var res;
					  unt = unt || "px";
					  switch(prp){
						  case "float":
							  prp = (d.all)? "styleFloat" : "cssFloat";
						  break;
						  case "margin": 
						  case "background":
						  case "padding":
						  case "border":
						  case "borderTop":
						  case "borderBottom":
						  case "borderLeft":
						  case "borderRight":
							prp = null;
						  break;
					  };
					  if(!prp) return;
					  switch(({}).toString.call(sel).substring(8, 11)){  
						   case "Str":
								for(var j = 0; j < d.styleSheets.length; j++){
									  var cssRls = d.styleSheets[j].cssRules;
									  if(!cssRls) cssRls = d.styleSheets[j].rules;
										   for(var i = 0; i < cssRls.length; i++){
												if(cssRls[i].selectorText == sel){
													try{
													   res = cssRls[i].style.getPropertyValue(prp);      
													}catch(e){
													   res = cssRls[i].style.getAttribute(this.utils.decamelize(prp, '-'));
													} 
												}
										   }
								} 
						 break;
						 case "HTM":
						 case "Obj":
							  if(sel.style[prp]){
								   res = sel.style[prp];
							  }else{
								   
								   res = (w.getComputedStyle) ?  w.getComputedStyle(sel, null)[prp] : ((sel.runtimeStyle)? (unt=="px"? this.get_current_pixel_style(sel, prp) : sel.runtimeStyle[prp]) : 
									d.defaultView.getComputedStyle(sel,null).getPropertyValue(this.utils.decamelizr(prp, '-')));
							  }
						 break;
						 default:
							throw "invalid object "+sel+" found!";
						 break;
					  }  
					  
					  return res;
            },
			is_node:function(o){
			   return (o !== void 0 && o.nodeType);
			},
			is_node_disconnected:function(obj){
			    return (obj !== void 0 && this.is_node(obj) && obj.offsetParent === null); 
			},
			get_attrib:function(ob, a, isXML){ 
			
			           if(isXML){ 
			
			                  var attr = getAttributeByName(ob, a);
            
                              if (attr != null) {
                                     return attr.nodeValue;
                              } else {
                                     return obj[a];
                              }
                       }

                       return (a === 'class') ? ob.className : (a === 'href' || a === 'src') ? ob.getAttribute(a, 2) : (a === "style") ? ob.style.cssText.toLowerCase() : (a === "for")? ob.htmlFor : ob.getAttribute(a);
			},
			set_attrib:function(ob, a, vl, isXML){ 
			        if(isXML){ 
                         var attr = getAttributeByName(ob, a);
            
						if (attr !== null) {
							attr.nodeValue = vl;
						} else {
							attr = d.createAttribute(a);
							attr.value = vl;
							ob.setAttributeNode(attr);
						}
						return;
                    }

			        return (a === 'class')? ob.className = vl : (a === 'href')? ob.href = vl : a === "style" ? ob.style.cssText += ''+vl : ob.setAttribute(a, vl);

			},
			dom_name:function(o){
			    return this.is_node(o) && o.nodeName.toLowerCase();
			},
			utils:{
				decamelize:function(str, delim){
				    return str.replace(/([A-Z])/g, delim+"$1").toLowerCase();
				},
				camelize:function(str, delim){
				    var rx = new RegExp(delim+"(.)","g");
                    return s.replace(rx, function (m, m1){
                        return m1.toUpperCase();
                    });
				}
		    }
		};
		
		function b(){
		   return this;
		}
		
		b.fn = {
		    type:function(){
		   
		    }
		};
		
		b.fn.each = Object.each;
		
	    b["prototype"] = b.fn;
		
		b.fn.init = function PhlorxDOM(selector){
		
			var collections = [DOM.select(selector)];
			
			this.updateCollection = function(x){
			    collections.unshift(x);
				return this;
			};
			
			this.getCurrentCollection = function(){
			     return collections[0];
			};
			
			this.length = 0;
			
			return this;
		};
		
		b.fn.init["prototype"] = {
		     constrcutor:b.fn.init,
		     poof:function(){
                    while(this.length){
                        this.pop();
                    }
                    return this.length;
             },
             toArray:function(){
                 return [].slice.call(this);
             },
             push:function(item){
				 var ln =this.length;
				 if(item && "nodeType" in item){
				 this[ln++] = item;
				 }
				 this.length = ln;
             },
             pop:function(){
				 var ln = this.length,
				 item = this[--ln];
				 delete this[ln];
				 this.length = ln;
				 return item;
             },
             get:function(index){
                 var ln = this.length,
                 isNotNan = Number(index || {}); // Nan is a "falsey" value
                 return !!isNotNan? (index < 0? this[ln + index] : this[index]) : this.toArray();
             },
		     css:function(opts){ var x = this.getCurrentCollection();  if(typeof opts == st) return DOM.get_css_property(x[0], opts);  b.fn.each(x, function(item){  for(var t in opts){ item.style.cssText += DOM.utils.decamelize(t,'-')+":"+opts[t]+";" }  }); return this; },
             offCss:function(prop){ if(prop===null) return; var g, rx, x = this.getCurrentCollection();  b.fn.each(x, function(item){ if(!d.all){ item.removeProperty(prop); }else{ rx=new RegExp(prop+"\\:([#!*%\\w]+);"), g=DOM.get_attrib(item, "style");  g=g.replace(rx, ""); item.cssText+=g; } }); return this; },
             next:function(){ var r, n, x =this.getCurrentCollection(); b.fn.each(x, function(item){ r = item.parentNode; n = item.nextSibling; if(n && r.childNodes.length > 1){ while (n !== null) { if (n.nodeType == 1) break; if (n.nodeType == 3) n = n.nextSibling; if (n.nodeType == 9) n = d; }}  }); return this.updateCollection(n); },
             parent:function(){ var mk = [], cl, x = this.getCurrentCollection(); b.fn.each(x, function(item){ cl = item.parentNode; mk.push(cl); }); return this.updateCollection(mk); },
             each:function(fh){ b.fn.each(this.getCurrentCollection(), fh); return this; },
             attr:function(nm, val){ var g, x = this.getCurrentCollection(); if(!val){ return DOM.get_attrib(x[0], nm); } b.fn.each(x, function(item){ DOM.set_attrib(item, nm, val)  }); return this; },
			 removeAtrr:function(s){  if(typeof s !== st){ return this;} var x = this.getCurrentCollection(); b.fn.each(x, function(item){ item.removeAttribute(s); }); return this; },
			 html:function(txt){ var x = this.getCurrentCollection(); if(!txt){ return x[0].innerHTML; } b.fn.each(x, function(item){ item.innerHTML = txt; }); return this; }
		};
		
		Phlorx.workStream = function(data){
			  return new DataStream(data);
		};

		Phlorx.basicStream = function(data){
			  return new DataStream(data, true);
		};
		
		Phlorx.UI = {};
		/*
		Phlorx.UI.textFieldValue = function(textField){
		     function value(event){ return event ? event.target.value : "" ; };
			 return Phlorx.viaDOM("keyup", textField).map(value).toProp(value());
		};*/
		
		Phlorx.UI.DOM = function(selector){
		    return new b.fn.init(selector);
		}
		
        Phlorx.viaBinder = function(Binder){
               var stream = this.basicStream(null), d = new Futures();
			   PhlorxStreamsMap['binds'][stream.getEvent()] = d;
			   if(typeof Binder === "function"){
					  d.then(function(sink){
						 return Binder(sink[0]);
					  })
		              .then(function(stopper){
							stream.whenUnsubscribe(stopper[0]);
					   });
			  }
			  return stream;
        };

        Phlorx.viaDOM = function(DOMEvent, selector){
              selector = selector || d;
              return this.viaBinder(function(sink){
                     DOM.observe(DOM.select(selector), DOMEvent, sink);
					 
					 return function(){
					     DOM.unobserve(DOM.select(selector), DOMEvent, sink);
					 }
              });
        };
		
		Phlorx.interval = function(interval, data){
		        return this.viaBinder(function(sink){
				   var tid = setInterval(function(){
					   sink(typeof data === "function" ? data() : data);
					}, interval);
					
					return function(){
					   clearInterval(tid);
					}
				});
		};
		
		Phlorx.viaPoll = function(delay, callback){
		      return this.interval(delay, callback);
		};
		
	    Phlorx.viaCallback = function(fn){
		    this.viaBinder(fn);
		};
		
		Phlorx.viaNodeCallback = Phlorx.viaCallback;
		
		Phlorx.ajax = function(options, sync){
		
		            options = options || {}
		            sync = sync || false;
					
					var xhr = null, deferred = new Futures();
					
					try{
						    xhr = CreateMSXMLDocument();
							if(xhr === null){
							   xhr = new XMLHttpRequest();
							}
							if(options.crossdomain && 'XDomainRequest' in w){
							    xhr = new XDomainRequest();
						    }
					}catch(ex){}
					 
					
					if(!options.headers){
					   options.headers = {};
					}
					
					for (var prop in options.headers){
						if (headers.hasOwnProperty(prop)) {
							xhr.setRequestHeader(prop, headers[prop]);
						}
					}

					if (!sync && options.method && options.url){
					   if(xhr instanceof w.XDomainRequest){
					       xhr.open(options.method, options.url);
					       xhr.onload = function(){
						       deferred.resolve(requestComplete(xhr, {fakeStatus:200}).xhr);
						   }
						   xhr.onerror = function(){
						      deferred.reject(requestComplete(xhr, {fakeStatus:400}).xhr);
						   }
						   xhr.ontimeout = function(){
						      deferred.reject(requestComplete(xhr, {fakeStatus:0}).xhr);
						   }
						   
						   xhr.onprogress = function () {};
                           xhr.timeout = 0;
					   }else{
					        xhr.open(options.method, options.url, !sync);
							xhr.onreadystatechange = function () {
								if (xhr.readyState === 4) {
								   if(xhr.status >= 400){
								      deferred.reject(requestComplete(xhr, {status:xhr.status, error:true}).xhr);
								   }else{
									  deferred.resolve(requestComplete(xhr, {status:xhr.status, error:false}).xhr);
								   }
								}
							};
					   }
					}

					//
					// research indicates that IE is known to just throw exceptions
					// on .send and it seems everyone pretty much just ignores them
					// including jQuery (https://github.com/jquery/jquery/blob/1.10.2/src/ajax.js#L549
					// https://github.com/jquery/jquery/blob/1.10.2/src/ajax/xhr.js#L97)
					//
					try {
						xhr.send(options.data);
					}
					catch (ex) {
						xhr = null;
					}

					return deferred.promise();
   
		};
		
		Phlorx.sequentially = function(delay, array){
		      array = array || [];
			  delay = delay || 0;
			  return this.viaPoll(delay, function(){  return array.shift(); });
		};
		
		Phlorx.viaArray = function(array){
		     return this.sequentially(null, array);
		};
		
		Phlorx.later = function(delay, value){
		    return  this.sequentially(delay, [value]);
		};

		Phlorx.viaPromise = function(promise){
			  var $p_stream = this.workStream(null);
			  PhlorxStreamsMap['promises'][$p_stream.getEvent()] = $p_stream;
			  if(promise && typeof promise.promise == "function" && (typeof promise.promise().then === "function")){  // according to the Promise/A+ spec, it should be a "thenable"
					  if(typeof promise.then == "function"){
							promise.then(function(data){
								  $p_stream.fireAtCore.apply($p_stream, $s.call(arguments));
							},
						    function(err){
								 ($p_stream.getErrorHandle())(err);
						    });
						   // the notify handler won't be necessary... this is FRP!
					  }
			  }else{
			       throw new TypeError("first argument must be a standard promise object");
			  } 
			  return $p_stream;
		};
		
		Phlorx.retry = function(option){
		     option = option || {};
		     var callup = function(stream){
				   if(typeof option.source === "function"){
					   if(typeof option.retryCount === "number"){
						   ++option.retryCount;
					   }else{
						  option.retryCount = 1;
					   }
					   
					   if(option.retryCount !== option.retries){
						   var pream = option.source();
						   pream.onValue(function(data){
							   stream.fireAtCore(data);
							   stream = null;
						   });
						   pream.onError(function(err){
						    //  stream.log(err);
								setTimeout(function(){
									stream.offValue();
									callup(stream);
								}, ((typeof option.delay === "function" && option.delay()) || 0));
						   });
						}
				   }else{
				      stream = null;
				   }
			 },
			 stream = this.workStream();
			 callup(stream);
 			 return stream;
		};

        return Phlorx;
		 
}(this, this.document, function(hOwn, slice, w, maps){

 // Helpers 
 
 Object.keyExists = function(d,key){
     return !!d[key] && hOwn.call(d, key);
 };
 
 Array.filter = Array.filter || function (arr, func, i) {
	  if (!(arr instanceof Array) && typeof(func) != 'function') { return; }
	  var f, x = arr, n = [];
	  for (d = 0; d < x.length; ++d){

			  f = x[d];

			if (func.call(i, f, d, x) === true){
					n.push(f);
			}
	  }
     return n;
 };

 Array.isArray = Array.isArray || function (arr) {
     return arr && (arr instanceof Array);
 };
 
 if(!Function.prototype.bind){
    Function.prototype.bind = function(obj) {
                
                 var  args = slice.call(arguments, 1),
                 self = this,
                 nop = function () {},
                 bound = function () {
                     return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));
                 };
                
                nop.prototype = self.prototype;
                
                bound.prototype = new nop();
                
                return bound;
    };
}
 
 Object.each = function (obj, iterator, context) {
				 var key, length, temp; 
				 
				 if (obj) {
				 if (typeof obj === "function") {
				  
				 for (key in obj) {
				 // Need to check if hasOwnProperty exists,
				 // as in IE8 the result of querySelectorAll is an object without a hasOwnProperty function
				 if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || hOwn.call(obj,key))) {
					  iterator.call(context, obj[key], key, obj);
					  
				 }
				 }
				 } else if (Array.isArray(obj) || (obj && 'length' in obj && typeof obj.length == 'number')) {
				 var isPrimitive = typeof obj !== 'object'; 
			
				 for (key = 0, length = obj.length; key < length; key++){
				 if (isPrimitive || key in obj) {
					  iterator.call(context, obj[key], key, obj);
					  
				 }
				 }
				 } else if (obj.forEach) {
					  
					  obj.forEach(function(){ 
				  iterator.apply(this, slice.call(arguments)); 
	  }, context);
				 } else {
				  results = {};
				 for (key in obj) {
				 if (obj.hasOwnProperty(key)) {							       
						iterator.call(context, obj[key], key, obj);
					   
				 }
				 }
				 }
				 }
				 return true;
 };
 // a fairly complex Pub/Sub interface using the observer pattern
 var ObserverCore = function(){
 
                        var handlers = {}, 
						  offEvents = [],
					  
						  reparate = function(array){
								 var obj = {};
								 Object.each(array, 
									 function(val){ 
										 this[val.name] = val.result;  
									 }, 
								 obj);
								 return obj;
						  },
						
						  normaliseScope = function(e){
						     return (e.indexOf('->', 0) > 0)? e.split('->', 2) : [];
						  };
						  
						  /*!
						   * [watchProperty] , [createPropertyBag] methods are based on the code snippets at #implementation
						   * http://stackoverflow.com/questions/1759987/listening-for-variable-changes-in-javascript-or-jquery
						   *
						   * Credits to Luke Schafer
						   */
						 
						  return {
							    watchProperty:function(evt, propName, handler){
								        var handle = handlers[evt][0]._props, currval;
										try{
										    currval = handle["get_"+propName]();
										}catch(ex){
										    currval = null;
										}finally{
											function callback(trigger_on_change){
												if (handle["get_"+propName]() !== currval && trigger_on_change){
													var temp = currval;
													currval = handle["get_"+propName]();
													handler.call(null, temp, currval); //(function(oldval, newval){ do something... })
												}
											}
										}
										return callback; 
                                },
						        createPropertyBag:function(evt){
								    var handle;
								    if(evt in handlers){
									   handlers[evt][0]._props = new Object(); // making sure it is a reference object!
									   handle = handlers[evt][0]._props;
									}
									
									return function(name, initial){
										var field = initial; // TODO: will have to use deep copy here (especially for non-primitive types) later in v0.0.3
										if(handle !== void 0 && (!("get_"+name in handle))){
										   handle["get_" + name] = function() { return field; };
										   handle["set_" + name] = function(val) { field = val; };
										}
                                    }
								},
						        canLog:false,
                                emit:function(evt){
								    
								    var scope, f=-1, res=[], nx, base = {}, set, data = slice.call(arguments, 1), ah = false;
									
									scope = normaliseScope(evt);
									
									if(scope.length){
									    evt = scope[0];
										scope[0] = String(ah);
										ah = handlers[evt];
									}else{
									    scope.push([]);
									    ah = handlers[evt];
								    }	
									
									if(this.canLog && w.console !== void 0){
										 w.console.log('Phlorx Event Log: ', data);
									}
									
                                    if(ah){
                                        while(f < ah.length - 1){
										    f=f+1;
										    nx = ah[f]["name"];
										    if(!!scope[0][0]){
											   if(scope[1] === nx)
											        scope[0] = true;											  
											   else
                                                    continue; 	  
											}
                                            res.unshift({result:ah[f]["fn"].apply(ah[f]["cxt"], data), name:nx});
											
											if(res[0].result === null || typeof res[0].result === "undefined"){
											     res.shift();
											}
											if(scope[0] === true){
											    break;
											}
						                } 
                                    }
			                        f=0; 
									
									base[evt] = (res.length)? reparate(res) : null;
							        return base;
                                },
                                on:function(evt, callback, context){ 
                                      var name, self = this, scope = (evt.indexOf(":") > -1)? evt.split(":", 2) : evt;
                                        if(typeof evt != "string" || typeof callback != "function"){
			                                        return;
			                            }
										evt = (typeof scope === "string")? scope  : scope[1];
			                            // initialize (where necessary)
			                            if(!Object.keyExists(handlers, evt)){ 
                                                handlers[evt] = []; 
                                        }
										
										name = (Array.isArray(scope))? scope[0] : ""+handlers[evt].length; 
			  
			                            // capture all props for handler
			                            handlers[evt].push({
										        name:name,
			                                    cxt:context,
			                                    fn:callback,
					                            timestamp:(new Date).getTime() // for sorting purposes... 
			                            });
			  
			                            // rearrange in order of entry/insertion
			                            handlers[evt].sort(function(a, b){
			                                   a.timestamp - b.timestamp;
			                            });
			  
                                        return self; // chaining
                                },
								once:function(evt, callback, context){
								
								},
								whenOff:function(callback){
								     offEvents.push(callback);
								},
                                has:function(evt){
                                     return (!evt)? !!evt : handlers.hasOwnProperty(evt);
                                },
                                poof:function(){
                                     handlers = {};
                                },
					            emitList:function(events, data, context){
								      var result = {}, scope, ev;
								      if(Array.isArray(events)){
									      for(var d=0; d < events.length; d++){
										      ev = events[d];
										      scope = (normaliseScope(ev)[0] || ev);
										      result[scope] = this.emit(ev, data, context)[scope];
										  }	 
									  }	
                                      return;                                                                                                          return  result;									  
						       },
                               off:function(evt, target){
                                   var hj = [], self = this;
                                   if(handlers[evt]){
								       if(target === null || typeof target == "undefined"){
                                            delete handlers[evt];
									   }else{
									        Array.filter(handlers[evt], function(v, k){
											      if(v && v.name === target){
												      return (!!hj.push(k)); 
												  }
											});
									        Object.each(hj, function(v){
											       this.splice(v, 1);
											}, handlers[evt]);
									   }
                                       Object.each(offEvents, function(v){
										   if(typeof v === "function"){
											    setTimeout(v, 1);
										   }
								       });				   
                                   }
								   
								   return self; // chaining
                                 }
                            };
 },
 
 generateEventId = function (len){
    return Math.round((Math.pow(30, len+1)- Math.random() * Math.pow(30, len))).toString(30).slice(1); 
 };

 /* i am making use of the prototypes [e.g Stream] to make inheritance easier */
 /* a fairly complex [Stream] observable using the adapter pattern */

 function Stream(event){  //  Stream [Adapter Class]
	  if(typeof event != "string"){
		   throw new TypeError("first argument nust be a string");
	  }
	var errorHandle;
    var $event = event;
    var $queue = [];
    var $emitCore = ObserverCore(this); // bind a reference...
	var $propertyBag = $emitCore.createPropertyBag(event); // create a [property bag] based on this event id...
    var $delayFn = function(fn, fx, threshold){

              if(!threshold || typeof threshold == "undefined"){
			        if(fx && typeof fx === "number")
				        threshold = fx;
			  }
              var lastTime = now = (new Date).getMilliseconds(),
                     diff, setter = function(/* varargs - as many as possible */){
                     now = (new Date).getMillisecond(); // making use of outer scope variables...
                     diff =  now - lastTime;
                      var self = this;
                           if(diff >= threshold){
                               fn.apply(self, slice.call(arguments));
                           }
                           lastTime = now;
                };
				
              return setter;
    };
	
	this.onError = function(cb){
	    if(errorHandle === null){
	        errorHandle = cb;
		}
	};
	
	this.toProp = function(initialValue){
	   $propertyBag(" ", initialValue); // TODO: still adding property support for streams
	};
	
	this.offError = function(){
	     if(errorHandle){
		    errorHandle = null;
		 }
	};
	
	this.getErrorHandle = function(){
	    return function(err){
		    typeof errorHandle === "function" && errorHandle(err);
		}
	};

	this.toString = function(){
	    return "[object Stream]";
	};
	
	this.log = function(){
	    $emitCore.canLog = true;
	};
	  
    this.getEvent = function(){
	 
          return $event;
     };
     
	 this.getDelayFn = function(){
	 
         return $delayFn;
		 
     }; 
	 
     this.onValue = function(callback){ // adapter interface
         
         return  $emitCore.on(this.getEvent(), callback, this);

     };

     this.offValue = function(){   // adapter interface

         return $emitCore.off(this.getEvent());

     };
	 
	 this.whenUnsubscribe = function(callback){ // adapter interface
	   if(typeof callback == "function"){
	      $emitCore.whenOff(callback);
	   }
	 };

     this.hasCoreEvent = function(){  // adapter interface

         return $emitCore.has(this.getEvent());

     };

     this.fireAtCore = function(c){  // adapter interface to observer
         try{
          return $emitCore.emit(this.getEvent(), c);
		 }catch(e){
		     this.getErrorHandle()(e);
		 }

     };
   
     this.queryQueue = function(callback,  context){
                
                if(typeof callback != "function"){
				         throw new Error("first argument must be a function");
				}				
				
                return  callback.call(context, $queue);
                
				 
     };
	 
     this.linkStream = function(stream, callback){
	             if(stream === null){
				      throw new Error("[Stream] not okay");
                 }
                 if(typeof stream.onValue == typeof this.onValue){
						  this.onValue(function(data){
								var  bool = typeof callback == "function"; 
								stream.fireAtCore((bool? callback(data) : data));
						  });
                 }
      }
	  
     return this;
 }
 


 function DataEventStream(eventOrData, isBasic){   // DataEventStream [Implementer Class] extends Stream [Adapter Class]
     
     var $stream = Stream.apply(this, [generateEventId(26)]);
     var self = this;
	 if(isBasic){
		  var formerSubscribe = $stream.onValue || (function(){});
		  $stream.onValue = function(callback){
		       var _self = this;
			   formerSubscribe.call(this, callback);
			   if(this.getEvent() in maps['binds']){
			       (maps['binds'][this.getEvent()]).resolve(function(data){
				       stream = _self.getStream();
					   if(data === void 0){
					      stream.offValue();
						  return;
					   }
				       if(data instanceof Error){
					      (stream.getErrorHandle())(data);
						  return;
					   }
					   stream.fireAtCore.apply(stream, slice.call(arguments));
			       });
			   }else{
			       this.fireAtCore(eventOrData);
		       }
		  };
     }
    

     this.getStream = function(){
        return $stream;
     };
	 
     return $stream;

 }
 
 /* @TODO: next set of commits
 DataEventStream.prototype.concat = function(){
 
 };
 
 DataEventStream.prototype.zip = function(){
 
 };
 */
 
 DataEventStream.prototype.filter = function(callback){
          if(typeof callback != "function"){
               throw new TypeError("first argument must be a function");
           }
           var $S = this.getStream();
           var $f_stream = new DataEventStream(null);
           $S.onValue(function(data){
				 if(callback(data) === true){
					 $f_stream.fireAtCore(data);
				 }
           });
          return $f_stream;
 };
 
 DataEventStream.prototype.take = function(integer){
       limit.integer = integer || 0;
       return this.filter(function limit(data){
	        --limit.integer;
			return (limit.integer !== 0);
	   });
 };
 
 DataEventStream.prototype.once = function(value){
     var $S = this.getStream();
	 var $o_stream = new DataEventStream(value, true);
	 
	 return $o_stream.take(1);
 };

 DataEventStream.prototype.map = function(callback){
                 if(typeof callback != "function"){
                        throw new TypeError("first argument must be a function");
                  }
                  var $S = this.getStream();
                  var $_stream = new DataEventStream(null);
                  
                  $S.linkStream($_stream, callback);
                  return $_stream;
 };

 DataEventStream.prototype.mergeToNew = function(stream){
                     if(typeof stream != "object" || !(stream  instanceof DataEventStream)){
                            throw new TypeError("first argument must be a [Stream] object");
                     }
                      var $S = this.getStream();
                      var $m_stream = new DataEventStream(null);
                      var  $C = function (stream){
                                  var __run = function (data){
										 this.queryQueue(function(queue){
										     queue.push(data);
										 });
										 stream.fireAtCore(data);
                                   };
                                   return __run;
                       };
                       $S.onValue($C($m_stream));
                       stream.onValue($C($m_stream));
                       return $m_stream;
 };

 DataEventStream.prototype.flatMap = function(callback){
             var $C  = function(stream, callb){
                                 var  __run = function(e){
                                     callb.apply(this, arguments).linkStream(stream);
                                 }
                                 return __run;
                    };
              var $S = this.getStream();
              var $fm_stream = new DataEventStream(null);
              $S.onValue($C($fm_stream, callback));
              return $fm_stream;
 };
 
 DataEventStream.prototype.combineLatest = function(stream, callback){
            var self = this;
            var $merged = self.mergeToNew(stream);
            $merged.onValue(function(data){
				 var latest = function(q){ return Boolean(!!q[0]); }; 
				 var  retrieve = function(q){  return q.shift(); };
				 if(self.queryQueue(latest) === stream.queryQueue(latest)){
					 callback.apply(null, [self.queryQueue(retrieve), stream.queryQueue(retrieve)]);
				 } 
           }); 
           return $merged;
};

DataEventStream.prototype.scan = function(initial, callback){
           var $C  = function(callb){
               var  __run = function(data){
                       data =  initial;
                       return callb(data);
                };
                return __run;   
            };
            return this.map($C(callback));
 };

DataEventStream.prototype.throttle = function(millis){
             if(typeof millis != "number"){
                  throw new TypeError("first argument must be a number");
             }
           var $throttle = this.getDelayFn();
           var $S = this.getStream();
           var $t_stream = new DataEventStream($S.getEvent());
           $S.onValue($throttle(function(evtObj){
                 $t_stream.fireAtCore.apply($t_stream, arguments);
          }, millis));
         return $t_stream;
};

 return DataEventStream;

}));
