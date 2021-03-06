$(document).ready(function () {


    var $myForm = $('.group-form')
    $myForm.submit(function(event){
        event.preventDefault()

        var formElement = document.querySelector(".group-form");
        var formData = new FormData(formElement);
        var $thisURL = $myForm.attr('data-url') // or set your own url
        

        if(!formData.get("name")){
            console.log(formData.get("name"));
            if(!$('#name-required').length)
            $( '<p id="name-required">This field is required</p>' ).insertAfter( "#name-container" );
        }

        $.ajax({
            type: "POST",
            url: $thisURL,
            data: formData,
            processData: false,
            contentType: false,
            success: handleFormSuccess,
            error: handleFormError
        })
    })

    function handleFormSuccess(data, textStatus, jqXHR){
        $('#success-message').html(data.success);

        
        //$myForm.reset(); // reset form data
    }

    function handleFormError(jqXHR, textStatus, errorThrown){
        console.log(jqXHR)
        console.log(jqXHR.responseJSON.name[0])
        if($("#name-error").length){
            $('#name-error').html(jqXHR.responseJSON.name[0]);
        }else{
            $( '<p id = "name-error">' + jqXHR.responseJSON.name[0] + '</p>' ).insertAfter( "#name-container" );
        }
        document.getElementById("name-label").classList.add("name-label-error");
        document.getElementById("id_name").classList.add("name-error");
        console.log(textStatus)
        console.log(errorThrown)
    }

});