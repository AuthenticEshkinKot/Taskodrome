<?php

form_security_validate( 'plugin_format_config_edit' );

auth_reauthenticate( );
access_ensure_global_level( config_get( 'manage_plugin_threshold' ) );

$f_test_value = gpc_get_string( 'test_value', 'NO VALUE' );

if( plugin_config_get( 'test_value' ) != $f_test_value ) {
  plugin_config_set( 'test_value', $f_test_value );
}

$f_status_order = gpc_get_string( 'status_board_order' );

if( plugin_config_get( 'status_board_order' ) != $f_status_order ) {
  plugin_config_set( 'status_board_order', explode(';', $f_status_order) );
}

form_security_purge( 'plugin_format_config_edit' );

print_successful_redirect( plugin_page( 'config_page', true ) );
