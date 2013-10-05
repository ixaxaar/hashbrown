
//(function() {

// As far as the controls are concerned, most of the markup is static,
// so the backbone 'views' here are mostly for jquery manipulations and ajax

    Sentry.views.Controls = {};

    Sentry.views.Controls.Profile = Backbone.View.extend({

        handleKeydown: function(event) {
            var $this = $(this);
            $this.prev().html($this.val());
        },

        validate: function() {
            //
        },

        handleSubmit: function(event) {
            var $this = $(this);
            $this.html('Updating...');
            var req = new Sentry.models.modifyProfile({});
            req.set('title', $('#inputTitle').val());
            req.set('fname', $('#inputFirstName').val());
            req.set('lname', $('#inputLastName').val());
            req.set('mname', $('#inputMiddleName').val());
            req.set('nname', $('#inputNickName').val());
            req.set('dob', $('#inputDOB').val());
            req.set('dobpriv', $('#inputDOBPriv').val());
            req.set('designation', $('#inputDesignation').val());
            req.send(function(res, context) {
                if (context.error(res)) $this.html('Error!').removeClass('btn-primary').addClass('btn-danger');
                else $this.html('Updated').removeClass('btn-error').removeClass('btn-primary').addClass('btn-success');
            });
            event.preventDefault();
        },

        handleFilePreUpload: function(event) {
            var $this = $(this);
//            $this.parent().parent().find('img').prop('src', $this.val());
            switch ($this.prop('files')[0].type) {
                case 'image/jpeg':
                case 'image/jpg':
                case 'image/png':
                    if (window.File && window.FileReader && window.FileList && window.Blob) {
                        var reader = new FileReader();
                        // Closure to capture the file information.
                        reader.onload = (function(theFile) {
                            console.log(theFile)
                            $this.parent().parent().find('img').prop('src', theFile.target.result);
                        });
                        reader.readAsDataURL($this.prop('files')[0]);
                    }
                    break;
                default:
//                    $this.parent().prepend();
                    $('#inputProfilePic').prev().html('File type not supported');
                    $this.val(null);
                    break;
            }
        },

        initialize: function() {
            this.$ref = $('#ctrl-profile');
            this.$ref.on('keyup', 'input', this.handleKeydown);
            this.$ref.find('#profileSubmit').on('click', this.handleSubmit);
            this.$ref.find('input:file').on('change', this.handleFilePreUpload);
        },

        render: function(result) {
            //
        }
    });

new Sentry.views.Controls.Profile();

//})();

