<?php

# Copyright (c) 2015 Maxim Kuzmin
# Licensed under the Apache license

auth_reauthenticate();
access_ensure_global_level( config_get( 'manage_plugin_threshold' ) );
require_once( config_get( 'plugin_path' ) . 'Taskodrome/core/config_helper.php' );
layout_page_header( plugin_lang_get( 'config_title' ) );

layout_page_begin( 'manage_overview_page.php' );

print_manage_menu( 'manage_plugin_page.php' );
?>

<div class="col-md-12 col-xs-12">
  <div class="space-10"></div>

  <div class="form-container">

    <form id="taskodrome-config-form" action="<?php echo plugin_page( 'config' )?>" method="post">
    <?php echo form_security_field( 'plugin_format_config_edit' ) ?>

      <div class="widget-box widget-color-blue2">
        <div class="widget-header widget-header-small">
          <h4 class="widget-title lighter">
            <i class="ace-icon fa fa-text-width"></i>
            <?php echo plugin_lang_get( 'title' ) . ': ' . plugin_lang_get( 'config' )?>
          </h4>
        </div>

        <div class="widget-body">
          <div class="widget-main no-padding">
            <div class="table-responsive">
              <table class="table table-bordered table-condensed table-striped">
                <tr>
                  <?php $t_field = 'status_board_order'; ?>
                  <th class="category width-40">
                    <span>
                      <?php echo plugin_lang_get( $t_field . '_label' )?>
                    </span>
                    </br>
                    <span class="small">
                      <?php printf( plugin_lang_get( 'default_value' ),
                      string_attribute( implode( ';', convertStatusEnumToString(plugin_config_get( $t_field . '_default') )) ));
                    ?>
                    </span>
                  </th>
                  <td class="center" width="20%">
                    <span class="input">
                      <input name="<?php echo $t_field; ?>" size="75" type="text" value="<?php
                        $t_config = convertStatusEnumToString(plugin_config_get( $t_field, null, false, null, helper_get_current_project()) );
                        $t_encoded = '';
                        foreach( $t_config as $t_value ) {
                          $t_encoded .= "$t_value;";
                        }
                        echo trim( $t_encoded, ';' );
                      ?>"</input>
                    </span>
                  </td>
                </tr>

                <tr>
                  <?php $t_field = 'cooldown_period'; ?>
                  <th class="category width-40">
                    <?php echo plugin_lang_get( $t_field . '_label' ) ?>
                    <br /><span class="small"><?php echo plugin_lang_get( $t_field . '_hint' )?></span>
                  </th>
                  <td class="center">
                    <table class="table">
                      <tr>
                        <td>
                          <?php echo plugin_lang_get( $t_field . '_days' )?>:&nbsp
                          <input name="<?php echo $t_field . '_days'; ?>" size="5" value="<?php
                          echo plugin_config_get( $t_field . '_days', null, false, null, helper_get_current_project() ); ?>"/>
                        </td>
                        <td>
                          <?php echo plugin_lang_get( $t_field . '_hours' )?>:&nbsp
                          <input name="<?php echo $t_field . '_hours'; ?>" size="5" value="<?php
                          echo plugin_config_get( $t_field . '_hours', null, false, null, helper_get_current_project() ); ?>"/>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <?php $t_field = 'hidden_users'; ?>
                  <th class="category width-40">
                    <?php echo plugin_lang_get( $t_field . '_label' ) ?>
                    <br /><span class="small"><?php echo plugin_lang_get( $t_field . '_hint' )?></span>
                  </th>
                  <td class="center" width="20%">
                    <span class="input">
                      <input name="<?php echo $t_field; ?>" size="75" type="text" value="<?php
                        $t_config = plugin_config_get( $t_field, null, false, null, helper_get_current_project() );
                        $t_encoded = '';
                        foreach( $t_config as $t_value ) {
                          $t_encoded .= "$t_value;";
                        }
                        echo trim( $t_encoded, ';' );
                      ?>"</input>
                    </span>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <div class="widget-toolbox padding-8 clearfix">
            <input type="submit" class="btn btn-primary btn-white btn-round" value="<?php echo lang_get( 'change_configuration' )?>" />
          </div>

        </div>
      </div>
    </form>
  </div>
</div>

<?php
layout_page_end();
