# Phlorx

[![Build Status](https://travis-ci.org/isocroft/Phlorx.svg?branch=master)](https://travis-ci.org/isocroft/Phlorx)

Phlorx is a light-weight, task efficient, fault tolerant JavaScript library for functional reactive programming inspired by Bacon.js &  RxJS. It does not require jQuery to work. But you could use jQuery with Phlorx if you like.

## Browser Support

+ IE 6.0+
+ Firefox 3.0+
+ Opera 7.0+
+ Chrome 2.0+
+ Safari 3.0+

## Getting Started

You can start using Phlorx now with your project(s) in development. It is now okay to use this
library in production level. However, it is still in *Beta* stage of release. Only 2 simple steps 
are needed to get started.

**Step 1** 
Optionally load _jQuery_ into your web project and then load _Phlorx_ afterwards like so

```html
<html lang="en">
   <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width:device-width, initial-scale=1.0">
        <meta name="X-UA-Compatible" content="IE=Edge">
        <title>Phlorx App</title>
        <link type="text/css" rel="stylesheet" href="./style.css">
        <script type="text/javascript" src="path/to/jquery/lib"></script>
        <script type="text/javascript" src="path/to/phlorx/lib"></script>
  </head>
  <body>
      <form class="page-container" action="localhost/app" method="post" name="stager" onsubmit="return false;">
          <input id="box" type="text" autofocus="on" autocomplete="off" autosave="off" tabindex="1">
          <button id="submit" disabled="disabled" tabindex="2">OK</button>
      </form>
  </body>
</html>    
```


**Step 2**
 Code to heart's content! **Tip:** You can also use [mithrill](http://mithril.js.org/) to include __jsx__ templating in your application stack with __Phlorx__


```js
<script type="text/javascript"> 

       var sequenceStream = Phlorx.sequentially(5000, [10, 20, 30, 40, 50]).map(function(num){ 
               return Math.pow(num, 2); 
           });

	       sequenceStream.onValue(function(sqrd_num){
	           console.log(sqrd_num);
	       });

	   var poll = Phlorx.viaPoll(1000, function(){ return Date.now(); });

	       poll.onValue(function(data){
	       	  var dt = new Date(data);

	       	  // using jQuery here
              $(".time").html('<span>'+dt.getHours()+':'+dt.getMinutes()+':'+dt.getSeconds()+'</span>');
	       });


	   var keyStream = Phlorx.viaDOM("keyup", "#box");
	   var clickStream = Phlorx.viaDOM("click", "#submit")

	   var emptyInputStream = keyStream.filter(function(event){ event.target.value.length == 0; });

	   emptyInputStream.onValue(function(data){
            Phlorx.UI.DOM("#submit").attr("disabled","disabled");
	   });

	   var hasCharStream = keyStream.throttle(500).filter(function(event){  
	   	           return (event.target.length > 0); 
	   	   });

	   var textStream = hasCharStream.filter(function(event){  
	   	           return (event.keyCode == 20); 
	   	   }).map(function(event){ 
	   	   	       return event.target.value; 
	   	   });

	    textStream.onValue(function(){
             Phlorx.UI.DOM("#submit").removeAttr("disabled");
	    });


      var requestStream = clickStream.map(function(event){
            event.preventDefault();
             
        	var details = {}, url = event.target.form.action, sl = ([]).slice;

        	sl.call(event.target.form.elements).forEach(function(el){
                 return details[el.name] = el.value;
        	});
            
            //event.target.form.action = "";

            return {method:event.target.form.method, url:url, data:details, crossdomain:true, headers:{"Authorization":"Basic x48shdn3627ds="}};     
      });

        
      var responseStream = requestStream.flatMap(function(request){
             return Phlorx.viaPromise(Phlorx.ajax(request));
      });

      responseStream.log();
                      
  </script>
  
  ```


## Contributing & Bug reports

I am open to start recieving PRs on code enhancements and changes. You can also contact me for more info via mail isocroft@gmail.com. Also send bug report to the mail above and use the issue tracker. With Bugs, please endeavour to additionally post a PR with code that reproduces the bug. Thank you. 

## Extras

> Code is 61.0KB in size (not minified)
  Code is 23.7KB in size (minified)
