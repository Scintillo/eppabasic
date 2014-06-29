function UserControlsController(userControls) {
    this.userControls = $(userControls);
    this.loginBox = $('.login-box', this.userControls);
    this.currentUser = $('.current-user', this.userControls);
    this.loginLink = $('.login-link', this.userControls);
    this.logoutLink = $('.logout-link', this.userControls);
    this.registerLink = $('.register-link', this.userControls);
    this.alreadyRegisteredLink = $('.already-registered-link', this.userControls);
    this.loginForm = $('.login-form', this.userControls);
    this.registerForm = $('.register-form', this.userControls);
    this.errorBoxes = $('.error-box', this.userControls);
    this.frozen = false;
    this.loginBoxVisible = false;
    this.onLogin = function() {}
    this.onLogout = function() {}

    this.status = 'logged-out';
    this.reset();
    this.queryServer();

    var me = this;

    this.loginLink.on('click', function(e) {
        e.preventDefault();

        if(!me.frozen) {
            if(me.loginBoxVisible) {
                me.hideLoginBox();
            } else {
                me.showLoginBox();
            }
        }
    });

    this.logoutLink.on('click', function(e) {
        e.preventDefault();
        
        if(!me.frozen) {
            me.setStatusPending();
            $.post(
                'eb/user/logout/',
                '',
                function(data) {
                    me.setStatusLoggedOut();
                }
            );
        }
    });

    this.registerLink.on('click', function(e) {
        e.preventDefault();

        if(!me.frozen) {
            me.loginForm.hide();
            me.registerForm.show();
        }
    });

    this.alreadyRegisteredLink.on('click', function(e) {
        e.preventDefault();

        if(!me.frozen) {
            me.loginForm.show();
            me.registerForm.hide();
        }
    });

    this.loginForm.on('submit', function(e) {
        e.preventDefault();

        me.freeze();
        submitForm(me.loginForm, 'eb/user/login/', function(data) {
            if(data['result'] === 'success') {
                me.setStatusLoggedIn(data['username']);
            } else {
                fillFormErrors(me.loginForm, data['errors']);
                me.unfreeze();
            }
        });
    });

    this.registerForm.on('submit', function(e) {
        e.preventDefault();

        me.freeze();
        submitForm(me.registerForm, 'eb/user/register/', function(data) {
            if(data['result'] === 'success') {
                me.setStatusLoggedIn(data['username']);
            } else {
                fillFormErrors(me.registerForm, data['errors']);
                me.unfreeze();
            }
        });
    });
}

UserControlsController.prototype = {
    queryServer: function() {
        var me = this;

        $.ajax(
            'eb/user/get/',
            {
               success: function(data) {
                    if(data['authenticated']) {
                        me.setStatusLoggedIn(data['username']);
                    }
                    else {
                        me.setStatusLoggedOut();
                    }
                }
            }
        );
    },

    showLoginBox: function() {
        this.reset();
        this.loginBox.slideDown();
        this.loginBoxVisible = true;
    },

    hideLoginBox: function() {
        this.loginBox.slideUp();
        this.loginBoxVisible = false;
    },

    setStatusLoggedIn: function(username) {
        this.onLogin();
        this.status = 'logged-in';

        this.hideLoginBox();

        this.userControls.addClass('logged-in');
        this.userControls.removeClass('logged-out');
        this.userControls.removeClass('pending');
        
        this.currentUser.text(username);
    },

    setStatusLoggedOut: function() {
        if(this.status === 'logged-in') {
            this.onLogout();
        }
        this.status = 'logged-out';

        this.userControls.removeClass('logged-in');
        this.userControls.addClass('logged-out');
        this.userControls.removeClass('pending');

        this.currentUser.text('');
    },

    setStatusPending: function() {
        if(this.status === 'logged-in') {
            this.onLogout();
        }
        this.status = 'pending';

        this.userControls.removeClass('logged-in');
        this.userControls.removeClass('logged-out');
        this.userControls.addClass('pending');

        this.currentUser.text('');
    },

    reset: function() {
        $('form', this.loginBox).each(function() {
            this.reset();
        });

        this.loginBox.hide();
        this.loginForm.show();
        this.registerForm.hide();
        this.errorBoxes.hide();
        $('.field-error', this.userControls).remove();
        this.unfreeze();
    },

    freeze: function() {
        this.frozen = true;
        $(':input', this.userControls).attr('disabled', true);
    },

    unfreeze: function(form) {
        this.frozen = false;
        $(':input', this.userControls).attr('disabled', false);
    }
}