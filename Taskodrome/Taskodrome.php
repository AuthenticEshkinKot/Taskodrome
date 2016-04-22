<?php

# Copyright (c) 2015 Maxim Kuzmin
# Licensed under the Apache License

class TaskodromePlugin extends MantisPlugin
{
  public function register()
  {
    $this->name = plugin_lang_get("title");
    $this->description = plugin_lang_get("description");
    $this->page = 'config_page';

    $this->version = "0.1";
    $this->requires = array(
      "MantisCore" => "1.3.0",
    );

    $this->author = "Maxim Kuzmin";
    $this->contact = "maxriderg@gmail.com";
    $this->url = "https://github.com/AuthenticEshkinKot/Taskodrome";
  }

  public function hooks()
  {
    return array(
      "EVENT_MENU_MAIN" => "menu",
    );
  }

  public function config()
  {
    return array(
      "status_board_order_default" => array(
        "New", "Feedback", "Acknowledged", "Confirmed", "Assigned", "Resolved", "Closed"
      ),

      "status_board_order" => array(
        "New", "Feedback", "Acknowledged", "Confirmed", "Assigned", "Resolved", "Closed"
      ),

      "cooldown_period_days" => 14,
      "cooldown_period_hours" => 0
    );
  }

  public function menu($event)
  {
    $links = array();
    $links[] = '<a href="' . plugin_page("main") . '">' . plugin_lang_get("board") . '</a>';

    return $links;
  }
}
