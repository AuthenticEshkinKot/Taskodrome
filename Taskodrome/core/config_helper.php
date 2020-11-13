<?php

function convertStatusEnumToString($p_StatusEnumList){
    $t_StatusEnumList = $p_StatusEnumList;
    $t_status_list_language = explode(',', lang_get( 'status_enum_string' ));
    $t_status_enum_lang_array = array();

    foreach( $t_status_list_language as $key => $value ) {
        $t_status_enum_lang_array[explode(':', $value)[0]] = explode(':', $value)[1];
    } 

    foreach($t_StatusEnumList as $key => $value) {
        $t_StatusEnumList[$key] = $t_status_enum_lang_array[explode(':', $value)[0]];
    }

    return $t_StatusEnumList;
}