# Phlorx
Phlorx is a light-weight, task efficient, fault tolerant JavaScript library for functional reactive programming inspired by Bacon.js &  React. It requires jQuery to work

## Browser Support

+ IE 7.0+
+ Firefox 3.5+
+ Opera 9.0+
+ Chrome 2.0+
+ Safari 3.0+

## Getting Started

You can start using Phlorx now with your project(s) in experimentation. It is not advised to use this
library in production level. It is still in *Alpha* stage of release. Only 3 simple step needed.

**Step 1** 
Load jQuery into your web project like so...

```
<script type="text/javascript" src="path/to/jquery/lib"></script>

```


**Step2**
Load Phlorx afterwards like so...


```
<script type="text/javascript" src="path/to/phlorx/lib"></script>

```


**Step 3**
 Code to heart's content!


```
<script type="text/javascript"> 
       var sequenceStream = Phlorx.sequentially(2000, [10, 20, 30, 40, 50]).map(function(num){ 
              return Math.pow(num, 2); 
           });
       sequenceStream.subscribe(function(sqrd_num){
           alert(sqrd_num);
       });
  </script>
  
  ```


## Contributing & Bug reports

I am open to start recieving PRs on code enhancements and changes. You can also contact me for more info via mail isocroft@gmail.com. Also send bug report to the mail above and use the issue tracker. With Bugs, please endeavour to additionally post a PR with code that reproduces the bug. Thank you. 

## Extras

> Code is 18KB in size (not minified)
  Code is 7KB in size (minified)
