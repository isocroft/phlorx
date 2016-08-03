/** 
 * @title: Unit Testing
 * @project: Phlorx
 */


describe("Phlorx: the different features of a Phlorx stream", function() {
  
            var xStream;
			var yStream;
			var zData;
			var callb;
			var val;
			var stream;
  
			beforeEach(function() {
			
			    xStream = Phlorx.workStream(null);
				yStream = Phlorx.basicStream("primary");
			  	zData = false;
				stream = Phlorx.later(1000, 8);
				callb = function(){
				    
				};
				
	            jasmine.addMatchers({
				    toBeAPromise:function(util, customEqualityTesters){
					      return {
						       compare:function(actual, expected){
							        if(!expected){
									   expected = true;
									}
							   
							        var result = {};
									
									result.pass = util.equals((typeof actual.then == "function") // test to see if it's a "thenable"!
											&& (typeof actual.promise == "function")
											&& (actual.promise() === actual), expected, customEqualityTesters);
											
									if(result.pass){
									     result.message = "It's a promise";
									}else{
									    result.message = "It's not a promise";
									}
									
									return result;
							   }
						  
						  }
					},
			        /*toBeInstanceOf:function(util, customEqualityTesters){
					      return {
						      compare:function(actual, expected){
							         (actual instanceof expected);
							  }
						  
						  }
					},*/
					toBeAFunction:function(util, customEqualityTesters){
					    return {
						       compare:function(actual, expected){
							        if(!expected){
									   expected = true;
									}
							   
							        var result = {};
									
									result.pass = util.equals((typeof actual == "function"), expected, customEqualityTesters);
									
									if(result.pass){
									     result.message = "It's a function";
									}else{
									    result.message = "It's not a function";
									}
									
									return result;
							   }
						  
					    }
					}
			    });
				
			});
			
			afterEach(function() {
				 xStream = null;
				 yStream = null;
				 zData = null;
				 callb = null;
				 val = null;
				 stream = null;
			});
			
			it("should replicate as a stream, on any given operator call everytime!", function() {
			
				   expect(xStream.toString()).toEqual("[object Stream]");
				
				   expect((xStream.throttle(1200)).toString()).toEqual("[object Stream]");
				
				   expect((xStream.mergeToNew(yStream)).toString()).toEqual("[object Stream]");
				   
				   expect((xStream.map(function(data){ return (data % 2); })).toString()).toEqual("[object Stream]");
				
            });

			it("should recieve notification when subscribed", function() {
			   
				   yStream.onValue(function(data){
				   
						     zData = data;
						 
				   });
				   
				   expect(zData).toEqual("primary");
				   
				   xStream.onValue(function(data){
				   
				         zData = data;
					   
				   });
				   
				   xStream.fireAtCore(3);
				   
				   expect(zData).toEqual(3);

			});
			
			it("should interact with dependencies", function(done){
			
			      spyOn(Phlorx, "viaBinder");
				  
				  spyOn(Phlorx, "interval");
				  
				  Phlorx.viaCallback(callb);
				  
				  expect(Phlorx.viaBinder).toHaveBeenCalled();
				  
				  expect(Phlorx.viaBinder).toHaveBeenCalledWith(callb);
				  
					  
				  stream.onValue(function(d){
					    val = d;
						done();
			      });
				  
				 
				  //  expect(val).toEqual(8);
				// expect(Phlorx.interval).toHaveBeenCalled();
				 
			
			});

			it("should have/present standard interfaces and throw errors where necessary", function() {
			
			      expect(Phlorx.ajax).toBeAFunction();
				  
				  expect(Phlorx.ajax()).toBeAPromise();  
			    
				  expect(Phlorx.viaPromise).toBeAFunction();
				  
				  expect(function(){
				  
				        Phlorx.viaPromise();
						
				  }).toThrowError("first argument must be a standard promise object");
				  
				  expect(xStream.filter).toBeAFunction();
				  
				  expect(function(){ 
				  
				        xStream.filter();
						
				  }).toThrowError("first argument must be a function"); 
				  
				  expect(yStream.mergeToNew).toBeAFunction();
				  
				  expect(function(){ 
				  
				       yStream.mergeToNew({});
					   
				  }).toThrowError("first argument must be a [Stream] object");
			     
			});
	
});
    
