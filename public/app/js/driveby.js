/*jslint browser:true, devel:true, jquery:true*/
/*global DriveBy:true, Handlebars:true, device:true */

(function( DriveBy, $, undefined) {

  DriveBy.host = "http://drivebyapp.com";
  //DriveBy.host = "http://localhost:3000";

  /* Wrapper to support browsers & phonegap */
  DriveBy.alert = function(title, str) {
    if (navigator.notification) {
      navigator.notification.alert(str, null, title);
    } else {
      alert(str);
    }
  };

  DriveBy.states = [
   'AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 
   'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 
   'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 
   'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
   'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'];

  Handlebars.registerHelper('toLowerCase', function(value) {
    if (value == null) { return 'nj'; }
    return new Handlebars.SafeString(value.toLowerCase());
  });

  DriveBy.update_my_posts = function(func) {
    var recent_list = $( '#my_recent_list' );
    recent_list.empty();

    $.get( DriveBy.host + "/posts/my/" + DriveBy.uuid, function( posts ) {

      if (posts.length !== 0) {
        $.each( posts , function(index, post) {
          recent_list.append(DriveBy.post_template( {'post': post} ));
        });

        recent_list.listview('refresh'); /* apply the jqm style */
        $(".timeago").timeago();
        $(".comment").ellipsis();
      } else {
        var post = { state: 'CT', 
                     license_plate: 'TOO BAD', 
                     created_at: 'Never posted :(',   
                     comment: 'You have not posted any license plates yet! What are you waiting for?' };
        recent_list.append(DriveBy.post_template( {'post': post} ));
        recent_list.listview('refresh'); /* apply the jqm style */
      }

      if (func) { func(); }
    });
  };

  DriveBy.update_recent_posts = function(func) {
    var recent_list = $( '#recent-list' );
    recent_list.empty();

    $.get( DriveBy.host + "/posts", function( posts ) {
      var post_source   = $("#recent_posts_template").html();
      var post_template = Handlebars.compile(post_source);

      $.each( posts , function(index, post) {
        recent_list.append(post_template( {'post': post} ));
      });

      recent_list.listview('refresh'); /* apply the jqm style */
      $(".timeago").timeago();
      $(".comment").ellipsis();

      if (func) { func(); }
    });
  };

  DriveBy.show_retry_error_alert = function() {
    if (navigator.onLine) {
      //FIXME: Display to user what actually went wrong (when it makes sense)
      DriveBy.alert("Error occurred", "Please try again.");
    } else {
      DriveBy.alert("No network", "Error: No internet connection.");
    }
  };

  DriveBy.add_post_page = function() {

console.log("add post page");
    /* add license plates to slider */
    $.each( DriveBy.states , function(index, state) {
      $( '.slider' ).append('<div class="item" id ="' + state + '"><a href="#"><img class="lazy" width="120" height="60" data-original="app/images/plates/' + state.toLowerCase() + '.jpg" /></a></div>');
    });

console.log("slider stuff done");
    $('.iosSlider').iosSlider({ desktopClickDrag: true,
                                startAtSlide: 30 });

console.log("lazy load start");

    $("img.lazy").lazyload({ container: $('.iosSlider'),
                             threshold: 600 });

console.log("lazy load done");
    /* listen to clicking to states */
    //(function() {
      var states = $( '.item' );
      states.bind( "tap", function(){
        /* reset all states to default */
        states.css('background-color', '#F9F9F9');
        states.attr('data-selected', 'false');

        /* select the one that was clicked */
        $( this ).css('background-color', 'cyan');
        $( this ).attr('data-selected', 'true');
      });
    //})();

    /* listen to new post being submitted */
    $( '#new_post_submit' ).bind( 'tap', function( e ) {
      e.preventDefault();
      e.stopPropagation();

      var state   = $( '.item[data-selected=true]' ).attr('id');
      var plate   = $( '#license_plate' ).val();
      var comment = $( '#comment' ).val();
      var creator = DriveBy.uuid || "no_uuid";

      if (!plate || !comment || !state) {
        return;
      }

      DriveBy.save_post( { state:          state, 
                           license_plate:  plate, 
                           comment:        comment, 
                           creator:        creator });

    });                    

  };

  DriveBy.recent_posts_page = function() {
    DriveBy.update_recent_posts();
  };

  DriveBy.initialize_phonegap = function() {
    console.log("intialize_phonegap");
    DriveBy.uuid    = device.uuid;
    DriveBy.device  = device.name;
    DriveBy.version = device.version;
    DriveBy.initialize();
    Appirater.app_launched();
  };

  DriveBy.initialize = function() {

    $('#recent').live('pageshow', function() {
      console.log('pageshow for recent');
      DriveBy.recent_posts_page();
    });

    $('#add_post').live('pageshow', function() {
      console.log('pageshow for add_post');
      DriveBy.add_post_page();
    });


    $('#my').live('pageshow', function (event, ui) {
      DriveBy.update_my_posts();
    });


    /* log any ajax errors */
    $(document).ajaxError(function(e, jqxhr, settings, exception) {
      $.mobile.hidePageLoadingMsg();
      DriveBy.show_retry_error_alert();
      console.log( "AJAX error: " + e.message + "  ::  " + exception);
    });

    /* listen to refresh click */
    $( '#refresh' ).bind( 'tap', function() {
      $.mobile.loadingMessageTextVisible = true;
      $.mobile.loadingMessage = "Refreshing, please wait...";
      $.mobile.showPageLoadingMsg();

      DriveBy.update_recent_posts(function() {
        $.mobile.hidePageLoadingMsg();
      });
    });

  }; /* end initialize */

  DriveBy.save_post = function(params) {

      $.mobile.loadingMessageTextVisible = true;
      $.mobile.loadingMessage = "Saving, please wait...";
      $.mobile.showPageLoadingMsg();

      $.post( DriveBy.host + "/posts", params, function( data, textStatus, jqXHR ){
        $.mobile.hidePageLoadingMsg();
        if (data['success'] === true) {
          DriveBy.successfulPost();
        } else {
          DriveBy.show_retry_error_alert();
        }
      });
  };

  DriveBy.successfulPost = function() {
    $( '#comment'       ).val('');
    $( '#license_plate' ).val('');
    DriveBy.update_recent_posts(function() {
      DriveBy.alert("Successful save", "Thank you.");
    });
  };
}( window.DriveBy = window.DriveBy || {}, jQuery ));
