import "/js/three.min.js";
import { GLTFLoader } from "/js/GLTFLoader.js";


var camera, scene, renderer;

init();
render();

function init() {



    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcccccc );
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    renderer = new THREE.WebGLRenderer({canvas:document.getElementById("3d-view")});
    renderer.setSize( window.innerWidth/2, window.innerHeight/2);

    camera.position.z = 0.2;

    var loader = new GLTFLoader();

    loader.load (
        '/3d_assets/fall1_uk.glb',

        function ( gltf ) {

            scene.add( gltf.scene );

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
            
            var model = gltf.scene;
        },
        
    )

    var ambient = new THREE.AmbientLight( 0x404040 ); // soft white light
	 scene.add( ambient );

	 var hemi = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
	 scene.add( hemi );
}

function render() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
}
