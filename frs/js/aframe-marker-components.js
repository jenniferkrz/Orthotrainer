AFRAME.registerComponent('marker', {
    // schema: {position:{default:{x:-0.4, y:0, z:1.4}}},
    
    init: function () {
      this.el.classList.add("marker");

      this.el.addEventListener('click', function (evt) {
        evt.preventDefault();
        document.querySelectorAll("marker").forEach(marker => marker.classList.remove("active"));
        evt.target.classList.add("active");
        console.log(evt);
        
        this.setAttribute("material", "opacity: 0.75")
      });

      const inner = document.createElement('a-sphere');

      inner.setAttribute("marker-inner","");
      this.el.appendChild(inner);
      this.el.setAttribute("material","color:  #bb321b;  opacity:  0.5");
      this.el.setAttribute("scale","0.075 0.075 0.075");
    },

    update: function() {
      
    }
});

AFRAME.registerComponent('marker-inner', {
    init: function () {
      this.el.setAttribute("material","color:  black;");
      this.el.setAttribute("scale","0.25 0.25 0.25");
    }
});
