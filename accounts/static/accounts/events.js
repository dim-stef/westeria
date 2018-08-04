window.onload = function(){
    (function () {
        $('input').hover(
            function() {
                $( this ).addClass( "hover" );
              }, function() {
                $( this ).removeClass( "hover" );
              }
        );
    })();

    (function () {
        $('.register').hover(
            function() {
                $( this ).addClass( "register-animation" );
              }, function() {
                $( this ).removeClass( "register-animation" );
              }
        );
    })();

    
};
$(function(){
    $.each($('input, textarea'), function(index, value) {
       $(this).data('holder', $(this).attr('placeholder'));
   });

   $('input, textarea').focusin(function(){
       $(this).attr('placeholder','');
   });

   $('input, textarea').focusout(function(){
       $(this).attr('placeholder', $(this).data('holder'));
   });
})
