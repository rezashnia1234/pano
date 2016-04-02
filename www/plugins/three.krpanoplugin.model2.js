/*
	krpano ThreeJS example plugin
	- use three.js inside krpano
	- with stereo-rendering and WebVR support
	- with 3d object hit-testing (onover, onout, onup, ondown, onclick) and mouse cursor handling
*/

function krpanoplugin()
{
	var local  = this;
	var krpano = null;
	var device = null;
	var plugin = null;


	local.registerplugin = function(krpanointerface, pluginpath, pluginobject)
	{
		krpano = krpanointerface;
		device = krpano.device;
		plugin = pluginobject;

		if (krpano.version < "1.19")
		{
			krpano.trace(3,"ThreeJS plugin - too old krpano version (min. 1.19)");
			return;
		}

		if (!device.webgl)
		{
			// show warning
			krpano.trace(2,"ThreeJS plugin - WebGL required");
			return;
		}

		krpano.debugmode = true;
		krpano.trace(0, "ThreeJS krpano plugin" );

        
		
		// load the requiered three.js scripts
		load_scripts(["plugins/three.min.js"], start);

		// load_scripts(["plugins/OBJLoader.js"], start);
	}

	local.unloadplugin = function()
	{
		// no unloading support at the moment
	}

	local.onresize = function(width, height)
	{
		return false;
	}


	function resolve_url_path(url)
	{
		if (url.charAt(0) != "/" && url.indexOf("://") < 0)
		{
			// adjust relative url path
			url = krpano.parsepath("%CURRENTXML%/" + url);
		}

		return url;
	}


	function load_scripts(urls, callback)
	{
		if (urls.length > 0)
		{
			var url = resolve_url_path( urls.splice(0,1)[0] );

			var script = document.createElement("script");
			script.src = url;
			script.addEventListener("load", function(){ load_scripts(urls,callback); });
			script.addEventListener("error", function(){ krpano.trace(3,"loading file '"+url+"' failed!"); });
			document.getElementsByTagName("head")[0].appendChild(script);
		}
		else
		{
			// done
			callback();
		}
	}


	// helper
	var M_RAD = Math.PI / 180.0;


	// ThreeJS/krpano objects
	var renderer = null;
	var scene = null;
	var camera = null;
	var stereocamera = null;
	var camera_hittest_raycaster = null;
	var krpano_panoview = null;
	var krpano_panoview_euler = null;
	var krpano_projection = new Float32Array(16);		// krpano projection matrix
	var krpano_depthbuffer_scale = 1.0001;				// depthbuffer scaling (use ThreeJS defaults: znear=0.1, zfar=2000)
	var krpano_depthbuffer_offset = -0.2;
	var active_image = "000";

	function start()
	{
		// create the ThreeJS WebGL renderer, but use the WebGL context from krpano
		renderer = new THREE.WebGLRenderer({canvas:krpano.webGL.canvas, context:krpano.webGL.context});
		renderer.autoClear = false;
		renderer.setPixelRatio(1);	// krpano handles the pixel ratio scaling

		// restore the krpano WebGL settings (for correct krpano rendering)
		restore_krpano_WebGL_state();

		// use the krpano onviewchanged event as render-frame callback (this event will be directly called after the krpano pano rendering)
		krpano.set("events[__threejs__].keep", true);
		krpano.set("events[__threejs__].onviewchange", adjust_krpano_rendering);	// correct krpano view settings before the rendering
		krpano.set("events[__threejs__].onviewchanged", render_frame);

		// enable continuous rendering (that means render every frame, not just when the view has changed)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		krpano.view.continuousupdates = true;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// register mouse and touch events
		if (device.browser.events.mouse)
		{
			krpano.control.layer.addEventListener("mousedown", handle_mouse_touch_events, true);
		}
		if (device.browser.events.touch)
		{
			krpano.control.layer.addEventListener(device.browser.events.touchstart, handle_mouse_touch_events, true);
		}

		// basic ThreeJS objects
		scene = new THREE.Scene();
		camera = new THREE.Camera();
		stereocamera = new THREE.Camera();
		camera_hittest_raycaster = new THREE.Raycaster();
		krpano_panoview_euler = new THREE.Euler();

		// build the ThreeJS scene (start adding custom code there)
		build_scene();
	}


	function restore_krpano_WebGL_state()
	{
		var gl = krpano.webGL.context;

		gl.disable(gl.DEPTH_TEST);
		gl.cullFace(gl.FRONT);
		gl.frontFace(gl.CCW);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.activeTexture(gl.TEXTURE0);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
	}


	function restore_ThreeJS_WebGL_state()
	{
		var gl = krpano.webGL.context;

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		gl.clearDepth(1);
		gl.clear(gl.DEPTH_BUFFER_BIT);

		renderer.resetGLState();
	}


	function krpano_projection_matrix(sw,sh, zoom, xoff,yoff)
	{
		var m = krpano_projection;

		var pr = device.pixelratio;
		sw = pr / (sw*0.5);
		sh = pr / (sh*0.5);

		m[0]  = zoom*sw;    m[1]  = 0;          m[2]  = 0;                          m[3]  = 0;
		m[4]  = 0;          m[5]  = -zoom*sh;   m[6]  = 0;                          m[7]  = 0;
		m[8]  = xoff;       m[9]  = -yoff*sh;   m[10] = krpano_depthbuffer_scale;   m[11] = 1;
		m[12] = 0;          m[13] = 0;          m[14] = krpano_depthbuffer_offset;  m[15] = 1;
	}


	function update_camera_matrix(camera)
	{
		var m = krpano_projection;
		camera.projectionMatrix.set(m[0],m[4],m[8],m[12], m[1],m[5],m[9],m[13], m[2],m[6],m[10],m[14], m[3],m[7],m[11],m[15]);
	}


	function adjust_krpano_rendering()
	{
		if (krpano.view.fisheye != 0.0)
		{
			// disable the fisheye distortion, ThreeJS objects can't be rendered with it
			krpano.view.fisheye = 0.0;
		}

		var webvr_plugin = krpano.get("plugin[webvr]");
		if (webvr_plugin)
		{
			// disable the MobileVR fisheye distortion
			if (webvr_plugin.mobilevr_lens_dist != 0.0)
			{
				// use a hardcoded alternative fov for the moment
				webvr_plugin.mobilevr_lens_fov  = 88.0;
				webvr_plugin.mobilevr_lens_dist = 0.0;
			}
		}
	}


	function render_frame()
	{
		var gl = krpano.webGL.context;
		var vr = krpano.webVR && krpano.webVR.enabled ? krpano.webVR : null;

		var sw = gl.drawingBufferWidth;
		var sh = gl.drawingBufferHeight;


		// setup WebGL for ThreeJS
		restore_ThreeJS_WebGL_state();

		// set the camera/view rotation
		krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()
		krpano_panoview_euler.set(-krpano_panoview.v * M_RAD, (krpano_panoview.h-90) * M_RAD, krpano_panoview.r * M_RAD, "YXZ");
		camera.quaternion.setFromEuler(krpano_panoview_euler);
		camera.updateMatrixWorld(true);

		// set the camera/view projection
		krpano_projection_matrix(sw,sh, krpano_panoview.z, 0, krpano_panoview.yf);
		update_camera_matrix(camera);


		// do scene updates
		update_scene();


		// render the scene
		if (krpano.display.stereo == false)
		{
			// normal rendering
			renderer.setViewport(0,0, sw,sh);
			renderer.render(scene, camera);
		}
		else
		{
			// stereo / VR rendering
			sw *= 0.5;	// use half screen width

			var stereo_scale = 0.05;
			var stereo_offset = Number(krpano.display.stereooverlap);

			// use a different camera for stereo rendering to keep the normal one for hit-testing
			stereocamera.quaternion.copy(camera.quaternion);
			stereocamera.updateMatrixWorld(true);

			// render left eye
			var eye_offset = -0.03;
			krpano_projection_matrix(sw,sh, krpano_panoview.z, stereo_offset, krpano_panoview.yf);

			if (vr)
			{
				eye_offset = vr.eyetranslt(1);						// get the eye offset (from the WebVR API)
				vr.prjmatrix(1, krpano_projection);					// replace the projection matrix (with the one from WebVR)
				krpano_projection[10] = krpano_depthbuffer_scale;	// adjust the depthbuffer scaling
				krpano_projection[14] = krpano_depthbuffer_offset;
			}

			// add the eye offset
			krpano_projection[12] = krpano_projection[0] * -eye_offset * stereo_scale;

			update_camera_matrix(stereocamera);
			renderer.setViewport(0,0, sw,sh);
			renderer.render(scene, stereocamera);

			// render right eye
			eye_offset = +0.03;
			krpano_projection[8] = -stereo_offset;	// mod the projection matrix (only change the stereo offset)

			if (vr)
			{
				eye_offset = vr.eyetranslt(2);						// get the eye offset (from the WebVR API)
				vr.prjmatrix(2, krpano_projection);					// replace the projection matrix (with the one from WebVR)
				krpano_projection[10] = krpano_depthbuffer_scale;	// adjust the depthbuffer scaling
				krpano_projection[14] = krpano_depthbuffer_offset;
			}

			// add the eye offset
			krpano_projection[12] = krpano_projection[0] * -eye_offset * stereo_scale;

			update_camera_matrix(stereocamera);
			renderer.setViewport(sw,0, sw,sh);
			renderer.render(scene, stereocamera);
		}

		// important - restore the krpano WebGL state for correct krpano rendering
		restore_krpano_WebGL_state();
	}



	// -----------------------------------------------------------------------
	// ThreeJS User Content - START HERE

	var clock = null;
	var animatedobjects = [];
	var myobject = null;
	var box = null;


	// add a krpano hotspot like handling for the 3d objects
	function assign_object_properties(obj, name, properties)
	{
		// set defaults (krpano hotspot like properties)
		if (properties          === undefined)	properties         = {};
		if (properties.name     === undefined)	properties.name    = name;
		if (properties.ath      === undefined)	properties.ath     = 0;
		if (properties.atv      === undefined)	properties.atv     = 0;
		if (properties.depth    === undefined)	properties.depth   = 1000;
		if (properties.scale    === undefined)	properties.scale   = 1;
		if (properties.rx       === undefined)	properties.rx      = 0;
		if (properties.ry       === undefined)	properties.ry      = 0;
		if (properties.rz       === undefined)	properties.rz      = 0;
		if (properties.rorder   === undefined)	properties.rorder  = "YXZ";
		if (properties.enabled  === undefined)	properties.enabled = true;
		if (properties.capture  === undefined)	properties.capture = true;
		if (properties.onover   === undefined)	properties.onover  = null;
		if (properties.onout    === undefined)	properties.onout   = null;
		if (properties.ondown   === undefined)	properties.ondown  = null;
		if (properties.onup     === undefined)	properties.onup    = null;
		if (properties.onclick  === undefined)	properties.onclick = null;
		properties.pressed  = false;
		properties.hovering = false;

		obj.properties = properties;

		update_object_properties(obj);
	}


	function update_object_properties(obj)
	{
		var p = obj.properties;

		var px = p.depth * Math.cos(p.atv * M_RAD)*Math.cos((180-p.ath) * M_RAD);
		var py = p.depth * Math.sin(p.atv * M_RAD);
		var pz = p.depth * Math.cos(p.atv * M_RAD)*Math.sin((180-p.ath) * M_RAD);
		obj.position.set(px,py,pz);

		obj.rotation.set(p.rx*M_RAD, p.ry*M_RAD, p.rz*M_RAD, p.rorder);

		obj.scale.set(p.scale, p.scale, p.scale);

		obj.updateMatrix();
	}


	function load_object_json(url, animated, properties, donecall)
	{
		url = resolve_url_path(url);

		var loader = new THREE.JSONLoader();
		loader.load(url, function (geometry, materials)
		{
			var material = materials[0];

			if (animated)
			{
				material.morphTargets = true;
				material.morphNormals = true;
				geometry.computeMorphNormals();
			}

			geometry.computeVertexNormals();

			var obj = new THREE.MorphAnimMesh(geometry, material);

			if (animated)
			{
				obj.duration = 1000;
				obj.time = 0;
				obj.matrixAutoUpdate = false;

				animatedobjects.push(obj);
			}

			assign_object_properties(obj, url, properties);

			scene.add( obj );

			if (donecall)
			{
				donecall(obj);
			}

		});
	}


	function build_scene()
	{
		clock = new THREE.Clock();

		// load 3d objects
		/*
		load_object_json("monster.js",  true,
			{
				ath:+30,  atv:+15, depth:500,  scale:0.1, rx:180, ry:60  ,rz:0,   
				ondown:function(obj)
				{
					obj.properties.scale *= 1.9;
					update_object_properties(obj);
				},
				onup:function(obj)
				{
					//alert("786");
					krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()
					//krpano.trace(3,"krpano_panoview.v:" + krpano_panoview.v + " // krpano_panoview.h:" + krpano_panoview.h + " // krpano_panoview.r:" + krpano_panoview.r);
					//alert("krpano_panoview.v:" + krpano_panoview.v + " // krpano_panoview.h:" + krpano_panoview.h + " // krpano_panoview.r:" + krpano_panoview.r);
					
					obj.properties.scale /= 1.9;
					update_object_properties(obj); 
				}
			}
		);
		
		
		load_object_json("flamingo.js", true,
			{
				ath:-110, atv:-20, depth:700,  scale:1.0, rx:-10, ry:250, rz:180,   
				ondown:function(obj)
				{
					obj.properties.scale *= 1.2;
					update_object_properties(obj);
				},
				onup:function(obj)
				{
					obj.properties.scale /= 1.2;
					update_object_properties(obj); 
				}
			}
		);
		
		load_object_json("horse.js",    true,
			{
				ath:-58,  atv:+7,  depth:1000, scale:2.5, rx:180, ry:233, rz:0,
				ondown:function(obj)
				{
					obj.properties.scale *= 1.2;
					update_object_properties(obj);
				},
				onup:function(obj)
				{
					obj.properties.scale /= 1.2;
					update_object_properties(obj); 
				}
			}
		);
		*/
		/*
		// create a textured 3d box
		box = new THREE.Mesh(new THREE.BoxGeometry(500,500,500), new THREE.MeshBasicMaterial({map:THREE.ImageUtils.loadTexture(resolve_url_path("panos/model/box.jpg"))}));
		assign_object_properties(box, "box", {ath:-40, atv:-3, depth:2000,scale:1.5, ondown:function(obj){scene.remove( box );krpano.call("vr_menu_loadhome();");}, onup:function(obj){ }});
		scene.add( box );
		krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()
		*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//v71: THREE.OBJLoader=function(e){this.manager=void 0!==e?e:THREE.DefaultLoadingManager},THREE.OBJLoader.prototype={constructor:THREE.OBJLoader,load:function(e,t,r,n){var a=this,d=new THREE.XHRLoader(a.manager);d.setCrossOrigin(this.crossOrigin),d.load(e,function(e){t(a.parse(e))},r,n)},parse:function(e){function t(e){var t=parseInt(e);return 3*(t>=0?t-1:t+m.length/3)}function r(e){var t=parseInt(e);return 3*(t>=0?t-1:t+E.length/3)}function n(e){var t=parseInt(e);return 2*(t>=0?t-1:t+c.length/2)}function a(e,t,r){l.vertices.push(m[e],m[e+1],m[e+2],m[t],m[t+1],m[t+2],m[r],m[r+1],m[r+2])}function d(e,t,r){l.normals.push(E[e],E[e+1],E[e+2],E[t],E[t+1],E[t+2],E[r],E[r+1],E[r+2])}function o(e,t,r){l.uvs.push(c[e],c[e+1],c[t],c[t+1],c[r],c[r+1])}function s(e,s,i,l,u,v,m,E,c,f,p,h){var g,H=t(e),R=t(s),T=t(i);void 0===l?a(H,R,T):(g=t(l),a(H,R,g),a(R,T,g)),void 0!==u&&(H=n(u),R=n(v),T=n(m),void 0===l?o(H,R,T):(g=n(E),o(H,R,g),o(R,T,g))),void 0!==c&&(H=r(c),R=r(f),T=r(p),void 0===l?d(H,R,T):(g=r(h),d(H,R,g),d(R,T,g)))}console.time("OBJLoader");var i,l,u,v=[];/^o /gm.test(e)===!1&&(l={vertices:[],normals:[],uvs:[]},u={name:""},i={name:"",geometry:l,material:u},v.push(i));for(var m=[],E=[],c=[],f=/v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,p=/vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,h=/vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,g=/f( +-?\d+)( +-?\d+)( +-?\d+)( +-?\d+)?/,H=/f( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))?/,R=/f( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))?/,T=/f( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))?/,b=e.split("\n"),w=0;w<b.length;w++){var F=b[w];F=F.trim();var A;0!==F.length&&"#"!==F.charAt(0)&&(null!==(A=f.exec(F))?m.push(parseFloat(A[1]),parseFloat(A[2]),parseFloat(A[3])):null!==(A=p.exec(F))?E.push(parseFloat(A[1]),parseFloat(A[2]),parseFloat(A[3])):null!==(A=h.exec(F))?c.push(parseFloat(A[1]),parseFloat(A[2])):null!==(A=g.exec(F))?s(A[1],A[2],A[3],A[4]):null!==(A=H.exec(F))?s(A[2],A[5],A[8],A[11],A[3],A[6],A[9],A[12]):null!==(A=R.exec(F))?s(A[2],A[6],A[10],A[14],A[3],A[7],A[11],A[15],A[4],A[8],A[12],A[16]):null!==(A=T.exec(F))?s(A[2],A[5],A[8],A[11],void 0,void 0,void 0,void 0,A[3],A[6],A[9],A[12]):/^o /.test(F)?(l={vertices:[],normals:[],uvs:[]},u={name:""},i={name:F.substring(2).trim(),geometry:l,material:u},v.push(i)):/^g /.test(F)||(/^usemtl /.test(F)?u.name=F.substring(7).trim():/^mtllib /.test(F)||/^s /.test(F)))}for(var B=new THREE.Object3D,w=0,y=v.length;y>w;w++){i=v[w],l=i.geometry;var L=new THREE.BufferGeometry;L.addAttribute("position",new THREE.BufferAttribute(new Float32Array(l.vertices),3)),l.normals.length>0&&L.addAttribute("normal",new THREE.BufferAttribute(new Float32Array(l.normals),3)),l.uvs.length>0&&L.addAttribute("uv",new THREE.BufferAttribute(new Float32Array(l.uvs),2)),u=new THREE.MeshLambertMaterial,u.name=i.material.name;var O=new THREE.Mesh(L,u);O.name=i.name,B.add(O)}return console.timeEnd("OBJLoader"),B}};
		//v75: THREE.OBJLoader=function(e){this.manager=void 0!==e?e:THREE.DefaultLoadingManager,this.materials=null},THREE.OBJLoader.prototype={constructor:THREE.OBJLoader,load:function(e,t,a,r){var s=this,n=new THREE.XHRLoader(s.manager);n.setPath(this.path),n.load(e,function(e){t(s.parse(e))},a,r)},setPath:function(e){this.path=e},setMaterials:function(e){this.materials=e},parse:function(e){function t(e){var t={vertices:[],normals:[],uvs:[]},a={name:"",smooth:!0};d={name:e,geometry:t,material:a},u.push(d)}function a(e){var t=parseInt(e);return 3*(t>=0?t-1:t+f.length/3)}function r(e){var t=parseInt(e);return 3*(t>=0?t-1:t+h.length/3)}function s(e){var t=parseInt(e);return 2*(t>=0?t-1:t+E.length/2)}function n(e,t,a){d.geometry.vertices.push(f[e],f[e+1],f[e+2],f[t],f[t+1],f[t+2],f[a],f[a+1],f[a+2])}function o(e,t,a){d.geometry.normals.push(h[e],h[e+1],h[e+2],h[t],h[t+1],h[t+2],h[a],h[a+1],h[a+2])}function i(e,t,a){d.geometry.uvs.push(E[e],E[e+1],E[t],E[t+1],E[a],E[a+1])}function l(e,t,l,d,u,m,f,h,E,v,c,p){var g,H=a(e),R=a(t),T=a(l);void 0===d?n(H,R,T):(g=a(d),n(H,R,g),n(R,T,g)),void 0!==u&&(H=s(u),R=s(m),T=s(f),void 0===d?i(H,R,T):(g=s(h),i(H,R,g),i(R,T,g))),void 0!==E&&(H=r(E),R=r(v),T=r(c),void 0===d?o(H,R,T):(g=r(p),o(H,R,g),o(R,T,g)))}console.time("OBJLoader");var d,u=[],m=!1,f=[],h=[],E=[];t("");for(var v=/^v\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,c=/^vn\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,p=/^vt\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,g=/^f\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)(?:\s+(-?\d+))?/,H=/^f\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)))?/,R=/^f\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)\/(-?\d+)))?/,T=/^f\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))(?:\s+((-?\d+)\/\/(-?\d+)))?/,w=/^[og]\s*(.+)?/,F=/^s\s+(\d+|on|off)/,x=e.split("\n"),y=0;y<x.length;y++){var A=x[y];A=A.trim();var b;if(0!==A.length&&"#"!==A.charAt(0))if(null!==(b=v.exec(A)))f.push(parseFloat(b[1]),parseFloat(b[2]),parseFloat(b[3]));else if(null!==(b=c.exec(A)))h.push(parseFloat(b[1]),parseFloat(b[2]),parseFloat(b[3]));else if(null!==(b=p.exec(A)))E.push(parseFloat(b[1]),parseFloat(b[2]));else if(null!==(b=g.exec(A)))l(b[1],b[2],b[3],b[4]);else if(null!==(b=H.exec(A)))l(b[2],b[5],b[8],b[11],b[3],b[6],b[9],b[12]);else if(null!==(b=R.exec(A)))l(b[2],b[6],b[10],b[14],b[3],b[7],b[11],b[15],b[4],b[8],b[12],b[16]);else if(null!==(b=T.exec(A)))l(b[2],b[5],b[8],b[11],void 0,void 0,void 0,void 0,b[3],b[6],b[9],b[12]);else if(null!==(b=w.exec(A))){var B=b[0].substr(1).trim();m===!1?(m=!0,d.name=B):t(B)}else if(/^usemtl /.test(A))d.material.name=A.substring(7).trim();else if(/^mtllib /.test(A));else{if(null===(b=F.exec(A)))throw new Error("Unexpected line: "+A);d.material.smooth="1"===b[1]||"on"===b[1]}}for(var L=new THREE.Group,y=0,J=u.length;J>y;y++){d=u[y];var M=d.geometry,O=new THREE.BufferGeometry;O.addAttribute("position",new THREE.BufferAttribute(new Float32Array(M.vertices),3)),M.normals.length>0?O.addAttribute("normal",new THREE.BufferAttribute(new Float32Array(M.normals),3)):O.computeVertexNormals(),M.uvs.length>0&&O.addAttribute("uv",new THREE.BufferAttribute(new Float32Array(M.uvs),2));var I;null!==this.materials&&(I=this.materials.create(d.material.name)),I||(I=new THREE.MeshPhongMaterial,I.name=d.material.name),I.shading=d.material.smooth?THREE.SmoothShading:THREE.FlatShading;var P=new THREE.Mesh(O,I);P.name=d.name,L.add(P)}return console.timeEnd("OBJLoader"),L}};
		//v74: THREE.OBJLoader=function(e){this.manager=void 0!==e?e:THREE.DefaultLoadingManager,this.materials=null},THREE.OBJLoader.prototype={constructor:THREE.OBJLoader,load:function(e,t,a,r){var s=this,n=new THREE.XHRLoader(s.manager);n.setPath(this.path),n.load(e,function(e){t(s.parse(e))},a,r)},setPath:function(e){this.path=e},setMaterials:function(e){this.materials=e},parse:function(e){function t(e){var t={vertices:[],normals:[],uvs:[]},a={name:"",smooth:!0};d={name:e,geometry:t,material:a},u.push(d)}function a(e){var t=parseInt(e);return 3*(t>=0?t-1:t+f.length/3)}function r(e){var t=parseInt(e);return 3*(t>=0?t-1:t+h.length/3)}function s(e){var t=parseInt(e);return 2*(t>=0?t-1:t+E.length/2)}function n(e,t,a){d.geometry.vertices.push(f[e],f[e+1],f[e+2],f[t],f[t+1],f[t+2],f[a],f[a+1],f[a+2])}function o(e,t,a){d.geometry.normals.push(h[e],h[e+1],h[e+2],h[t],h[t+1],h[t+2],h[a],h[a+1],h[a+2])}function i(e,t,a){d.geometry.uvs.push(E[e],E[e+1],E[t],E[t+1],E[a],E[a+1])}function l(e,t,l,d,u,m,f,h,E,v,c,p){var g,H=a(e),R=a(t),T=a(l);void 0===d?n(H,R,T):(g=a(d),n(H,R,g),n(R,T,g)),void 0!==u&&(H=s(u),R=s(m),T=s(f),void 0===d?i(H,R,T):(g=s(h),i(H,R,g),i(R,T,g))),void 0!==E&&(H=r(E),R=r(v),T=r(c),void 0===d?o(H,R,T):(g=r(p),o(H,R,g),o(R,T,g)))}console.time("OBJLoader");var d,u=[],m=!1,f=[],h=[],E=[];t("");for(var v=/^v\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,c=/^vn\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,p=/^vt\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,g=/^f\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)(?:\s+(-?\d+))?/,H=/^f\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)))?/,R=/^f\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)\/(-?\d+)))?/,T=/^f\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))(?:\s+((-?\d+)\/\/(-?\d+)))?/,w=/^[og]\s+(.+)/,F=/^s\s+(\d+|on|off)/,x=e.split("\n"),y=0;y<x.length;y++){var A=x[y];A=A.trim();var B;if(0!==A.length&&"#"!==A.charAt(0))if(null!==(B=v.exec(A)))f.push(parseFloat(B[1]),parseFloat(B[2]),parseFloat(B[3]));else if(null!==(B=c.exec(A)))h.push(parseFloat(B[1]),parseFloat(B[2]),parseFloat(B[3]));else if(null!==(B=p.exec(A)))E.push(parseFloat(B[1]),parseFloat(B[2]));else if(null!==(B=g.exec(A)))l(B[1],B[2],B[3],B[4]);else if(null!==(B=H.exec(A)))l(B[2],B[5],B[8],B[11],B[3],B[6],B[9],B[12]);else if(null!==(B=R.exec(A)))l(B[2],B[6],B[10],B[14],B[3],B[7],B[11],B[15],B[4],B[8],B[12],B[16]);else if(null!==(B=T.exec(A)))l(B[2],B[5],B[8],B[11],void 0,void 0,void 0,void 0,B[3],B[6],B[9],B[12]);else if(null!==(B=w.exec(A))){var b=B[1].trim();m===!1?(m=!0,d.name=b):t(b)}else if(/^usemtl /.test(A))d.material.name=A.substring(7).trim();else if(/^mtllib /.test(A));else{if(null===(B=F.exec(A)))throw new Error("Unexpected line: "+A);d.material.smooth="1"===B[1]||"on"===B[1]}}for(var L=new THREE.Group,y=0,J=u.length;J>y;y++){d=u[y];var M=d.geometry,O=new THREE.BufferGeometry;O.addAttribute("position",new THREE.BufferAttribute(new Float32Array(M.vertices),3)),M.normals.length>0?O.addAttribute("normal",new THREE.BufferAttribute(new Float32Array(M.normals),3)):O.computeVertexNormals(),M.uvs.length>0&&O.addAttribute("uv",new THREE.BufferAttribute(new Float32Array(M.uvs),2));var I;null!==this.materials&&(I=this.materials.create(d.material.name)),I||(I=new THREE.MeshPhongMaterial,I.name=d.material.name),I.shading=d.material.smooth?THREE.SmoothShading:THREE.FlatShading;var P=new THREE.Mesh(O,I);P.name=d.name,L.add(P)}return console.timeEnd("OBJLoader"),L}};
		//v73: THREE.OBJLoader=function(e){this.manager=void 0!==e?e:THREE.DefaultLoadingManager},THREE.OBJLoader.prototype={constructor:THREE.OBJLoader,load:function(e,t,r,n){var a=this,o=new THREE.XHRLoader(a.manager);o.setCrossOrigin(this.crossOrigin),o.load(e,function(e){t(a.parse(e))},r,n)},setCrossOrigin:function(e){this.crossOrigin=e},parse:function(e){function t(e){var t=parseInt(e);return 3*(t>=0?t-1:t+m.length/3)}function r(e){var t=parseInt(e);return 3*(t>=0?t-1:t+E.length/3)}function n(e){var t=parseInt(e);return 2*(t>=0?t-1:t+c.length/2)}function a(e,t,r){l.vertices.push(m[e],m[e+1],m[e+2],m[t],m[t+1],m[t+2],m[r],m[r+1],m[r+2])}function o(e,t,r){l.normals.push(E[e],E[e+1],E[e+2],E[t],E[t+1],E[t+2],E[r],E[r+1],E[r+2])}function d(e,t,r){l.uvs.push(c[e],c[e+1],c[t],c[t+1],c[r],c[r+1])}function s(e,s,i,l,u,v,m,E,c,f,p,g){var h,H=t(e),R=t(s),T=t(i);void 0===l?a(H,R,T):(h=t(l),a(H,R,h),a(R,T,h)),void 0!==u&&(H=n(u),R=n(v),T=n(m),void 0===l?d(H,R,T):(h=n(E),d(H,R,h),d(R,T,h))),void 0!==c&&(H=r(c),R=r(f),T=r(p),void 0===l?o(H,R,T):(h=r(g),o(H,R,h),o(R,T,h)))}console.time("OBJLoader");var i,l,u,v=[];/^o /gm.test(e)===!1&&(l={vertices:[],normals:[],uvs:[]},u={name:""},i={name:"",geometry:l,material:u},v.push(i));for(var m=[],E=[],c=[],f=/v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,p=/vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,g=/vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,h=/f( +-?\d+)( +-?\d+)( +-?\d+)( +-?\d+)?/,H=/f( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))?/,R=/f( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))?/,T=/f( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))?/,b=e.split("\n"),w=0;w<b.length;w++){var F=b[w];F=F.trim();var A;0!==F.length&&"#"!==F.charAt(0)&&(null!==(A=f.exec(F))?m.push(parseFloat(A[1]),parseFloat(A[2]),parseFloat(A[3])):null!==(A=p.exec(F))?E.push(parseFloat(A[1]),parseFloat(A[2]),parseFloat(A[3])):null!==(A=g.exec(F))?c.push(parseFloat(A[1]),parseFloat(A[2])):null!==(A=h.exec(F))?s(A[1],A[2],A[3],A[4]):null!==(A=H.exec(F))?s(A[2],A[5],A[8],A[11],A[3],A[6],A[9],A[12]):null!==(A=R.exec(F))?s(A[2],A[6],A[10],A[14],A[3],A[7],A[11],A[15],A[4],A[8],A[12],A[16]):null!==(A=T.exec(F))?s(A[2],A[5],A[8],A[11],void 0,void 0,void 0,void 0,A[3],A[6],A[9],A[12]):/^o /.test(F)?(l={vertices:[],normals:[],uvs:[]},u={name:""},i={name:F.substring(2).trim(),geometry:l,material:u},v.push(i)):/^g /.test(F)||(/^usemtl /.test(F)?u.name=F.substring(7).trim():/^mtllib /.test(F)||/^s /.test(F)))}for(var O=new THREE.Object3D,w=0,B=v.length;B>w;w++){i=v[w],l=i.geometry;var y=new THREE.BufferGeometry;y.addAttribute("position",new THREE.BufferAttribute(new Float32Array(l.vertices),3)),l.normals.length>0&&y.addAttribute("normal",new THREE.BufferAttribute(new Float32Array(l.normals),3)),l.uvs.length>0&&y.addAttribute("uv",new THREE.BufferAttribute(new Float32Array(l.uvs),2)),u=new THREE.MeshLambertMaterial,u.name=i.material.name;var L=new THREE.Mesh(y,u);L.name=i.name,O.add(L)}return console.timeEnd("OBJLoader"),O}};
		
		THREE.OBJLoader=function(e){this.manager=void 0!==e?e:THREE.DefaultLoadingManager},THREE.OBJLoader.prototype={constructor:THREE.OBJLoader,load:function(e,t,r,n){var a=this,o=new THREE.XHRLoader(a.manager);o.setCrossOrigin(this.crossOrigin),o.load(e,function(e){t(a.parse(e))},r,n)},setCrossOrigin:function(e){this.crossOrigin=e},parse:function(e){function t(e){var t=parseInt(e);return 3*(t>=0?t-1:t+m.length/3)}function r(e){var t=parseInt(e);return 3*(t>=0?t-1:t+E.length/3)}function n(e){var t=parseInt(e);return 2*(t>=0?t-1:t+c.length/2)}function a(e,t,r){l.vertices.push(m[e],m[e+1],m[e+2],m[t],m[t+1],m[t+2],m[r],m[r+1],m[r+2])}function o(e,t,r){l.normals.push(E[e],E[e+1],E[e+2],E[t],E[t+1],E[t+2],E[r],E[r+1],E[r+2])}function d(e,t,r){l.uvs.push(c[e],c[e+1],c[t],c[t+1],c[r],c[r+1])}function s(e,s,i,l,u,v,m,E,c,f,p,g){var h,H=t(e),R=t(s),T=t(i);void 0===l?a(H,R,T):(h=t(l),a(H,R,h),a(R,T,h)),void 0!==u&&(H=n(u),R=n(v),T=n(m),void 0===l?d(H,R,T):(h=n(E),d(H,R,h),d(R,T,h))),void 0!==c&&(H=r(c),R=r(f),T=r(p),void 0===l?o(H,R,T):(h=r(g),o(H,R,h),o(R,T,h)))}console.time("OBJLoader");var i,l,u,v=[];/^o /gm.test(e)===!1&&(l={vertices:[],normals:[],uvs:[]},u={name:""},i={name:"",geometry:l,material:u},v.push(i));for(var m=[],E=[],c=[],f=/v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,p=/vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,g=/vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,h=/f( +-?\d+)( +-?\d+)( +-?\d+)( +-?\d+)?/,H=/f( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))?/,R=/f( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))?/,T=/f( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))?/,b=e.split("\n"),w=0;w<b.length;w++){var F=b[w];F=F.trim();var A;0!==F.length&&"#"!==F.charAt(0)&&(null!==(A=f.exec(F))?m.push(parseFloat(A[1]),parseFloat(A[2]),parseFloat(A[3])):null!==(A=p.exec(F))?E.push(parseFloat(A[1]),parseFloat(A[2]),parseFloat(A[3])):null!==(A=g.exec(F))?c.push(parseFloat(A[1]),parseFloat(A[2])):null!==(A=h.exec(F))?s(A[1],A[2],A[3],A[4]):null!==(A=H.exec(F))?s(A[2],A[5],A[8],A[11],A[3],A[6],A[9],A[12]):null!==(A=R.exec(F))?s(A[2],A[6],A[10],A[14],A[3],A[7],A[11],A[15],A[4],A[8],A[12],A[16]):null!==(A=T.exec(F))?s(A[2],A[5],A[8],A[11],void 0,void 0,void 0,void 0,A[3],A[6],A[9],A[12]):/^o /.test(F)?(l={vertices:[],normals:[],uvs:[]},u={name:""},i={name:F.substring(2).trim(),geometry:l,material:u},v.push(i)):/^g /.test(F)||(/^usemtl /.test(F)?u.name=F.substring(7).trim():/^mtllib /.test(F)||/^s /.test(F)))}for(var O=new THREE.Object3D,w=0,B=v.length;B>w;w++){i=v[w],l=i.geometry;var y=new THREE.BufferGeometry;y.addAttribute("position",new THREE.BufferAttribute(new Float32Array(l.vertices),3)),l.normals.length>0&&y.addAttribute("normal",new THREE.BufferAttribute(new Float32Array(l.normals),3)),l.uvs.length>0&&y.addAttribute("uv",new THREE.BufferAttribute(new Float32Array(l.uvs),2)),u=new THREE.MeshLambertMaterial,u.name=i.material.name;var L=new THREE.Mesh(y,u);L.name=i.name,O.add(L)}return console.timeEnd("OBJLoader"),O}};

		// texture
		var manager = new THREE.LoadingManager();
		manager.onProgress = function ( item, loaded, total ) {
			console.log( item, loaded, total );
		};

		var texture = new THREE.Texture();

		var onProgress = function ( xhr ) {
			if ( xhr.lengthComputable ) {
				var percentComplete = xhr.loaded / xhr.total * 100;
				console.log( Math.round(percentComplete, 2) + '% downloaded' );
			}
		};

		var onError = function ( xhr ) {
		};

		var loader = new THREE.ImageLoader( manager );
		var url = resolve_url_path('panos/model/minion.jpg');
		loader.load( url, function ( image ) {
			texture.image = image;
			texture.needsUpdate = true;
		} );

		// model
		var loader = new THREE.OBJLoader( manager );
		var url = resolve_url_path('panos/model/minion.obj');
		loader.load( url, function ( myobject ) {
			myobject.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.material.map = texture;
				}
			} );
			myobject.position.y = - 80;
			
			
			
			

			assign_object_properties(myobject, "my3dmodel",
			{
					ath:-58,  atv:+7,  depth:1000, scale:2.5, rx:180, ry:-130, rz:0,
					ondown:function(obj)
					{
						myobject.properties.scale *= 1.2;
						update_object_properties(myobject);
					},
					onup:function(myobject)
					{
						myobject.properties.scale /= 1.2;
						update_object_properties(myobject); 
					}
				}
			);
			
			scene.add( myobject );

		}, onProgress, onError );
		
		
		// alert(url);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
		
		
		// preloader = new THREE.Mesh(new THREE.BoxGeometry(1330,570,0), new THREE.MeshBasicMaterial({map:THREE.ImageUtils.loadTexture(resolve_url_path(plugin.folder + "/360.png"))}));
		// assign_object_properties(preloader, "preloader", {ath:90, atv:0,rz:180, depth:2000,scale:2, ondown:function(obj){ }, onup:function(obj){ }});
		// scene.add( preloader );

		plane = new THREE.Mesh(new THREE.BoxGeometry(1330,570,0), new THREE.MeshBasicMaterial({map:THREE.ImageUtils.loadTexture(resolve_url_path(plugin.folder + "/000.jpg"))}));
		for (i = 0; i < 36; i++) {
			var i_temp = i*10;
			if(i_temp == 0)
				i_temp = "000";
			else if(i_temp < 100)
				i_temp = "0" + i_temp;
			plane.material.map = THREE.ImageUtils.loadTexture( resolve_url_path(plugin.folder + "/" + i_temp + ".jpg") );
			// plane.material.needsUpdate = true;
			
		}
		assign_object_properties(plane, "plane", {ath:90, atv:0,rz:180, depth:2000,scale:2, ondown:function(obj){ }, onup:function(obj){ }});
		scene.add( plane );
		// scene.remove( plane );
*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		
		
		
		
		
		
		
		
		// add scene lights
		scene.add( new THREE.AmbientLight(0x333333) );

		var directionalLight = new THREE.DirectionalLight(0xFFFFFF);
		directionalLight.position.x = 0.5;
		directionalLight.position.y = -1;
		directionalLight.position.z = 0;
		directionalLight.position.normalize();
		scene.add( directionalLight );
	}


	function do_object_hittest(mx, my)
	{
		var mouse_x = (mx / krpano.area.pixelwidth)  * 2.0 - 1.0;
		var mouse_y = (my / krpano.area.pixelheight) * 2.0 - 1.0;

		if (krpano.display.stereo)
		{
			mouse_x += (mouse_x < 0.0 ? +1 : -1) * (1.0 - Number(krpano.display.stereooverlap)) * 0.5;
		}

		camera_hittest_raycaster.ray.direction.set(mouse_x, -mouse_y, 1.0).unproject(camera).normalize();

		var intersects = camera_hittest_raycaster.intersectObjects( scene.children );
		var i;
		var obj;

		for (i=0; i < intersects.length; i++)
		{
			obj = intersects[i].object;
			if (obj && obj.properties && obj.properties.enabled)
			{
				return obj;
			}
		}

		return null;
	}


	var handle_mouse_hitobject = null;

	function handle_mouse_touch_events(event)
	{
		var type = "";

		if (event.type == "mousedown")
		{
			type = "ondown";
			krpano.control.layer.addEventListener("mouseup", handle_mouse_touch_events, true);
		}
		else if (event.type == "mouseup")
		{
			type = "onup";
			krpano.control.layer.removeEventListener("mouseup", handle_mouse_touch_events, true);
		}
		else if (event.type == device.browser.events.touchstart)
		{
			type = "ondown";
			krpano.control.layer.addEventListener(device.browser.events.touchend, handle_mouse_touch_events, true);
		}
		else if (event.type == device.browser.events.touchend)
		{
			type = "onup";
			krpano.control.layer.removeEventListener(device.browser.events.touchend, handle_mouse_touch_events, true);
		}

		// get mouse / touch pos
		var ms = krpano.control.getMousePos(event.changedTouches ? event.changedTouches[0] : event);
		ms.x /= krpano.stagescale;
		ms.y /= krpano.stagescale;

		// is there a object as that pos?
		var hitobj = do_object_hittest(ms.x, ms.y);

		if (type == "ondown")
		{
			if (hitobj)
			{
				handle_mouse_hitobject = hitobj;

				hitobj.properties.pressed = true;

				if (hitobj.properties.ondown)
				{
					hitobj.properties.ondown(hitobj);
				}

				if (hitobj.properties.capture)
				{
					krpano.mouse.down = true;
					event.stopPropagation();
				}

				event.preventDefault();
			}
		}
		else if (type == "onup")
		{
			if (handle_mouse_hitobject && handle_mouse_hitobject.properties.enabled)
			{
				if (handle_mouse_hitobject.properties.pressed)
				{
					handle_mouse_hitobject.properties.pressed = false;

					if (handle_mouse_hitobject.properties.onup)
					{
						handle_mouse_hitobject.properties.onup(handle_mouse_hitobject);
					}
				}

				if (handle_mouse_hitobject.properties.onclick)
				{
					if ( hitobj == handle_mouse_hitobject )
					{
						handle_mouse_hitobject.properties.onclick(handle_mouse_hitobject);
					}
				}
			}

			krpano.mouse.down = false;
		}
	}


	function handle_mouse_hovering()
	{
		// check mouse over state
		if (krpano.mouse.down == false)		// currently not dragging?
		{
			var hitobj = do_object_hittest(krpano.mouse.x, krpano.mouse.y);

			if (hitobj != handle_mouse_hitobject)
			{
				if (handle_mouse_hitobject)
				{
					handle_mouse_hitobject.properties.hovering = false;
					if (handle_mouse_hitobject.properties.onout)	handle_mouse_hitobject.properties.onout(handle_mouse_hitobject);
				}

				if (hitobj)
				{
					hitobj.properties.hovering = true;
					if (hitobj.properties.onover)	hitobj.properties.onover(hitobj);
				}

				handle_mouse_hitobject = hitobj;
			}

			if (handle_mouse_hitobject || (krpano.display.stereo == false && krpano.display.hotspotrenderer != "webgl"))
			{
				krpano.cursors.update(false, !!handle_mouse_hitobject);
			}
		}
	}


	function update_scene()
	{
		// animate objects
		var delta = clock.getDelta();


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// if (box)
		// {
			//rotate by time:
			/*
			box.properties.rx += 50 * delta;
			box.properties.ry += 10 * delta;
			update_object_properties(box);
			*/
		// }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		if (box)
		{
			//good for 3D model:
			/*
			krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()
			////////box.properties.ry += 0.01 * krpano_panoview.h;
			box.properties.ath = krpano_panoview.h;
			box.properties.atv = krpano_panoview.v;
			update_object_properties(box);
			*/
		}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			//movie object:
			/*
			krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()

			// preloader.properties.rx =	camera.rotation.x*57.2958;
			// preloader.properties.ry =	camera.rotation.y*57.2958;
			// preloader.properties.rz =	camera.rotation.z*57.2958;
			// preloader.properties.rorder = "XYZ"
			// preloader.properties.ath = krpano_panoview.h;
			// preloader.properties.atv = krpano_panoview.v;
			// update_object_properties(preloader);
			
			plane.properties.rx =	180 + camera.rotation.x*57.2958;
			plane.properties.ry =	180 - camera.rotation.y*57.2958;
			plane.properties.rz =	0 + camera.rotation.z*57.2958;
			plane.properties.rorder = "XYZ"
			plane.properties.ath = krpano_panoview.h;
			plane.properties.atv = krpano_panoview.v;
			update_object_properties(plane);
			
			var src = krpano_panoview.h;
			src = Math.floor(src/4);
			src = src % 36;
			if(src<0)
				src = 36 + src;
			src = src * 10;


			if(src == 0)
				src = "000";
			else if(src < 100)
				src = "0" + src;
			if(src != active_image)
			{
				active_image = src;
				// krpano.trace(3,"floor:" +	src		);
				plane.material.map = THREE.ImageUtils.loadTexture( resolve_url_path(plugin.folder + "/" + src + ".jpg") );
				plane.material.needsUpdate = true;
			}
			*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		if (myobject)
		{
			krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()
			myobject.properties.ath = krpano_panoview.h+1000;
			myobject.properties.atv = krpano_panoview.v;
			update_object_properties(myobject);
		}
		
		for (var i=0; i < animatedobjects.length; i++)
		{
			animatedobjects[i].updateAnimation(1000 * delta);
			
			
			krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()
			animatedobjects[i].properties.ath = krpano_panoview.h;
			animatedobjects[i].properties.atv = krpano_panoview.v;
			update_object_properties(animatedobjects[i]);
		}

		handle_mouse_hovering();
	}
}
