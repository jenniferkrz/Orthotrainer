 function mutilator(obj, name = "mutilated", context = window) {
     const mutilated = {};
     for (let prop in obj) {
	 let ref = `m-${prop}`;
	 mutilated[ref] = obj[prop];
	 Object.defineProperty(mutilated, prop, {
	     set: function(v) {
		 this[ref] = v;
		 context.dispatchEvent(
		     new CustomEvent(`${name}:${prop}`, {
			 detail: { prop: prop, value: v }
		     })
		 );
	     },
	     get: function() {
		 return this[ref];
	     }
	 });
     }
     return mutilated;
 }
