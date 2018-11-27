$('.login').on('submit', function () {
    let formData = new FormData(document.querySelector('.login'))
    let login = formData.get('login');
    let password = formData.get('password');
    let data = {
        email:login,
        password:password
    };

    $.ajax({
      type: "POST",
      url: '/token/',
      data: data,
      success: function( data ) {
          console.log(data);
          localStorage.setItem('token', data.token)
      }});
});

$('.signup').on('submit', function () {
    let formData = new FormData(document.querySelector('.signup'))
    let email = formData.get('email');
    let password = formData.get('password');
    let data = {
        email:email,
        password:password
    };

    $.ajax({
      type: "POST",
      url: '/token/',
      data: data,
      success: function( data ) {
          console.log(data);
          localStorage.setItem('token', data.token)
      }});
});