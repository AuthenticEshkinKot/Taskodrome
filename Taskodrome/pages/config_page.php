<?php

# Copyright (c) 2015 Maxim Kuzmin
# Licensed under the Apache license

auth_reauthenticate();
access_ensure_global_level( config_get( 'manage_plugin_threshold' ) );

html_page_top( plugin_lang_get( 'config_title' ) );

print_manage_menu();
?>

<form action="<?php echo plugin_page( 'config' )?>" method="post">
<?php echo form_security_field( 'plugin_format_config_edit' ) ?>
<table class="width60" align="center">

<tr>
  <td class="form-title" colspan="2">
    <?php echo plugin_lang_get( 'title' ) . ': ' . plugin_lang_get( 'config' ) ?>
  </td>
</tr>

<tr <?php echo helper_alternate_class() ?>>
<?php $t_field = 'status_board_order'; ?>
<td class="category">
  <?php echo plugin_lang_get( $t_field . '_label' ) ?><br>
</td>
<td>
<input name="<?php echo $t_field; ?>" size="75" value="<?php
  $t_config = plugin_config_get( $t_field );
  $t_encoded = '';
  foreach( $t_config as $t_value ) {
    $t_encoded .= "$t_value;";
  }
  echo trim( $t_encoded, ';' );
?>"</input>
<br>
<span class="small"><?php
  printf( plugin_lang_get( 'default_value' ),
  string_attribute( implode( ';', plugin_config_get('status_board_order_default') ) )
  );
?></span>
</td>
</tr>

<tr <?php echo helper_alternate_class() ?>>
<?php $t_field = 'cooldown_period'; ?>
<td class="category">
  <?php echo plugin_lang_get( $t_field . '_label' ) ?><br>
</td>
<td>
Days:&nbsp
<input name="<?php echo $t_field . '_days'; ?>" size="5" value="<?php
echo plugin_config_get( $t_field . '_days' ); ?>"/>
<br>
Hours:
<input name="<?php echo $t_field . '_hours'; ?>" size="5" value="<?php
echo plugin_config_get( $t_field . '_hours' ); ?>"/>
<br>
<span class="small"><?php
  echo plugin_lang_get( $t_field . '_hint' );
?></span>
</td>
</tr>

<tr>
  <td class="center" colspan="3">
    <input type="submit" class="button" value="<?php echo lang_get( 'change_configuration' )?>" />
  </td>
</tr>


</table>
</form>

<?php
html_page_bottom();
