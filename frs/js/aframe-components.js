AFRAME.registerComponent('targetsurface', {
    init: function() {
	this.el.classList.add('raycastable');
	this.el.addEventListener('click', (evt) => {
	    // get active sphere
	    let sphere = [...document.querySelectorAll('[clickable-editor]')].filter(sphere => sphere.getAttribute('clickable-editor'))[0];
	    if (sphere) {
		// set active sphere to new position on targetsurface
		sphere.setAttribute('position', sphere.parentEl.object3D.worldToLocal(evt.detail.intersection.point));

		const i = pairState.points.findIndex((p) => {
		    return p.name === sphere.getAttribute('data-pair');
		});

		pairState.points = pairState.points.map((p, j) => {
		    if (i == j) {
			p[sphere.getAttribute('data-point')] = sphere.parentEl.object3D.worldToLocal(evt.detail.intersection.point);
		    }
		    return p;
		});
	    }
	});
    },
});

AFRAME.registerComponent('negationsurface', {
    init: function() {
		this.el.classList.add('raycastable');
		this.el.addEventListener('click', (evt) => {
		    [...document.querySelectorAll('[clickable]')].filter(e => e.getAttribute('clickable')).map(e => {
			e.setAttribute('clickable', false);
		    });
		});
    },
});

AFRAME.registerComponent('clickable', {
    schema: { type: 'boolean', default: false },
    init: function() {
	this.el.classList.add('raycastable');
	this.el.addEventListener('click', () => {
	    // set all other spheres except paired inactive
	    [...document.querySelectorAll('[clickable]')].filter(e => e.getAttribute('clickable')).map(e => {
		if (e.parentElement !== this.el.parentElement ) {
		    e.setAttribute('clickable', false);
		}
	    });
	    // toggle sphere active status on click
		this.el.setAttribute('clickable', !this.data);
		if ([...this.el.parentNode.children].filter(function(c){
			return c.getAttribute('clickable');
		}).length === 2) {
			document.querySelector("li[data-pair=" + this.el.parentElement.id +"]").classList.add("found");
		}
	});

	this.el.setAttribute("material","shader: flat; color:  lightpink;");
	this.el.setAttribute("scale","0.075 0.075 0.075");

	const inner = document.createElement('a-sphere');
	inner.setAttribute("material", "shader: flat; color:  #000000;");
	inner.setAttribute("marker-inner","");
	inner.setAttribute("scale","0.5 0.5 0.5");
	this.el.appendChild(inner);
    },
    update: function() {
	// set color depending on activation status
	this.el.setAttribute('material', (this.data) ? { opacity: 0.75 } : { opacity: 0 });
	[...this.el.children].forEach(function(c) {
	    c.setAttribute('material', (this.data) ? { visible: true } : { visible: false });
	});
    }
});

AFRAME.registerComponent('clickable-editor', {
    schema: { type: 'boolean', default: false },
	init: function() {
		console.log('asdf');
		this.el.classList.add('raycastable');
		this.el.addEventListener('click', () => {
    		// set all other spheres inactive
    		[...document.querySelectorAll('[clickable-editor]')].filter(e => e.getAttribute('clickable-editor')).map(e => {
				if (e !== this.el ) {
    				e.setAttribute('clickable-editor', false);
				}
    		});
    		// toggle sphere active status on click
    		this.el.setAttribute('clickable-editor', !this.data);
		});
		const inner = document.createElement('a-sphere');
		inner.setAttribute("marker-inner","");
		this.el.appendChild(inner);
		this.el.setAttribute("material","color:  #bb321b;  opacity:  0.5");
		this.el.setAttribute("scale","0.075 0.075 0.075");
		
    },
    update: function() {
		// set color depending on activation status
		this.el.setAttribute('material', (this.data) ? { color: 'red' } : { color: 'gray'});
    }
});

AFRAME.registerComponent('pair-holder', {
    schema: { type: 'boolean', default: false },
    update: function() {
	// set color depending on activation status
	[...this.el.querySelectorAll('.active-indicator')].map((i) => i.setAttribute('visible', this.data));
    }
});
