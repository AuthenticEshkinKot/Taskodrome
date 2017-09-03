<?php

form_security_validate( 'plugin_format_config_edit' );

auth_reauthenticate( );
access_ensure_global_level( config_get( 'manage_plugin_threshold' ) );

$f_status_order = gpc_get_string( 'status_board_order' );

if( plugin_config_get( 'status_board_order' ) != $f_status_order ) {
  plugin_config_set( 'status_board_order', explode(';', $f_status_order) );
}

$f_cooldown_period_days = gpc_get_int( 'cooldown_period_days' );

if( plugin_config_get( 'cooldown_period_days' ) != $f_cooldown_period_days ) {
  plugin_config_set( 'cooldown_period_days', $f_cooldown_period_days );
}

$f_cooldown_period_hours = gpc_get_int( 'cooldown_period_hours' );

if( plugin_config_get( 'cooldown_period_hours' ) != $f_cooldown_period_hours ) {
  plugin_config_set( 'cooldown_period_hours', $f_cooldown_period_hours );
}

$f_hidden_users = gpc_get_string( 'hidden_users' );

if( plugin_config_get( 'hidden_users' ) != $f_hidden_users ) {
  plugin_config_set( 'hidden_users', explode(';', $f_hidden_users) );
}

form_security_purge( 'plugin_format_config_edit' );

print_successful_redirect( plugin_page( 'config_page', true ) );
