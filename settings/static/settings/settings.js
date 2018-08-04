  

$(document).ready(function () {


    var $myForm = $('.settings-form')
    $myForm.submit(function(event){
        event.preventDefault()

        var formElement = document.querySelector(".settings-form");
        var formData = new FormData(formElement);
        var $thisURL = $myForm.attr('data-url') || window.location.href // or set your own url

        $.ajax({
            headers: {
                'X-HTTP-Method-Override': 'PATCH'
            },
            type: "POST",
            url: $thisURL,
            data: formData,
            processData: false,
            contentType: false,
            success: handleFormSuccess,
            error: handleFormError,
            complete: function(r){
                console.log(/*JSON.stringify*/(r.responseText));
                $.ajax({
                    url: '/api/profile/',
                    type: 'get',
                    success: function (data) {
                        console.log("in");
                        document.getElementsByClassName('prof-pic')[0].setAttribute("src", data[0].profile_image);
                    },
                    failure: function (data) {
                        alert('failed to load profile image');
                    }
                });
            },
        })
    })

    function handleFormSuccess(data, textStatus, jqXHR){
        console.log(data)
        console.log(textStatus)
        console.log(jqXHR)
        //$myForm.reset(); // reset form data
    }

    function handleFormError(jqXHR, textStatus, errorThrown){
        console.log(jqXHR)
        console.log(textStatus)
        console.log(errorThrown)
    }

});