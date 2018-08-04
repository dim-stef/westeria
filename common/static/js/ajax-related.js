$.ajax({
    url: '/api/profile/',
    type: 'get',
    success: function (resp) {
        tmp = resp;
        $('#prof').html(
            '<div id="img-container" class = "img-container"></div><img src=' + resp[0].profile_image + ' alt=" " class= "prof-pic noselect" style="width:100%">'

        );
    },
    failure: function (data) {
        alert('failed to load profile image');
    }
});


/*
Buttons events
*/
$(document).ready(function () {
    $("#settings, #settings-mobile").click(function (event) {
        event.preventDefault();


        $.ajax({
            url: "/settings",
            success: function () {
                console.log("in");
                $("#content").load("settings #settings-container",function(){
                    console.log("inner");
                });
            },
        });

        window.history.pushState({ page: '/settings' }, 'Subranch - settings', '/settings');
    });

    $("#feed, #feed-mobile").click(function (event) {
        event.preventDefault();


        $.ajax({
            url: "/",
            success: function () {
                $("#content").load("/ #content");
            },
        });

        window.history.pushState({ page: '/' }, 'Subranch', '/');
    });

    $("#create,#create-mobile").click(function (event) {
        event.preventDefault();
        $.ajax({
            url: "/creategroup",
            success: function () {
                if(!$("#group-container").length){
                    $("#creategroup-container").load("/creategroup #group-container", function(){
                        $('<script>', {src: '/static/groups/js/creategroupajax.js'}).appendTo('head');
                        document.getElementById("modal-window").classList.add("modal-window");
                        document.getElementById("group-container").classList.add("show"); 
                    });
                }
            }
        });
        //window.history.pushState({ page: '/creategroup' }, 'Subranch', '/creategroup');

    });
})

$('#create,#create-mobile,#modal-window').click(function (event) {
    if($("#group-container").length){
        document.getElementById("modal-window").classList.toggle("modal-window");
        document.getElementById("group-container").classList.toggle("show");   
    } 
});


/*
Modify browser history so back-forward buttons dont't break from ajax page loading
*/
$(window).on("popstate", function (e) {
    var url;
    try {
        url = e.originalEvent.state.page;
    }
    catch (err) {
        url = null
    }

    if (url != null) {

        if ($(window).width() < 1200) {
            $("#mobile-content-container").load(url + " #content")
        }
        else {
            $("#wide-content-container").load(url + " #content")
        }
    }
});
