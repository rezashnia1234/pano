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
	var object_count;
	var krpano_panoview = null;
	var temp_counter = 2;
	
	local.registerplugin = function(krpanointerface, pluginpath, pluginobject)
	{
		krpano = krpanointerface;
		device = krpano.device;
		plugin = pluginobject;




		krpano.debugmode = true;
		krpano.trace(0, "rotate krpano plugin" );
		start();
	}

	local.unloadplugin = function()
	{
		// no unloading support at the moment
		// alert();
		// scene.remove( plane );
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


	var active_image = "000";

	function start()
	{
		console.log("video_01");
		object_count = parseInt(plugin.object_count);
		/**/
		for (i = 0; i < object_count; i++) {
			var i_temp = i*10;
			if(i_temp == 0)
				i_temp = "000";
			else if(i_temp < 100)
				i_temp = "0" + i_temp;
			
			var temp_path = resolve_url_path(plugin.folder + i_temp + '.jpg');
			krpano.call("addhotspot(rotate_object_" + i_temp + ");set(hotspot[rotate_object_" + i_temp + "].url," + temp_path + ");hotspot[rotate_object_" + i_temp + "].loadstyle(rotate_object);");
		}
		
		// var i_temp = "000";
		// var temp_path = resolve_url_path(plugin.folder + i_temp + '.jpg');
		// krpano.call("addhotspot(rotate_object_" + i_temp + ");");
		// krpano.call("set(hotspot[rotate_object_" + i_temp + "].url," + temp_path + ");");
		// krpano.call("hotspot[rotate_object_" + i_temp + "].loadstyle(rotate_object);");
		
		
		// use the krpano onviewchanged event as render-frame callback (this event will be directly called after the krpano pano rendering)
		krpano.set("events[__threejs__].keep", true);
		// krpano.set("events[__threejs__].onviewchange", adjust_krpano_rendering);	// correct krpano view settings before the rendering
		krpano.set("events[__threejs__].onviewchanged", render_frame);

		// enable continuous rendering (that means render every frame, not just when the view has changed)
		// krpano.view.continuousupdates = true;
		krpano.view.continuousupdates = false;



	}



	function render_frame()
	{
		function my_mod(x,y)
		{
			z=~~(x/y);
			z= x - z*y;
			return z;
		}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			//movie object:
			krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()
	
			var src = krpano_panoview.h;
			
			src = ~~(src/4);
			
			src = my_mod(src,object_count);
			
			if(src<0)
				src = object_count + src;
			src = src * 10;


			if(src == 0)
				src = "000";
			else if(src < 100)
				src = "0" + src;
			
			// console.log("src : " + src);
			if(src != active_image)
			{
				active_image = src;
				temp_counter++;
				// krpano.trace(3,"floor:" +	src		);
				// var temp_path = resolve_url_path(plugin.folder + src + '.jpg');
				// krpano.call("set(hotspot[" + plugin.object_name + "].url," + temp_path + ");")
				krpano.call("set(hotspot[rotate_object_" + src + "].zorder," + temp_counter + ");")
			}

			/*
			krpano_panoview = krpano.view.getState(krpano_panoview);	// the 'krpano_panoview' object will be created and cached inside getState()

			plane.properties.rx =	180 + camera.rotation.x*57.2958;
			plane.properties.ry =	180 - camera.rotation.y*57.2958;
			plane.properties.rz =	0 + camera.rotation.z*57.2958;
			plane.properties.rorder = "XYZ"
			plane.properties.ath = krpano_panoview.h;
			plane.properties.atv = krpano_panoview.v;
			update_object_properties(plane);
			
			var src = krpano_panoview.h;
			src = ~~(src/4);
			src = my_mod(src,object_count);
			
			if(src<0)
				src = object_count + src;
			src = src * 10;


			if(src == 0)
				src = "000";
			else if(src < 100)
				src = "0" + src;
			if(src != active_image)
			{
				active_image = src;
				// krpano.trace(3,"floor:" +	src		);
				plane.material.map = THREE.ImageUtils.loadTexture( resolve_url_path(plugin.folder + src + ".jpg") );
				plane.material.needsUpdate = true;
			}
			*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	}

	function build_scene()
	{
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*

		object_count = parseInt(plugin.object_count);
		
		plane = new THREE.Mesh(new THREE.BoxGeometry(plugin.object_width,plugin.object_height,0), new THREE.MeshBasicMaterial({map:THREE.ImageUtils.loadTexture(resolve_url_path(plugin.folder + "000.jpg"))}));
		for (i = 0; i < object_count; i++) {
			var i_temp = i*10;
			if(i_temp == 0)
				i_temp = "000";
			else if(i_temp < 100)
				i_temp = "0" + i_temp;
			plane.material.map = THREE.ImageUtils.loadTexture( resolve_url_path(plugin.folder + i_temp + ".jpg") );
			// plane.material.needsUpdate = true;
			
		}
		// assign_object_properties(plane, "plane", {ath:90, atv:0,rz:180, depth:2000,scale:plugin.object_scale, ondown:function(obj){scene.remove( plane );krpano.call("vr_menu_loadhome();");}, onup:function(obj){ }});
		// assign_object_properties(plane, "plane", {ath:90, atv:0,rz:180, depth:2000,scale:plugin.object_scale, ondown:function(obj){scene.remove( plane );krpano.call("loadscene('scene_01_sphere', 0, null, NOPREVIEW|MERGE|KEEPVIEW|KEEPMOVING, BLEND(1));");}, onup:function(obj){ }});
		// assign_object_properties(plane, "plane", {ath:90, atv:0,rz:180, depth:2000,scale:plugin.object_scale, ondown:function(obj){scene.remove( plane );krpano.call("loadscene(get(plugin[WebVR].pervious_pano), 0, null, NOPREVIEW|MERGE|KEEPVIEW|KEEPMOVING, BLEND(1));");}, onup:function(obj){ }});
		assign_object_properties(plane, "plane", {ath:90, atv:0,rz:180, depth:2000,scale:plugin.object_scale, ondown:function(obj){krpano.call("loadscene(get(plugin[WebVR].pervious_pano), 0, null, NOPREVIEW|MERGE|KEEPVIEW|KEEPMOVING, BLEND(1));");}, onup:function(obj){ }});
		scene.add( plane );
*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	}
}
