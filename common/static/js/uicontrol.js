

/*
Profile picture control*/
$(function () {

    if ($(window).width() < 1200) {
        $('#prof').width($('#prof').height());
    }
    else{
        $('#prof').height($('#prof').width());
    }
    $(window).resize(function () {

        if ($(window).width() < 1200) {
            $('#prof').width($('#prof').height());
            $("#content").appendTo("#mobile-content-container");
        }
        else {
            $("#content").appendTo("#wide-content-container");
            $('#prof').height($('#prof').width());
        }
    });
});



/*If page loaded from < 1200px screen*/
$(function () {
    if ($(window).width() < 1200) {
        $("#content").appendTo("#mobile-content-container");
    }
});


$(document).on("touchstart", "#img-container", function () {
    //$("#img-container").addClass("nohover");
    //$("#img-container").addClass("img-container-mobile");
    $("#img-container").addClass("img-container-nohover");
    $("#img-container").removeClass("img-container");
    $("#img-container").addClass("img-container-mobile");
}).on("touchend", function () {
    $("#img-container").removeClass("img-container-mobile");
}).on("touchcancel", function () {
    $("#img-container").removeClass("img-container-mobile");
});


