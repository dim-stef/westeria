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
/*$(document).ready(function () {
    $("#settings, #settings-mobile").click(function (event) {
        //event.preventDefault();


        $.ajax({
            url: "/settings",
            success: function () {
                $("#content").load("settings #settings-container", function () {
                    console.log("inner");
                });
            },
        });

        //window.history.pushState({page: '/settings'}, 'Subranch - settings', '/settings');
    });
});*/
