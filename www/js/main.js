$(document).ready(function(){

  setTimeout(function(){ setwidth(); }, 100);







});
  function setwidth(){
    //alert($( window ).height());

    var main_width_akhbar = $(".akhbar_hader").width()/2;
    var main_width_about = $(".about_hader").width()/2;
    var main_width_photo = $(".photo_hader").width()/2;
    var main_width_kargah = $(".kargah_hader").width()/2;

    var akhbar_width = $(".akhbar_row").width();
	//alert($(".akhbar_row").width());
    $(".akhbar_row > a").width(akhbar_width - 85);




    $(".about_hader .header_left.about").width(main_width_about - 133);
    $(".about_hader .header_right.about").width(main_width_about - 136);
	
	
	if(main_width_photo*2>350)
	{
		$(".photo_hader .header_left.about").width(main_width_photo - 136);
		$(".photo_hader .header_right.about").width(main_width_photo - 136);
	}
	else
	{
		$(".photo_hader .header_left.about").width(main_width_photo - 80);
		$(".photo_hader .header_right.about").width(main_width_photo - 80);
	}
	
    $(".akhbar_hader .header_left").width(main_width_akhbar - 133);
    $(".akhbar_hader .header_right").width(main_width_akhbar - 136);


    $(".kargah_hader .header_left").width(main_width_kargah - 133);
    $(".kargah_hader .header_right").width(main_width_kargah - 136);
    var screen_height = $( window ).height();
    //var content_height = $('.akhbar_content_main').height();


    //if(screen_height -300 > content_height){
    //  $(".akhbar_content_main").height(screen_height - 380);
    //}


    var content_height = $('.akhbar_inner_scroll').height();
    if(screen_height -300 > content_height){
      $(".akhbar_inner_scroll").height(screen_height - 480);
    }

    var content_height = $('.ghorfe_content').height();
    if(screen_height -400 > content_height){
      $(".ghorfe_content").height(screen_height - 580);
    }

    var content_height = $('.multi_content').height();
    if(screen_height -300 > content_height){
      $(".multi_content").height(screen_height - 600);
    }


  }
