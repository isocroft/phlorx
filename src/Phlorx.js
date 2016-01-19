/*!
 * @projectname: Phlorx v0.0.2
 * @repo: https://www.github.com/isocroft/phlorx
 * @author(s): Okechukwu Ifeora (@isocroft)
 * @contributor(s): -----------
 * @copyright: Copyright (c) 2016 @cdv
 * @license: MIT  
 * @releasedate: 12/01/2016
 *
 * Phlorx is a light-weight, task efficient, JavaScript library
 * for functional reactive programming inspired by Bacon.js &
 * RxJS
 *
 * It requires jQuery to work properly
 */

window.Phlorx = (function(w, $, factory){
   
	   if(!$){
		   throw new Error("Phlorx library cannot load -> jQuery dependeny missing");
	   }
	 
	   var $h = ({}).hasOwnProperty;
	   
	   var $s = ([]).slice;
		
	    var Phlorx = {};	
	   
	    var DataStream = factory($h, $s, w);
   
        $.fn.getStream = function(event){
            return new DataStream(event, this); // [this] is a reference to [jQuery.prototype]
        };
		
        $.fn.setAction = function(action, stream){
			$self = $(this);
			stream.subscribe(function(e, event, data){
					$self.each(function(){
							   if(action in $self){
									   $self[action](data);
							   }
					});
			});
			return true;
        };

		Phlorx.createUIStream = function (view, event){
				return $(view).getStream(event);
		}
		Phlorx.createWorkStream = function(set){
				return new DataStream(set, {});
		};

		Phlorx.createBasicStream = function(data){
				return new DataStream(data, {}, true);
		};
		
		Phlorx.interval = function(interval, data){
		       var $interv = this.createWorkStream(null), $tmr;
			   $tmr = setTimeout(function repeat(){
			        $interv.fireAtCore(data);
			        $tmr = setTimeout(repeat, interval);
			    }, interval);
			    return $interv.filter(function(data){  return Array.isArray(data)? data.length > 0 : !!data;  });
		};
		
		Phlorx.sequentially = function(interval, array){
		      var $sequent = this.interval(interval, array);
			  return $sequent.map(function(arr){ return arr.shift(); });
		};

		Phlorx.setAction = function(view, action, stream){
			 return $(view).setAction((typeof action == "function"? action(stream) : action), stream);
		};

		Phlorx.fromPromise = function(promise){
			  var $p_stream = this.createWorkStream(null);
			  if(typeof promise.promise == "function" && (typeof promise.promise().then === "function")){  // according to the Promise/A+ spec, it should be a "thenable"
					  if(typeof promise.then == "function"){
							promise.then(function(data){
								  $p_stream.fireAtCore(data); // success
							},
						    function(err){
								  $p_stream.fireAtCore(err); // fail
						    });
						   // the notify handler won't be necessary... this is FRP!
					  }
			  }else{
			       throw new TypeError("first argument must be a standard promise object");
			  } 
			  return $p_stream;
		};

        return Phlorx;
		 
}(this, this.jQuery, function(hOwn, slice, w){

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
						 
						    return {
						 
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
                                    }else{
									   // throw new Error(); ...hold the thought, this is FRP!
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
                                            									   
                                   }
								   return self; // chaining
                                 }
                            };
 },
 
 generateEventId = function (len){
    return Math.round((Math.pow(30, len+1)- Math.random() * Math.pow(30, len))).toString(30).slice(1); 
 };

 /* i am making use of the prototypes [e.g Stream] to make inheritance easier */

 // a fairly complex [Stream] observable using the adapter pattern is employed here to make things easy

 function Stream(event){  //  Stream [Adapter Class]
	  if(typeof event != "string"){
		   throw new TypeError("first argument nust be a string");
	  }
    var $event = event;
    var $queue = [];
    var $emitCore = ObserverCore(this); // bind a reference...
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

	this.toString = function(){
	     return "[object Stream]";
	};
	  
     this.getEvent = function(){
	 
          return $event;
     };
     
	 this.getDelayFn = function(){
	 
         return $delayFn;
		 
     }; 
	 
     this.subscribe = function(callback){ // adapter interface
         
         return  $emitCore.on(this.getEvent(), callback, this);

     };

     this.unsubscribe = function(){   // adapter interface

         return $emitCore.off(this.getEvent());

     };

     this.hasCoreEvent = function(){  // adapter interface

         return $emitCore.has(this.getEvent());

     };

     this.fireAtCore = function(c){  // adapter interface to observer

          return $emitCore.emit(this.getEvent(), c);

     };
   
     this.queryQueue = function(callback,  context){
                
                if(typeof callback != "function"){
				         throw new Error("first argument must be a function");
				}				
				
                return  callback.call(context, $queue);
                
				 
     };
	 
     this.linkStream = function(stream, callback){
	             /*if(stream !== null || typeof stream.subscribe != "function"){
				          throw new Error("-----------------")
                 }*/
                 if(stream.subscribe.toString() == this.subscribe.toString()){
                              this.subscribe(function(data){
									var  bool = typeof callback == "function"; 
									stream.fireAtCore((bool? callback(data) : data));
                              });
                 }
      }
     return this;
 }
 


 function DataEventStream(eventOrData, __proto, isBasic){   // DataEventStream [Implementer Class] extends Stream [Adapter Class]
     if(typeof __proto != "object" || !("constructor" in __proto)){
           throw new TypeError("second argument must be an object");
     }
     this.getProto = function(){
          return __proto;
     }
     var _$ = __proto.constructor;
     var $stream = Stream.apply(this, [generateEventId(26)]);
     
    if(_$ ===  w["jQuery"]){
		__proto.each(function(index){
			var $this = _$(this);
			$this.on(""+eventOrData, function(e){
			     $stream.fireAtCore(e);
			});
		});
     }else{
	    if(isBasic){
			  var formerSubscribe = $stream.subscribe || (function(){});
			  $stream.subscribe = function(callback){
				   formerSubscribe.call(this, callback);
				   this.fireAtCore(eventOrData);
			  };
	    }	  
    }

     this.getStream = function(){
        return $stream;
     };
	 
     return $stream;

 }

 DataEventStream.prototype.filter = function(callback){
          if(typeof callback != "function"){
               throw new TypeError("first argument must be a function");
           }
           var $S = this.getStream();
           var $f_stream = new DataEventStream(null, {});
           $S.subscribe(function(data){
				 if(callback(data)){
					 $f_stream.fireAtCore(data);
				 }
           });
          return $f_stream;
 };

 DataEventStream.prototype.map = function(callback){
                 if(typeof callback != "function"){
                        throw new TypeError("first argument must be a function");
                  }
                  var $S = this.getStream();
                  var $_stream = new DataEventStream(null, {});
                  
                  $S.linkStream($_stream, callback);
                  return $_stream;
 };

 DataEventStream.prototype.mergeToNew = function(stream){
                     if(typeof stream != "object" || !(stream  instanceof DataEventStream)){
                            throw new TypeError("first argument must be a [Stream] object");
                     }
                      var $S = this.getStream();
                      var $m_stream = new DataEventStream(null, {});
                      var  $C = function (stream){
                                  var __run = function (data){
										 this.queryQueue(function(queue){
										     queue.push(data);
										 });
										 stream.fireAtCore(data);
                                   };
                                   return __run;
                       };
                       $S.subscribe($C($m_stream));
                       stream.subscribe($C($m_stream));
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
              var $fm_stream = new DataEventStream(null, {});
              $S.subscribe($C($fm_stream, callback));
              return $fm_stream;
 };
 
 DataEventStream.prototype.combineLatest = function(stream, callback){
            var self = this;
            var $merged = self.mergeToNew(stream);
            $merged.subscribe(function(data){
				 var latest = function(q){ return Boolean(!!q[0]); }; 
				 var  retrieve = function(q){  return q.shift(); };
				 if(self.queryQueue(latest) === stream.queryQueue(latest)){
					 callback.apply(null, [self.queryQueue(retrieve), stream.queryQueue(retrieve)]);
				 } 
           }); 
           return $merged;
};

DataEventStream.prototype.scan = function(callback, initial){
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
           var $t_stream = new DataEventStream($S.getEvent(), {});
           $S.subscribe($throttle(function(evtObj){
                 $t_stream.fireAtCore.apply($t_stream, arguments);
          }, millis));
         return $t_stream;
};

 return DataEventStream;

}));
