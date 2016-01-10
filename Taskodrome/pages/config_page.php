<?php

# Copyright (c) 2015 Maxim Kuzmin
# Licensed under the Apache license

auth_reauthenticate();
access_ensure_global_level( config_get( 'manage_plugin_threshold' ) );

html_page_top( plugin_lang_get( 'config_title' ) );

print_manage_menu();
?>

<br>
Under construction.
<br>

<?php
html_page_bottom();
