/*global AppiraterData:true */

(function( Appirater, $, undefined ) {
  
  /* private */
  var APP_ID                  = '527034924';  //your app id 
  var VERSION                 = '1.3';        //your app version # 
  var DAYS_UNTIL_PROMPT       = 30;           //days 30
  var USES_UNTIL_PROMPT       = 15;           //count 15
  var SIG_EVENTS_UNTIL_PROMPT = -1;           //count
  var TIME_BEFORE_REMINDING   = 1;            //days
  var DEBUG                   = false;         //debugging - force showing of dialog for testing

  //var app_url = "http://itunes.apple.com/us/app/drive-by/id" + APP_ID + "?mt=8&uo=4";
  //var review_url = "https://userpub.itunes.apple.com/WebObjects/MZUserPublishing.woa/wa/addUserReview?id=" + APP_ID + "&type=Purple+Software"
  var review_url = "itms-apps://ax.itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?type=Purple+Software&id=" + APP_ID;

  /* private */
  connected_to_network = function() {
    return true;
  };

  seconds_since = function(then_date) {
    return Date.now() - then_date;
  };

  show_rating_alert = function() {
    $('#appirater_dialog').live('pageinit', function() {

      $('#rate').attr('href', review_url); //set href for rating in iTunes
      $('a[data-icon=delete]').hide(); //hide the close button

      $('a#remind').live('click', function() {
        AppiraterData.set('reminder_request_date', Date.now());
        $('#appirater_dialog').dialog('close');
      });

      $('a#nothanks').live('click', function() {
        AppiraterData.set('declined_to_rate', true);
        $('#appirater_dialog').dialog('close');
      });

    });

    $.mobile.changePage('appirater_dialog.html', {transition: 'pop', role: 'dialog'});   
  };

  rating_conditions_have_been_met = function() {
    if (DEBUG) { return true };
    var first_launch_date = AppiraterData.get('first_launch_date');
    var time_since_first_launch = seconds_since(first_launch_date );
    var time_until_rate = 60 * 60 * 24 * DAYS_UNTIL_PROMPT;

    if (time_since_first_launch < time_until_rate) {
      return false;
    }

    // check if the app has been used enough
    var use_count = AppiraterData.get('use_count') || 0;
    if (use_count <= USES_UNTIL_PROMPT) {
      return false;
    }

    // check if the user has done enough significant events
    var sig_event_count = AppiraterData.get('significant_event_count') || 0;
    if (sig_event_count <= SIG_EVENTS_UNTIL_PROMPT) {
      return false;
    }

    // has the user previously declined to rate this version of the app?
    if (AppiraterData.get('declined_to_rate') === true) {
      return false;
    }

    // has the user already rated the app?
    if (AppiraterData.get('rated_current_version') === true) {
      return false;
    }

    // if the user wanted to be reminded later, has enough time passed?
    var reminder_request_date = AppiraterData.get('reminder_request_date');
    var time_since_reminder_request_date = seconds_since(reminder_request_date);
    var time_until_reminder = 60 * 60 * 24 * TIME_BEFORE_REMINDING;
    if (time_since_reminder_request_date < time_until_reminder) {
      return false; 
    }

    return true;
  };

  increment_use_count = function() {
    var tracking_version = AppiraterData.get('current_version') || VERSION;
    AppiraterData.set('current_version', tracking_version);

    if (tracking_version === VERSION) {
      var first_use_date = AppiraterData.get('first_use_date') || Date.now();
      AppiraterData.set('first_use_date', first_use_date);
      AppiraterData.increment('use_count');

    } else {

      // it's a new version of the app, so restart tracking
      AppiraterData.set('first_use_date',           Date.now()  );
      AppiraterData.set('use_count',                1           );
      AppiraterData.set('significant_event_count',  0           );
      AppiraterData.set('rated_current_version',    false       );
      AppiraterData.set('declined_to_rate',         false       );
      AppiraterData.set('reminder_request_date',    0           );
    
    }

  };

  increment_significant_event_count = function() {
  };

  increment_and_rate = function() {
    increment_use_count();
    if (rating_conditions_have_been_met() && connected_to_network()) {
      show_rating_alert();
    }
  };
  
  increment_significant_event_and_rate = function() {
    increment_significant_event_count();
    if (rating_conditions_have_been_met() && connected_to_network()) {
      show_rating_alert();
    }
  };
  
  /* call this on deviceready */
  Appirater.app_launched = function() {
    increment_and_rate();
  };

  /* call this on resume? */
  Appirater.app_entered_foreground = function() {
  };

  hide_rating_alert = function() {
  };

  user_did_significant_event = function() {
  };

  rate_app = function() {
  };

  alert_view = function() {
  };

}( window.Appirater = window.Appirater || {}, jQuery ));
