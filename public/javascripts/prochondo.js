

// Layout page controls

$('.form-login-app').submit(function() {
    $.post('/login', { username: $('#inputEmail').val(), password: $('#inputPassword').val() },
        function(data, textStatus, jqXHR){ $('body').load('/'); });
    $('#login-error').removeClass('invisible');
    return false;
});

$('.sidebar-a').on('click', function() {
    $('.sidebar-nested-listgi').removeClass('nlgi-active');

    if ($(this).parent().hasClass('lgi-active')) {
        $('.list-group-item').removeClass('lgi-active');
    }
    else {
        $('.list-group-item').removeClass('lgi-active');
        $(this).parent().addClass('lgi-active');
    }

    // Service only the one that was clicked
    if (!$(this).siblings('.sidebar-nested-container').hasClass('hidden')) {
        $('.sidebar-nested-container').addClass('hidden');
    }
    else {
        $('.sidebar-nested-container').addClass('hidden');
        $(this).siblings('.sidebar-nested-container').removeClass('hidden');
    }
});

$('.sidebar-nested-listgi').on('click', function(){
    $('.sidebar-nested-listgi').removeClass('nlgi-active');
    $(this).addClass('nlgi-active');
});

// Controls - Tabs

$('#tab-profile').on('click', function() {
    var tc = $('#tab-contacts');
    tc.parent().removeClass('active');
    tc.parent().siblings().removeClass('active');
    $(this).parent().addClass('active');
    $('.ctrl-form').parent().addClass('hidden');
    $('#ctrl-profile').removeClass('hidden');
});

$('#tab-contacts').on('click', function() {
    var tc = $('#tab-contacts');
    tc.parent().removeClass('active');
    tc.parent().siblings().removeClass('active');
    $(this).parent().addClass('active');
    $('.ctrl-form').parent().addClass('hidden');
    $('#ctrl-contacts').removeClass('hidden');
});

$('#tab-mgr').on('click', function() {
    var tc = $('#tab-contacts');
    tc.parent().removeClass('active');
    tc.parent().siblings().removeClass('active');
    $(this).parent().addClass('active');
    $('.ctrl-form').parent().addClass('hidden');
    $('#ctrl-mgr').removeClass('hidden');
});

$('#tab-admin').on('click', function() {
    var tc = $('#tab-contacts');
    tc.parent().removeClass('active');
    tc.parent().siblings().removeClass('active');
    $(this).parent().addClass('active');
    $('.ctrl-form').parent().addClass('hidden');
    $('#ctrl-admin').removeClass('hidden');
});

$('#tab-org').on('click', function() {
    var tc = $('#tab-contacts');
    tc.parent().removeClass('active');
    tc.parent().siblings().removeClass('active');
    $(this).parent().addClass('active');
    $('.ctrl-form').parent().addClass('hidden');
    $('#ctrl-org').removeClass('hidden');
});

$('#tab-god').on('click', function() {
    var tc = $('#tab-contacts');
    tc.parent().removeClass('active');
    tc.parent().siblings().removeClass('active');
    $(this).parent().addClass('active');
    $('.ctrl-form').parent().addClass('hidden');
    $('#ctrl-god').removeClass('hidden');
});
