/*
 * Scale a page using CSS3
 * @param minWidth {Number} The width of your wrapper or your page's minimum width.
 * @return {Void}
 */
//scalePage(990,"#main",false);
//scalePage(990);
function scalePage(minWidth,target="body",all_width=true) {
 
    //Check parameters
    if (minWidth == "" || target=="") {
        console.log("minWidth not defined. Exiting");
        return;
    }
	
 
    //Do not scale if a touch device is detected.
	/*
    if (isTouchDevice()) {
        return;
    }
	*/
 
    //The 'body' tag should always be the parent element.
    //var parentElem = "body";
    var parentElem = target;
 
    //Wrap content to prevent long vertical scrollbars
    var superContainer = jQuery(parentElem);
 
    //Get current dimensions of content
    var winW = jQuery(window).width();
    var docH = superContainer.height();
 
    scalePageNow();
    jQuery(window).resize(scalePageNow);
 
    //Nested functions
 
    function scalePageNow() {
        //Defining the width of 'supercontainer' ensures that content will be
        //centered when the window is wider than the original content.
        //Comment the following line if you need to enable the conditionals below.
        superContainer.width(minWidth);
 
        //Get the width of the window
        winW = jQuery(window).width();
 
        //Uncomment conditionals if content must be scaled only when content is wider than the window.
		if(!all_width)
		{
					if ( winW < minWidth )
					{
							console.log("1");
							var newWidth = winW / minWidth; //percentage
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
								"-webkit-transform-origin": "0 0"
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
							"margin-left":"0",
							"margin-right":"0",
						});
		}
    }
 
    function isTouchDevice() {
        return !!('ontouchstart' in window || window.navigator.msMaxTouchPoints);
    }
}