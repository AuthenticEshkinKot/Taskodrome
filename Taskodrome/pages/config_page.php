<?php

# Copyright (c) 2015 Maxim Kuzmin
# Licensed under the Apache license

auth_reauthenticate();
access_ensure_global_level( config_get( 'manage_plugin_threshold' ) );

html_page_top( plugin_lang_get( 'config_title' ) );

print_manage_menu();
?>

<div id="taskodrome-config-div" class="form-container">
  <form id="taskodrome-config-form" action="<?php echo plugin_page( 'config' )?>" method="post">
    <fieldset>
      <legend>
        <span>
          <?php echo plugin_lang_get( 'title' ) . ': ' . plugin_lang_get( 'config' ) ?>
        </span>
      </legend>
      <?php echo form_security_field( 'plugin_format_config_edit' ) ?>
      <?php $t_field = 'status_board_order'; ?>
      <div class="field-container">
        <label>
          <span>
            <?php echo plugin_lang_get( $t_field . '_label' ) ?>
            <br>
          </span>
          <span>
            <br />
            <span class="small">
              <?php printf( plugin_lang_get( 'default_value' ),
                string_attribute( implode( ';', plugin_config_get('status_board_order_default') ) ));
              ?>
            </span>
          </span>
        </label>
        <span class="input">
          <input name="<?php echo $t_field; ?>" size="75" type="text" value="<?php
            $t_config = plugin_config_get( $t_field );
            $t_encoded = '';
            foreach( $t_config as $t_value ) {
              $t_encoded .= "$t_value;";
            }
            echo trim( $t_encoded, ';' );
          ?>"</input>
        </span>
        <span class="label-style"></span>
      </div>

      <div class="field-container">
        <?php $t_field = 'cooldown_period'; ?>
        <label>
          <span><?php echo plugin_lang_get( $t_field . '_label' ) ?><br></span>
          <span class="small"><?php
            echo plugin_lang_get( $t_field . '_hint' );
            ?>
          </span>
        </label>
        <span class="input">
          Days:&nbsp
          <input name="<?php echo $t_field . '_days'; ?>" size="5" value="<?php
            echo plugin_config_get( $t_field . '_days' ); ?>"/>
          <br>
          Hours:
          <input name="<?php echo $t_field . '_hours'; ?>" size="5" value="<?php
            echo plugin_config_get( $t_field . '_hours' ); ?>"/>
          <br>
        </span>
        <span class="label-style"></span>
      </div>

      <span class="submit-button">
        <input type="submit" class="button" value="<?php echo lang_get( 'change_configuration' )?>" />
      </span>
    </fieldset>
  </form>
</div>

<?php
html_page_bottom();
