$(document).ready(function() {
	//$('.progress-bar-parent').css("display","block");
	
	
});
/*
	if(window.localStorage.getItem('downloaded_files') == null){
		window.localStorage.setItem('downloaded_files',JSON.stringify(["786","110"]));	
	}
	if(window.localStorage.getItem('download_address') == null){
		
		window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, 
			function(fs) {
				window.localStorage.setItem('download_address',fs.root.toURL());
			}, function(e) {
				alert('failed to get fs');
				alert(JSON.stringify(e));
			}
		);
	}
	
	function play_or_download(URL,Extension) {
		console.log("play_or_download URL: " + URL);
		console.log("play_or_download Extension: " + Extension);

		if (device.platform == 'iOS')
		{
			downloadPath = "cdvfile://localhost/persistent/";
			window.localStorage.setItem('download_address',downloadPath);
		}
		
		downloadPath = window.localStorage.getItem('download_address') + $.md5(URL) + "." + Extension;
		console.log("play_or_download : " + downloadPath);
		if(check_download(URL))
		{
			console.log("play_or_download : check_download");
			
			//playAudio_new(downloadPath,true);
			//var media = new Media(downloadPath, null, function(e) { alert(JSON.stringify(e));});
			//media.play();
		}
		else
		{
			console.log("play_or_download : start_download");
			start_download(URL,Extension);
		}
	}
		
	function start_download(URL,Extension) {
		console.log("start_download check internet");
		networkState = navigator.connection.type;
		if (networkState == Connection.NONE) {
			console.log("start_download : NO internet");
			navigator.notification.alert(
				'شما برای اینکار به اینترنت نیاز دارید',  // message
				goto_home,         // callback
				'اخطار',            // title
				'تائید'                  // buttonName
			);
		}
		else{
			console.log("start_download : we have internet");

			console.log("start_download URL: " + URL);
			console.log("start_download Extension: " + Extension);
			
			var FileTransfer_OBJ = new FileTransfer();
			var uri = encodeURI(URL + "?" + Math.random());
			
			if (device.platform == 'iOS')
			{
				downloadPath = "cdvfile://localhost/persistent/";
				window.localStorage.setItem('download_address',downloadPath);
			}
			
			$('.progress-bar-parent').css("display","block");
			
			downloadPath = window.localStorage.getItem('download_address') + $.md5(URL) + "." + Extension;
			console.log("start_download : " + downloadPath);
			
			FileTransfer_OBJ.onprogress = function(progressEvent) {
				if (progressEvent.lengthComputable) {
					var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
					$('#status').html(perc + "% بارگذاری شد...");
					$('.progress-bar-percent').css('width',perc + "%");
					//progress_bar_element.css('width',perc);
				} else {
					$('#status').html($('#status').html() + ".");
					//progress_bar_element.css('width',progress_bar_element.width()+1);
					$('.progress-bar-percent').css('width',$('.progress-bar-parent').find('span').width()+1);
				}
			};
			
			FileTransfer_OBJ.download(uri, downloadPath, 
				function(entry) {	
					$('#status').html("");
					$('.progress-bar-parent').find('span').css('width','2%');
					console.log("start_download : done");
					temp_array = JSON.parse(window.localStorage.getItem('downloaded_files'));
					temp_array.push($.md5(URL));
					window.localStorage.setItem('downloaded_files',JSON.stringify(temp_array));	
					
					temp_element.removeClass("need_download");
					$('.progress-bar-parent').css("display","none");				
				}, 
				function(error) {
					//alert('Crap something went wrong...');	
					//alert(JSON.stringify(error));
					navigator.notification.alert(
						'خطا در دانلود فایل',  // message
						goto_home,         // callback
						'اخطار',            // title
						'تائید'                  // buttonName
					);
					$('.progress-bar-parent').find('span').css('width','2%');
					$('.progress-bar-percent').css('width',"");
					$('.progress-bar-parent').css("display","none");
				},
				true
			);
			
			$("#abort").click( function(i) {
				FileTransfer_OBJ.abort();
				$('.progress-bar-parent').find('span').css('width','2%');
				$('.progress-bar-percent').css('width',"");
				$('.progress-bar-parent').css("display","none");
				window.location.href = "index.html";
			});
			
		}
	}
	
	function check_download(URL) {
		console.log("check_download URL: " + URL);
		var temp_array = JSON.parse(window.localStorage.getItem('downloaded_files'));
		console.log("check_download Extension: " + window.localStorage.getItem('downloaded_files'));
		if($.inArray($.md5(URL),temp_array) != -1)
		{
			console.log("check_download true");
			return true;
		}
		else
		{
			console.log("check_download false");
			return false;
		}
	}
		
*/
		
		
		
		
		
		
		
		
		
		
		
		