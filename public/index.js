function render() {

     var additionalParams = {
        'callback': signinCallback
    };
    var signinButton = document.getElementById('signinButton');
    
    signinButton.addEventListener('click', function() {
        gapi.auth.signIn(additionalParams); // Will use page level configuration
    });
}

function signinCallback(authResult) {
    if (authResult['status']['signed_in']) {
        document.getElementById('signinButton').setAttribute('style', 'display: none');
    } else {
        console.log('Sign-in state: ' + authResult['error']);
    }
}