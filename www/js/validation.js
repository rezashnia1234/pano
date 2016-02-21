


 function validation()
 {

		var name=document.enq.name.value;

		if(name=='')
		{
			// alert("پر کردن نام اجباریست");
			navigator.notification.alert(
				'پر کردن نام اجباریست',	// message
				temp_function,			// callback
				'اخطار',			// title
				'تائید'				// buttonName
			);
			return false;
		}
	

		
		var rayanama=document.enq.rayanama.value;

		if(rayanama=='')
		{
			// alert("پرکردن رایانامه اجباریست");
			navigator.notification.alert(
				'پرکردن رایانامه اجباریست',	// message
				temp_function,			// callback
				'اخطار',			// title
				'تائید'				// buttonName
			);
			return false;
		}

		
		var number=document.enq.tell.value;

		if(number=='')
		{
			// alert("پر کردن تلفن همراه اجباریست");
			navigator.notification.alert(
				'پر کردن تلفن همراه اجباریست',	// message
				temp_function,			// callback
				'اخطار',			// title
				'تائید'				// buttonName
			);
			return false;
		}else{
			$(".mypreload").css("display","block");
			$.ajax({
				type: 'POST',
				url: 'http://app.irdmfestival.ir/news/register.php', 
				data: $("form").serialize()
			})
			.done(function(data){
				if(data == "tekrary"){
					// alert("تکراری است")
					window.localStorage.setItem('RunCounter',10);
					navigator.notification.alert(
						'اطلاعات شما قبلا در سامانه ثبت شده است.',	// message
						goto_home,			// callback
						'اخطار',			// title
						'تائید'				// buttonName
					);
					window.localStorage.setItem('RunCounter',10);
					window.localStorage.setItem('registerd',"yes");
					window.localStorage.setItem('mobile',$(".mobile").val());
				}else if(data == "done"){
					// alert("با موفقیت ثبت شد");
					window.localStorage.setItem('RunCounter',10);
					window.localStorage.setItem('registerd',"yes");
					window.localStorage.setItem('mobile',$(".mobile").val());
					navigator.notification.alert(
						'اطلاعات شما با موفقیت در سامانه ثبت شد.',	// message
						goto_home,			// callback
						'اطلاعیه',			// title
						'تائید'				// buttonName
					);
				}
				else
				{
					// alert("خطا در ارسال");
					navigator.notification.alert(
						'خطا در ارسال اطلاعات ، لطفا از اتصال دستگاه به اینترنت اطمینان حاصل فرمایید.',	// message
						goto_home,			// callback
						'اخطار',			// title
						'تائید'				// buttonName
					);
				}
			})
			.fail(function() {
				// alert("خطا در ارسال");
					navigator.notification.alert(
						'خطا در ارسال اطلاعات ، لطفا از اتصال دستگاه به اینترنت اطمینان حاصل فرمایید.',	// message
						goto_home,			// callback
						'اخطار',			// title
						'تائید'				// buttonName
					);
			});				  
			// to prevent refreshing the whole page page  
			return false;
		}

		


	
  return true;
 }
