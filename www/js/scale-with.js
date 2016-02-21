/*
 * Scale a page using CSS3
 * By Hamid Reza Shakiba nia
 * All Right Reserved 
 */
 
//scalePage(990,"#main",false);
//scalePage(990);
function scalePage_center(minWidth,target,all_width) {
 
    //Check parameters
    if (minWidth == "") {
        console.log("minWidth not defined. Exiting");
        return;
    }
    if (!target || target=="")
        target = "body"
    if (all_width == 'undefined')
        all_width = "true"

	
    var parentElem = target;
 
    //Wrap content to prevent long vertical scrollbars
    var superContainer = jQuery(parentElem);
 
    //Get current dimensions of content
    var winW = jQuery(window).width();
    var winH = jQuery(window).height();
    var docH = superContainer.height();
    var docW = superContainer.width();

    scalePageNow();
    scalePageNow();
	//setTimeout(scalePageNow,50);
	//setTimeout(scalePageNow,500);
	//setTimeout(scalePageNow,1000);
	//setTimeout(scalePageNow,1500);
	//setTimeout(scalePageNow,2000);
	//setTimeout(scalePageNow,2500);
	//setTimeout(scalePageNow,3000);
    jQuery(window).resize(scalePageNow);
    setTimeout(StopScale,500);
 
	function StopScale() {
		jQuery(window).off("resize");
	}
 
    function scalePageNow() {
		//Get the width of the window
        winW = jQuery(window).width();
		winH = jQuery(window).height();

		if(!all_width)
		{
					if ( winH < minWidth )
					{
							console.log("1");
							// var newWidth = winW / minWidth; //percentage
							// var newWidth = winH / minWidth; //percentage
							var newHeight = (docH * (newWidth * minWidth)) / minWidth; //pixel
							superContainer.css({
								"transform": "scale(" + newWidth + ")",
								"transform-origin": "0 0",
								"-ms-transform": "scale(" + newWidth + ")",
								"-ms-transform-origin": "0 0",
								"-moz-transform": "scale(" + newWidth + ")",
								"-moz-transform-origin": "0 0",
								"-o-transform": "scale(" + newWidth + ")",
								"-o-transform-origin": "0 0",
								"-webkit-transform": "scale(" + newWidth + ")",
								"-webkit-transform-origin": "0 0",
								"margin-left": (winW - (winH/minWidth)*docW) * 0.5 ,
							});
					}
					else
					{
						 console.log("2");
						 superContainer.css({
						  "transform":"scale("+newWidth+")",
						  "transform-origin":"0 0",
						  "-ms-transform":"scale("+newWidth+")",
						  "-ms-transform-origin":"0 0",
						  "-moz-transform":"scale(1,1)",
						  "-moz-transform-origin":"0.5 0.5",
						  "-o-transform":"scale(1,1)",
						  "-o-transform-origin":"0.5 0.5",
						  "-webkit-transform":"scale(1,1)",
						  "-webkit-transform-origin":"0.5 0.5"
						 });
					}
		}
		else
		{
					console.log("3");
					var newWidth = winW / minWidth; //percentage
					// var newWidth = winH / minWidth; //percentage
					// var newHeight = (docH * (newWidth * minWidth)) / minWidth; //pixel
					// var newWidth = winW / minWidth; //percentage
					// var newHeight = (docH * (newWidth * minWidth)) / minWidth; //pixel
					superContainer.css({
						"transform": "scale(" + newWidth + ")",
						"transform-origin": "0 0",
						"-ms-transform": "scale(" + newWidth + ")",
						"-ms-transform-origin": "0 0",
						"-moz-transform": "scale(" + newWidth + ")",
						"-moz-transform-origin": "0 0",
						"-o-transform": "scale(" + newWidth + ")",
						"-o-transform-origin": "0 0",
						"-webkit-transform": "scale(" + newWidth + ")",
						"-webkit-transform-origin": "0 0",
						"margin-left": 0 ,
					});
		}
    }
}



function scalePage(minWidth,target,all_width) {
 
    //Check parameters
    if (minWidth == "" || target=="") {
        console.log("minWidth not defined. Exiting");
        return;
    }
    if (!target)
        target = "body"
    if (all_width == 'undefined')
        all_width = "true"
	
 
    var parentElem = target;
 
    //Wrap content to prevent long vertical scrollbars
    var superContainer = jQuery(parentElem);
 
    //Get current dimensions of content
    var winW = jQuery(window).width();
    var winH = jQuery(window).height();
    var docH = superContainer.height();

	
	
	
	var W_p;
	var H_p;
	
	if(superContainer.css('left')=="0px")
		W_p = "left ";
	else if(superContainer.css('right')=="0px")
		W_p = "right ";
	else
		W_p = "0 ";
		
	if(superContainer.css('top')=="0px")
		H_p = "top ";
	else if(superContainer.css('bottom')=="0px")
		H_p = "bottom ";
	else
		H_p = "0 ";

		
 
    scalePageNow();
    scalePageNow();

    jQuery(window).resize(scalePageNow);
    setTimeout(StopScale,2000);
 
	function StopScale() {
		jQuery(window).off("resize");
	}

    function scalePageNow() {
 
        winW = jQuery(window).width();
		winH = jQuery(window).height();
 
		if(!all_width)
		{
					if ( winH < minWidth )
					{
							console.log("1");
							var newWidth = winW / minWidth; //percentage
							var newHeight = (docH * (newWidth * minWidth)) / minWidth; //pixel
							superContainer.css({
								"transform": "scale(" + newWidth + ")",
								"transform-origin": W_p + H_p,
								"-ms-transform": "scale(" + newWidth + ")",
								"-ms-transform-origin": W_p + H_p,
								"-moz-transform": "scale(" + newWidth + ")",
								"-moz-transform-origin": W_p + H_p,
								"-o-transform": "scale(" + newWidth + ")",
								"-o-transform-origin": W_p + H_p,
								"-webkit-transform": "scale(" + newWidth + ")",
								"-webkit-transform-origin": W_p + H_p
							});
					}
					else
					{
						 console.log("2");
						 superContainer.css({
						  "transform":"scale("+newWidth+")",
						  "transform-origin":"0 0",
						  "-ms-transform":"scale("+newWidth+")",
						  "-ms-transform-origin":"0 0",
						  "-moz-transform":"scale(1,1)",
						  "-moz-transform-origin":"0.5 0.5",
						  "-o-transform":"scale(1,1)",
						  "-o-transform-origin":"0.5 0.5",
						  "-webkit-transform":"scale(1,1)",
						  "-webkit-transform-origin":"0.5 0.5"
						 });
					}
		}
		else
		{
						console.log("3");
						var newWidth = winW / minWidth; //percentage
						var newWidth = winH / minWidth; //percentage
						var newHeight = (docH * (newWidth * minWidth)) / minWidth; //pixel
						superContainer.css({
							"transform": "scale(" + newWidth + ")",
							"transform-origin": W_p + H_p,
							"-ms-transform": "scale(" + newWidth + ")",
							"-ms-transform-origin": W_p + H_p,
							"-moz-transform": "scale(" + newWidth + ")",
							"-moz-transform-origin": W_p + H_p,
							"-o-transform": "scale(" + newWidth + ")",
							"-o-transform-origin": W_p + H_p,
							"-webkit-transform": "scale(" + newWidth + ")",
							"-webkit-transform-origin": W_p + H_p,
							//"margin-left":"auto",
							//"margin-right":"auto",
						});
		}
    }
}