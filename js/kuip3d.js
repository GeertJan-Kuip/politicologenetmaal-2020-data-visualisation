
			
			function get_data() {
				var datatemp = csvtext.split(';')	
				for (var x=1; x<datatemp.length/csvitemsperrow; x++) {
					var temparray = []
					for (var y=0; y<csvitemsperrow; y++) {
						temparray.push(datatemp[x*csvitemsperrow+y])				
					}
					data.push(temparray)			
				}
			}
			
			function create_base_arrays_and_balls() {
				allx = []; ally=[]; allz=[];
				
				for (var row=0; row < data.length ; row++) {
					// x values (always some timeperiod integer)
					allx.push(parseInt(data[row][6]));
					
					// y values (array [lag0,lag1,lag2,lag3,lag4,lag5])
					var rest = row % ntimeperiods;						
					var posylag0=null; var posylag1=null; var posylag2=null; var posylag3=null; var posylag4=null; var posylag5=null;
					if (rest>-1) {  var posylag0 = parseFloat(data[row][7]);}
					if (rest>0) {  var posylag1 = parseFloat(data[row - 1][7]); }
					if (rest>1) {  var posylag2 = parseFloat(data[row - 2][7]); }
					if (rest>2) {  var posylag3 = parseFloat(data[row - 3][7]); }
					if (rest>3) {  var posylag4 = parseFloat(data[row - 4][7]); }
					if (rest>4) {  var posylag5 = parseFloat(data[row - 5][7]); }					
					var yarray = [posylag0,posylag1,posylag2,posylag3,posylag4,posylag5];
					ally.push(yarray);
					
					// z-values (sommige staten hebben geen z-waarde aan het begin terwijl de fb wel bekend is, Arizona)
					var zvalue = parseFloat(data[row][[clausenindex[clausencode]]]) ; //denk om clausen
					var newz = zvalue;					
					if (isNaN(zvalue)) {newz = null;}					
					allz.push(newz);
					
					// spheres
					var obj = new THREE.SphereBufferGeometry( 0.1,8,8 );
					if (newz!=null) {var colorindex = parseInt(10-(newz)/10);} else {var colorindex=1}
					var colorcode = list_materialcolors[colorindex]						
					var basematerial = new THREE.MeshBasicMaterial( { color: colorcode, transparent: true } );
					
					var a =  new THREE.Mesh( obj, basematerial );
					a.position.set(0,0,0);	
					objectarray[row] = a;	
					a.name = "fiets"
					materialarray[row] = basematerial;
					scene.add(a);	
				}
			}
						
			function create_transition_arrays() {
				// lagold, lagnew
				var validold, validnew;
				var x1, x2, y1, y2, z1, z2;
				
				oldpos = [] ; newpos = []; oldopacity = [] ; newopacity = []
				
				//lagold = 1;
				//lagnew = 3;
				
				for (var row=0; row < data.length ; row++) {
					
					x2 = allx[row] ; y2 = ally[row][lagnew] ; z2 = allz[row]
					validnew = 1;
					if (x2==null || y2==null || z2==null || isNaN(x2) || isNaN(y2) || isNaN(z2) ) { validnew = 0 ;} 
					
					if (lagold!=null) {
						x1 = allx[row] ; y1 = ally[row][lagold] ; z1 = allz[row]
						validold = 1;
						if (x1==null || y1==null || z1==null || isNaN(x1) || isNaN(y1) || isNaN(z1) ) { validold = 0 ;} 					
						}					
					else {
						validold = 0 ;  
						if (validnew == 1) {x1=x2 ;y1=y2 ; z1=z2 ;} else { x1=0;y1=0;z1=0;}
						}
						
					if (validold==0 && validnew==0) {x2=0;y2=0;z2=0; x1=0; y1=0; z1=0}	
					
					if (validold==1 && validnew==0) {x2=x1;y2=y1;z2=z1;}					
					if (validnew==1 && validold==0) {x1=x2; y1=y2; z1=z2;}
					
					oldpos.push([x1,y1/3,(100-z1)/10])
					newpos.push([x2,y2/3,(100-z2)/10])					
					oldopacity.push(validold);
					newopacity.push(validnew);				
				}
			}
			
			function create_animation() {
				
				for (var x=0; x < data.length ; x++) {
					
					var positionKF = new THREE.VectorKeyframeTrack( '.position', [ 0, 2 ], [oldpos[x][0],oldpos[x][1],oldpos[x][2],newpos[x][0],newpos[x][1],newpos[x][2]] );
					var opacityKF = new THREE.NumberKeyframeTrack( '.material.opacity', [ 0, 2 ], [ oldopacity[x], newopacity[x] ] );
					//var opacityKF = new THREE.NumberKeyframeTrack( '.material.opacity', [ 0, 2], [ 0, 1 ] );
					var clip = new THREE.AnimationClip( 'Action', 2, [ positionKF,opacityKF] );
					mixerarray[x] = new THREE.AnimationMixer( objectarray[x] );
					var clipAction = mixerarray[x].clipAction( clip );
					clipAction.setLoop( THREE.LoopOnce )
					clipAction.play();					
				}
				
				mixerarray[mixerarray.length-1].addEventListener( 'finished', function( e ) {
					mixerarray = [];
					create_endstate()				
				} );
			}
			
			function create_endstate() {
			
				for (var x=0; x < data.length ; x++) {

					objectarray[x].position.x=newpos[x][0]
					objectarray[x].position.y=newpos[x][1]
					objectarray[x].position.z=newpos[x][2]					
					materialarray[x].opacity = newopacity[x];
				}
			}
			
			function play_animation(evt) {
				lagnew = evt.currentTarget.KuipsLags;

				create_transition_arrays();
				lagold = lagnew;
				create_animation();
				create_endstate()
				
				console.log(clausencode)
			}
			
			function clear_scene() {
				
				var obj, i;
				for ( i = scene.children.length - 1; i >= 0 ; i -- ) {
					obj = scene.children[ i ];
					if ( obj!== camera && obj!=floorplatemesh ) {
						scene.remove(obj);
						
					}
				}
			}	
			
			function change_clausen(evt) {
				clausencode = evt.currentTarget.NewClausen;			
				
				oldpos = [] ; newpos = []; oldopacity = [] ; newopacity = []
				lagold = null ; lagnew = null; 
				
				objectarray = []
				materialarray = []
				animationarray = []
				mixerarray = []				
				
				clear_scene();

				create_base_arrays_and_balls();
			}


			function init() {
			
				var container = document.createElement( 'div' );
				document.body.appendChild( container );
			
				scene = new THREE.Scene();
				scene.background = new THREE.Color( 0xFFFFFF );

				camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 1, 1000 );
				//camera = new THREE.OrthographicCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
				camera.position.set( 0,0,200);
				camera.lookAt( 0,0,0 );
				
				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				container.appendChild( renderer.domElement );
				
				controls = new THREE.TrackballControls( camera, renderer.domElement );
				controls.target.set( 0,0,0 );
				controls.enablePan = true;
				
				controls.rotateSpeed = 1.0;
				controls.zoomSpeed = 1.2;
				controls.panSpeed = 0.8;

				clock = new THREE.Clock();
				window.addEventListener( 'resize', onWindowResize, false );
				
				document.addEventListener( 'mousemove', onMouseMove, false );
				
				
				//GEOMETRY - MATERIALS
				floorplate = new THREE.PlaneBufferGeometry( 15,15,1 );				
				var floorplatematerial2 = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/1.png')})
				floorplatemesh = new THREE.Mesh( floorplate, floorplatematerial2 );
				scene.add(floorplatemesh);				

				//document.getElementById( "color" ).addEventListener( 'click', clickbutton1, false );				
				//document.getElementById( "font" ).addEventListener( 'click', clear_scene2, false );
				document.getElementById( "clausen1" ).addEventListener( 'click', change_clausen, false );document.getElementById( "clausen1" ).NewClausen = 1
				document.getElementById( "clausen2" ).addEventListener( 'click', change_clausen, false );document.getElementById( "clausen2" ).NewClausen = 2
				document.getElementById( "clausen4" ).addEventListener( 'click', change_clausen, false );document.getElementById( "clausen4" ).NewClausen = 4
				document.getElementById( "prodemocracy" ).addEventListener( 'click', change_clausen, false );document.getElementById( "prodemocracy" ).NewClausen = 5
				
				document.getElementById( "lag0" ).addEventListener( 'click', play_animation, false );document.getElementById( "lag0" ).KuipsLags = 0
				document.getElementById( "lag1" ).addEventListener( 'click', play_animation, false );document.getElementById( "lag1" ).KuipsLags = 1				
				document.getElementById( "lag2" ).addEventListener( 'click', play_animation, false );document.getElementById( "lag2" ).KuipsLags = 2
				document.getElementById( "lag3" ).addEventListener( 'click', play_animation, false );document.getElementById( "lag3" ).KuipsLags = 3
				document.getElementById( "lag4" ).addEventListener( 'click', play_animation, false );document.getElementById( "lag4" ).KuipsLags = 4
				document.getElementById( "lag5" ).addEventListener( 'click', play_animation, false );document.getElementById( "lag5" ).KuipsLags = 5


			}
			
			function clear_scene2() {
				var len = objectarray.length;
				var obj, i;
				for ( i = 0; i < len ; i ++ ) {
					var obj = scene.getObjectByName( "fiets", true );
					scene.remove(obj)
				}
			}
			

			
			function onWindowResize() {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize( window.innerWidth, window.innerHeight );
			}
			
			function onMouseMove( event ) {

				event.preventDefault();

				mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
				mouse.y = - ( event.clientY / (window.innerHeight) ) * 2 + 1;

			}			

			function animate() {
				id = requestAnimationFrame( animate );
				controls.update()
				render();
			}

			function render() {
				var delta = clock.getDelta();
				if ( 1==1 ) {
					
					for (var x = 0; x < mixerarray.length; x++) {
					mixerarray[x].update( delta );
					}
				} 
				
				//raycaster.setFromCamera( mouse, camera );
				//var intersects = raycaster.intersectObjects( scene.children );

				//for ( var i = 0; i < intersects.length; i++ ) {

					//console.log(intersects[ i ].object.material.name)
					//window.alert(intersects[ i ].object.name)

				//}
				
				
				
				renderer.render( scene, camera );
			}

