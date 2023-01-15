<?php

form_security_validate( 'plugin_format_config_edit' );

auth_reauthenticate( );
access_ensure_global_level( config_get( 'manage_plugin_threshold' ) );
require_once( config_get( 'plugin_path' ) . 'Taskodrome/core/config_helper.php' );

$f_status_order = gpc_get_string( 'status_board_order' );

if( plugin_config_get( 'status_board_order', null, false, null, helper_get_current_project() ) != $f_status_order ) {
 plugin_config_set( 'status_board_order', convertStringToStatusEnum(explode(';', $f_status_order)), NO_USER, helper_get_current_project() );
}

$f_cooldown_period_days = gpc_get_int( 'cooldown_period_days' );

if( plugin_config_get( 'cooldown_period_days', null, false, null, helper_get_current_project() ) != $f_cooldown_period_days ) {
  plugin_config_set( 'cooldown_period_days', $f_cooldown_period_days, NO_USER, helper_get_current_project() );
}

$f_cooldown_period_hours = gpc_get_int( 'cooldown_period_hours' );

if( plugin_config_get( 'cooldown_period_hours', null, false, null, helper_get_current_project() ) != $f_cooldown_period_hours ) {
  plugin_config_set( 'cooldown_period_hours', $f_cooldown_period_hours, NO_USER, helper_get_current_project() );
}

$f_hidden_users = gpc_get_string( 'hidden_users' );

if( plugin_config_get( 'hidden_users', null, false, null, helper_get_current_project() ) != $f_hidden_users ) {
  plugin_config_set( 'hidden_users', explode(';', $f_hidden_users), NO_USER, helper_get_current_project()  );
}

$f_darkmode = gpc_get_bool( 'darkmode' );

if( plugin_config_get( 'darkmode', null, false, null, helper_get_current_project() ) != $f_darkmode ) {
  plugin_config_set( 'darkmode', $f_darkmode, NO_USER, helper_get_current_project()  );
}

$f_flair_color = gpc_get_string( 'flair_color' );

if( plugin_config_get( 'flair_color', null, false, null, helper_get_current_project() ) != $f_flair_color ) {
  plugin_config_set( 'flair_color', $f_flair_color, NO_USER, helper_get_current_project()  );
}

form_security_purge( 'plugin_format_config_edit' );

print_successful_redirect( plugin_page( 'config_page', true ) );
