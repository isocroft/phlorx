/** 
 * @cdv Unit Testing
 * @project: Phlorx
 */

describe("Phlorx", function() {

  var xStream;
  var yStream;
  var zData;
  
  if(!window.jQuery || (window.jQuery.fn !== window.jQuery.prototype)){
     alert("Phlorx requires jQuery!");
	   return;
  }

  describe("the different features of a Phlorx stream", function() {
  
			beforeEach(function() {
			
			    xStream = Phlorx.createWorkStream(null);
				  yStream = Phlorx.createBasicStream("primary");
			  	zData = false;
				
			});
			
			it("should replicate as a stream, everytime!", function() {
			
				   expect(xStream.toString()).toEqual("[object Stream]");
				
				   expect((xStream.throttle(1200)).toString()).toEqual("[object Stream]");
				
				   expect((xStream.mergeToNew(yStream)).toString()).toEqual("[object Stream]");
				   
				   expect((xStream.map(function(data){ return (data % 2); })).toString()).toEqual("[object Stream]");
				
      });

			it("should recieve notification when <q>subscribed</q>", function() {
			   
				   yStream.subscribe(function(data){
				   
						     zData = data;
						 
				   });
				   
				   expect(zData).toEqual("primary");
				   
				   xStream.subscribe(function(data){
				   
				         zData = data;
					   
				   });
				   
				   xStream.fireAtCore(3);
				   
				   expect(zData).toEqual(3);

			});

			it("should have standard interfaces and throw errors where necessary", function() {
			    
				  expect(Phlorx.fromPromise).toBeTruthy();
				  
				  expect(function(){
				  
				        Phlorx.fromPromise();
						
				  }).toThrowError("first argument must be a standard promise object");
				  
				  expect(xStream.filter).toBeTruthy();
				  
				  expect(function(){ 
				  
				        xStream.filter();
						
				  }).toThrowError("first argument must be a function"); 
				  
				  expect(yStream.mergeToNew).toBeTruthy();
				  
				  expect(function(){ 
				  
				       yStream.mergeToNew({});
					   
				  }).toThrowError("first argument must be a [Stream] object");
			     
			});
	});
	
});
    
