

$(document).ready(function () {
    var pathname = window.location.pathname;
    window.history.pushState({ page: pathname}, 'Subranch', pathname);
    /*if(window.location.pathname == '/creategroup/'){
        document.getElementById("modal-window").classList.toggle("modal-window");
        document.getElementById("group-container").classList.toggle("show");
    }*/
})



/*
Profile picture control*/
$(function () {

    /*$('<a class="prof" id = "prof"></a>').appendTo('#container-side');
    $('<div id="inner-container" class = "inner-container"></div>').appendTo('#container-side');
    $('<button class="feed" id = "feed">feed</button>').appendTo('#inner-container');
    $('<button class="my-groups" id = "my-groups">my-groups</button>').appendTo('#inner-container');
    $('<button class="map" id = "map">map</button>').appendTo('#inner-container');*/

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




$(function () {

    $('.drawer-btn, #mobile-drawer').click(function (event) {
        document.getElementById("mobile-content-container").classList.toggle("mobile-slider");
        document.getElementById("main-wrapper").classList.toggle("content-drawer");
        document.getElementById("container-side").classList.toggle("slider");
        document.getElementById("prof").classList.toggle("prof-remove-shadow");
    });
});
