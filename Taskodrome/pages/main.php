<link rel="stylesheet" type="text/css" href="<?php echo plugin_file( 'taskodrome.css' ) ?>"/>
<script type="text/javascript" src="./plugins/Taskodrome/scripts/easeljs-0.8.2.min.js"></script>
<script type="text/javascript" src="./plugins/Taskodrome/scripts/grid_common_utils.js"></script>
<script type="text/javascript" src="./plugins/Taskodrome/scripts/grid_draw_utils.js"></script>
<script type="text/javascript" src="./plugins/Taskodrome/scripts/devs_grid.js"></script>
<script type="text/javascript" src="./plugins/Taskodrome/scripts/status_grid.js"></script>
<script type="text/javascript" src="./plugins/Taskodrome/scripts/on_load_opening.js"></script>

<?php
  html_page_top( plugin_lang_get( 'board' ) );

  /**
  * requires current_user_api
  */
  require_once( 'current_user_api.php' );
  /**
   * requires bug_api
  */
  require_once( 'bug_api.php' );
	/**
	 * requires string_api
	 */
	require_once( 'string_api.php' );
	/**
	 * requires date_api
	 */
	require_once( 'date_api.php' );
	/**
	 * requires icon_api
	 */
	require_once( 'icon_api.php' );
	/**
	 * requires columns_api
	 */
	require_once( 'columns_api.php' );
	
	$f_page_number		= gpc_get_int( 'page_number', 1 );
	
	$t_per_page = null;
	$t_bug_count = null;
	$t_page_count = null;
	
	$rows = filter_get_bug_rows( $f_page_number, $t_per_page, $t_page_count, $t_bug_count, null, null, null, true );

  function write_bug_rows( $p_rows )
  {
    $user_array = get_user_array();
    $issues_array_html = '';

    $t_rows = count( $p_rows );
    for( $i=0; $i < $t_rows; $i++ ) {
      $t_row = $p_rows[$i];

      $issues_array_html = $issues_array_html . '<p hidden="true" class="issue_data" ';
      $issues_array_html = $issues_array_html . 'id="'.$t_row->id.'" ';
      $issues_array_html = $issues_array_html . 'summary="'.$t_row->summary.'" ';
      $issues_array_html = $issues_array_html . 'status="'.$t_row->status.'" ';
      $issues_array_html = $issues_array_html . 'handler_id="'.$t_row->handler_id.'" ';
      $issues_array_html = $issues_array_html . 'topColor="#0000FF" ';
      $issues_array_html = $issues_array_html . 'bottomColor="#FF0000" ';
      $issues_array_html = $issues_array_html . 'updateTime="'.$t_row->last_updated.'" ';
      $issues_array_html = $issues_array_html . '/>';
    }

    print $issues_array_html;

    $users = '';
    $user_number = count($user_array);
    for( $i=0; $i != $user_number; $i++ ) {
      $users = $users . '<p hidden="true" class="user_data" ';
      $users = $users . 'name="'.$user_array[$i]->name.'"';
      $users = $users . 'id="'.$user_array[$i]->id.'"';
      $users = $users . '/>';
    }

    print $users;

    $status_order = null;
    foreach( plugin_config_get("status_board_order") as $t_value ) {
      $status_order .= $t_value.';';
    }
    print '<p hidden="true" class="status_board_order" value="'.$status_order.'"/>';

    print '<section class="tabs">
    <input id="tab_1" type="radio" name="tab" />
    <input id="tab_2" type="radio" name="tab" />

    <label for="tab_1" id="tab_l1">' . plugin_lang_get("assignment_board") . '</label>
    <label for="tab_2" id="tab_l2">' . plugin_lang_get("status_board") . '</label>
    <div style="clear:both"></div>

    <div class="tabs_cont">
    <div id="tab_c1">
    ';

    print '<div id="dev-grid" class="grid">
    <canvas id="panel">
    </canvas>
    </div>
    ';

    html_page_bottom();

    print '</div>';

    print '<div id="tab_c2">
    <div id="st-grid" class="grid">
    <canvas id="panel_st">
    </canvas>
    </div>
    ';

    html_page_bottom();

    print '</div>';

    print '</div>
    </section>
    ';
  }

	function get_user_array()
	{
		class User {
			public $id;
			public $name;
		}
		
		$user_array = array();
		$p_project_id = null;
		$t_current_user = auth_get_current_user_id();

		if( null === $p_project_id ) {
			$p_project_id = helper_get_current_project();
		}

		if( $p_project_id === ALL_PROJECTS ) {
			$t_projects = user_get_accessible_projects( $t_current_user );

			# Get list of users having access level for all accessible projects
			$t_users = array();
			foreach( $t_projects as $t_project_id ) {
				$t_project_users_list = project_get_all_user_rows( $t_project_id, DEVELOPER );
				# Do a 'smart' merge of the project's user list, into an
				# associative array (to remove duplicates)
				# Use a while loop for better performance
				$i = 0;
				while( isset( $t_project_users_list[$i] ) ) {
					$t_users[ $t_project_users_list[$i]['id'] ] = $t_project_users_list[$i];
					$i++;
				}
				unset( $t_project_users_list );
			}
			unset( $t_projects );
		} else {
			$t_users = project_get_all_user_rows( $p_project_id, DEVELOPER );
		}

		$t_display = array();
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

			$t_display[] = $t_user_name;
		}

		$t_count = count( $t_users );
		for( $i = 0; $i < $t_count; $i++ ) {
			$t_row = $t_users[$i];
			$user = new User();
			$user->id = $t_row['id'];
			$user->name = $t_display[$i];
			array_push($user_array, $user);
		}
    
    $user = new User();
    $user->id = 0;
		$user->name = " ";
    array_push($user_array, $user);
		
		return $user_array;
	}

	write_bug_rows( $rows );
	
	
?>
