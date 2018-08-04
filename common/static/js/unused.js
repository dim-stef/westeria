/*remove menu when pressed outside of button */
$(document).click(function (event) {
    if (!$(event.target).closest('#dropdown-btn').length) {
        if ($('#dropdown-content').is(":visible")) {
            document.getElementById("dropdown-content").classList.remove("show");
        }
    }
});


/*
For mini-menu button to appear/disappear
*/
function btn_show() {
    document.getElementById("dropdown-content").classList.toggle("show");
}

$('#dropdown-btn').on('click', btn_show);