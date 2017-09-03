<?php
  html_page_top( plugin_lang_get( 'board' ) );

  print "<link rel=\"stylesheet\" type=\"text/css\" href=\"".plugin_file('taskodrome.css')."\" />\n";
  print "<script type=\"text/javascript\" src=\"" . plugin_file('scripts/easeljs-0.8.2.min.js') . "\"></script>\n";
  print "<script type=\"text/javascript\" src=\"" . plugin_file('scripts/grid_common_utils.js') . "\"></script>\n";
  print "<script type=\"text/javascript\" src=\"" . plugin_file('scripts/grid_draw_utils.js') . "\"></script>\n";
  print "<script type=\"text/javascript\" src=\"" . plugin_file('scripts/issue_updater.js') . "\"></script>\n";
  print "<script type=\"text/javascript\" src=\"" . plugin_file('scripts/scroller.js') . "\"></script>\n";
  print "<script type=\"text/javascript\" src=\"" . plugin_file('scripts/devs_grid.js') . "\"></script>\n";
  print "<script type=\"text/javascript\" src=\"" . plugin_file('scripts/status_grid.js') . "\"></script>\n";
  print "<script type=\"text/javascript\" src=\"" . plugin_file('scripts/on_load_opening.js') . "\"></script>\n";

  $f_page_number = gpc_get_int( 'page_number', 1 );

  $t_per_page = null;
  $t_bug_count = null;
  $t_page_count = null;

  $rows = filter_get_bug_rows( $f_page_number, $t_per_page, $t_page_count, $t_bug_count, null, null, null, true );

  function write_bug_rows( $p_rows )
  {
    $user_array = get_user_array();
    $alive_user_ids = array();
    $issues_array_html = '';
    $allowed_statuses_html = '';

    print '<div id="taskodrome_data" hidden="true">
    ';

    $users = '';
    $user_number = count($user_array);
    for( $i=0; $i != $user_number; $i++ ) {
      $users .= '<p class="user_data" ';
      $users .= 'name="'.$user_array[$i]->name.'" ';
      $users .= 'id="'.$user_array[$i]->id.'"';
      $users .= '></p>';

      $alive_user_ids[$user_array[$i]->id] = 1;
    }

    print $users;

    $t_all_statuses = array();
    $t_status_colors = array();
    $t_rows = count( $p_rows );
    for( $i=0; $i < $t_rows; $i++ ) {
      $t_row = $p_rows[$i];

      $handler_id = $t_row->handler_id;
      if (!array_key_exists($t_row->handler_id, $alive_user_ids))
      {
        continue;
      }

      $issues_array_html .= '<p class="issue_data" ';
      $issues_array_html .= 'id="'.$t_row->id.'" ';
      $summary = strip_tags($t_row->summary);
      $summary = str_replace('"', '&#34;', $summary);
      $issues_array_html .= 'summary="'.$summary.'" ';
      $issues_array_html .= 'status="'.$t_row->status.'" ';
      $issues_array_html .= 'handler_id="'.$handler_id.'" ';
      $issues_array_html .= 'updateTime="'.$t_row->last_updated.'" ';
      $description = strip_tags($t_row->description);
      $description = str_replace('"', '&#34;', $description);
      $issues_array_html .= 'description="'.$description.'" ';
      $issues_array_html .= 'severity="'.get_enum_element('severity', $t_row->severity).'" ';
      $issues_array_html .= 'priority="'.get_enum_element('priority', $t_row->priority).'" ';
      $issues_array_html .= 'priorityCode="'.$t_row->priority.'" ';
      $issues_array_html .= 'reproducibility="'.get_enum_element('reproducibility', $t_row->reproducibility).'" ';
      $issues_array_html .= 'version="'.$t_row->target_version.'" ';
      $issues_array_html .= '></p>';

      $t_row_statuses = get_status_option_list(access_get_project_level( $t_row->project_id ), $t_row->status, true, false, $t_row->project_id);

      $allowed_statuses_html .= '<p class="status_pair" ';
      $allowed_statuses_html .= 'id="' . $t_row->id . '" ';

      $src_status_str = '';
      $dst_status_str = '';

      foreach( $t_row_statuses as $src_status_code => $src_status_name ) {
        $t_all_statuses[$src_status_code] = $src_status_name;
        $t_status_colors[$src_status_code] = get_status_color($src_status_code);
        $src_status_str .= $src_status_code . ';';

        $t_enum_list = get_status_option_list(
          access_get_project_level( $t_row->project_id ),
          $src_status_code,
          true,
          (  bug_is_user_reporter( $t_row->id, auth_get_current_user_id() )
          && access_has_bug_level( config_get( 'report_bug_threshold' ), $t_row->id )
          && ON == config_get( 'allow_reporter_close' )
          ),
          $t_row->project_id );

        foreach( $t_enum_list as $dst_status => $dst_st ) {
          $dst_status_str .= $dst_status . ',';
        }

        $dst_status_str .= ';';
      }

      $allowed_statuses_html .= 'src_status="' . $src_status_str . '" ';
      $allowed_statuses_html .= 'dst_status="' . $dst_status_str . '"';
      $allowed_statuses_html .= '></p>';
    }

    print $issues_array_html;
    print $allowed_statuses_html;

    $status_name_map = null;
    foreach( $t_all_statuses as $src_status_code => $src_status_name ) {
      $status_name_map .= $src_status_code.':'.$src_status_name.';';
    }
    print '<p class="status_name_map" value="'.$status_name_map.'"></p>';

    $status_color_map = null;
    foreach( $t_status_colors as $src_status_code => $src_status_color ) {
      $status_color_map .= $src_status_code.':'.$src_status_color.';';
    }
    print '<p class="status_color_map" value="'.$status_color_map.'"></p>';

    $status_order = null;
    foreach( plugin_config_get("status_board_order") as $t_value ) {
      $status_order .= $t_value.';';
    }

    $t_versions = version_get_all_rows( helper_get_current_project() );
    $t_versions_cnt = count( $t_versions );
    for( $k=0; $k < $t_versions_cnt; $k++ ) {
      $ver_id = $t_versions[$k]['id'];
      print '<p class="version" value="'.version_get_field($ver_id, "version").'"></p>';
    }

    print '<p class="status_board_order" value="'.$status_order.'"></p>';
    print '<p id="cooldown_period_days" value="'. plugin_config_get("cooldown_period_days") .'"></p>';
    print '<p id="cooldown_period_hours" value="'. plugin_config_get("cooldown_period_hours") .'"></p>';
    print '<p id="lang_description" value="'. lang_get("description") .'"></p>';
    print '<p id="lang_severity" value="'. lang_get("severity") .'"></p>';
    print '<p id="lang_priority" value="'. lang_get("priority") .'"></p>';
    print '<p id="lang_reproducibility" value="'. lang_get("reproducibility") .'"></p>';
    print '</div>';

    print '<section class="tabs">

    <input type="radio" id="radio_dg" name="group" >
    <input type="radio" id="radio_sg" name="group" >

    <label id="label_dg" class="radio_label" for="radio_dg" >' . plugin_lang_get("assignment_board") . '</label>
    <label id="label_sg" class="radio_label" for="radio_sg" >' . plugin_lang_get("status_board") . '</label>

    <div id="parent_div" class="tabs_cont">
    <div id="tab_c1" class="grid">
    ';

    print '<canvas id="panel">
    </canvas>
    </div>
    ';

    print '<div id="tab_c2" class="grid">
    <canvas id="panel_st">
    </canvas>
    </div>
    ';

    print '</div>
    </section>
    ';
    
    html_page_bottom();
  }

  function get_user_array()
  {
    class User {
      public $id;
      public $name;
    }

    $user_array = array();
    $p_project_id = null;

    if( null === $p_project_id ) {
      $p_project_id = helper_get_current_project();
    }

    if( $p_project_id === ALL_PROJECTS ) {
      $t_current_user = auth_get_current_user_id();
      $t_projects = user_get_accessible_projects( $t_current_user );

      # Get list of users having access level for all accessible projects
      $t_users = array();
      foreach( $t_projects as $t_project_id ) {
        $t_project_users_list = project_get_all_user_rows( $t_project_id, DEVELOPER );
        # Do a 'smart' merge of the project's user list, into an
        # associative array (to remove duplicates)
        # Use a foreach loop for correctness
        foreach( $t_project_users_list as $t_key => $t_user ) {
          $t_users[ $t_user['id'] ] = $t_user;
        }
        unset( $t_project_users_list );
      }
      unset( $t_projects );
    } else {
      $t_users = project_get_all_user_rows( $p_project_id, DEVELOPER );
    }

    $t_show_realname = ( ON == config_get( 'show_realname' ) );
    $t_sort_by_last_name = ( ON == config_get( 'sort_by_last_name' ) );
    foreach( $t_users as $t_key => $t_user ) {
      $t_user_name = string_attribute( $t_user['username'] );
      $t_sort_name = utf8_strtolower( $t_user_name );
      if( $t_show_realname && ( $t_user['realname'] <> '' ) ) {
        $t_user_name = string_attribute( $t_user['realname'] );
        if( $t_sort_by_last_name ) {
          $t_sort_name_bits = explode( ' ', utf8_strtolower( $t_user_name ), 2 );
          $t_sort_name = ( isset( $t_sort_name_bits[1] ) ? $t_sort_name_bits[1] . ', ' : '' ) . $t_sort_name_bits[0];
        } else {
          $t_sort_name = utf8_strtolower( $t_user_name );
        }
      }

      if (!is_user_hidden($t_user_name))
      {
        $user = new User();
        $user->id = $t_user['id'];
        $user->name = $t_user_name;

        array_push($user_array, $user);
      }
    }

    $user = new User();
    $user->id = 0;
    $user->name = " ";
    array_push($user_array, $user);

    return $user_array;
  }

  function is_user_hidden( $username )
  {
    return in_array($username, plugin_config_get("hidden_users"));
  }

  write_bug_rows( $rows );


?>
