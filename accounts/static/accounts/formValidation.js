(function () {
    var username = document.getElementById("username");
    var activeError = 0;
    username.addEventListener("input", function () {
        var namePattern = /^[a-zA-Z ]+$/;
        var $div = $("<div>", {id: "username-error", name: "username-error", "class": "error"});

        if (namePattern.test(username.value)) {
            activeError = 0;
            $("#username-error").remove();
        }
        else {
            if (activeError != 1) {
                activeError = 1;
                $("#username-div").append($div);
                $('<p>Username cannot contain special characters or symbols</p>').appendTo('#username-error');

            }
        }
    });
})();

(function () {
    var fullName = document.getElementById("full-name");
    var patternError = 0;
    var numError = 0;
    //var pattern = /^(?:[\p{L}\p{Mn}\p{Pd}\'\x{2019}]+(?:$|\s+)){2,}$/;
    var pattern = /^[\W_]+$/;
    fullName.addEventListener("input", function () {
        var $numdiv = $("<div>", {id: "name-numerror", name: "name-numerror", "class": "error"});
        var $spdiv = $("<div>", {id: "name-sperror", name: "name-sperror", "class": "error"});
        if (fullName.value.length > 3) {
            numError = 0;
            $("#name-numerror").remove();
        }
        else {
            if (numError != 1) {
                numError = 1;
                $("#name-div").append($numdiv);
                $('<p>Name must be at least 3 characters</p>').appendTo('#name-numerror');
            }
        }

        if (!pattern.test(fullName.value)) {
            patternError = 0;
            $("#name-sperror").remove();
        }
        else {
            if (patternError != 1) {
                patternError = 1;
                $("#name-div").append($spdiv);
                $('<p>Name cannot contain only special characters</p>').appendTo('#name-sperror');
            }
        }
    });
})();

(function () {
    var password = document.getElementById("password");
    var activeError = 0;
    password.addEventListener("input", function () {
        var pattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        var $div = $("<div>", {id: "password-error", name: "password-error", "class": "error"});

        if (pattern.test(password.value)) {
            activeError = 0;
            $("#password-error").remove();
        }
        else {
            if (activeError != 1) {
                activeError = 1;
                $("#password-div").append($div);
                $('<p>Password must be at least 8 characters and contain at least one letter and one number</p>').appendTo('#password-error');

            }
        }
    });
})();

(function () {
    var confPassword = document.getElementById("conf-password");
    var password = document.getElementById("password");
    var activeError = 0;
    confPassword.addEventListener("input", function () {
        var $div = $("<div>", {id: "conf-password-error", name: "conf-password-error", "class": "error"});

        if (confPassword.value == password.value) {
            activeError = 0;
            $("#conf-password-error").remove();
        }
        else {
            if (activeError != 1) {
                activeError = 1;
                $("#conf-password-div").append($div);
                $('<p>Password does not match the confirm password</p>').appendTo('#conf-password-error');

            }
        }
    });
})();
