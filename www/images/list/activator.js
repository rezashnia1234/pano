var krpanoplugin = function()
{
    var local = this;   // save the 'this' pointer from the current plugin object

    var krpano = null;  // the krpano and plugin interface objects
    var plugin = null;

    var plugincanvas = null;        // optionally - a canvas object for graphic content
    var plugincanvascontext = null;


    // registerplugin - startup point for the plugin (required)
    // - krpanointerface = krpano interface object
    // - pluginpath = string with the krpano path of the plugin (e.g. "plugin[pluginname]")
    // - pluginobject = the plugin object itself (the same as: pluginobject = krpano.get(pluginpath) )
    local.registerplugin = function(krpanointerface, pluginpath, pluginobject)
    {
        krpano = krpanointerface;
        plugin = pluginobject;

        // say hello
        krpano.trace(1,"hello from plugin[" + plugin.name + "]");
		//krpano.call("set(plugin[MotionGesture].curent_pano,scene[get(xml.scene)].name);")
		//krpano.set(plugin[MotionGesture].curent_pano,scene[get(xml.scene)].name);
        //krpano.trace(1,"000000" + plugin.curent_pano);
		/**/
		$(window).scroll(function() {
			setTimeout(function(){
				if ( $("#" + plugin.div_target ).parent(".content").hasClass( "active" ) )
				{
					krpano.call('set(plugin[gyro].enabled,"true");');
					// console.log(plugin.div_target + " is active");
				}
				else
				{
					krpano.call('set(plugin[gyro].enabled,"false");');
					// console.log(plugin.div_target + " is not active");
				}
			}, 100);	
		});

    }

    // unloadplugin - end point for the plugin (optionally)
    // - will be called from krpano when the plugin will be removed
    // - everything that was added by the plugin (objects,intervals,...) should be removed here
    local.unloadplugin = function()
    {
        plugin = null;
        krpano = null;
    }

    // onresize - the plugin was resized from xml krpano (optionally)
    // - width,height = the new size for the plugin
    // - when not defined then only the parent html element will be scaled
    local.onresize = function(width,height)
    {
        // not used in this example

        return false;
    }
};