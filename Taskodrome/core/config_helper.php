<?php

function convertStatusEnumToString($p_StatusEnumList){
    $t_StatusStringList = $p_StatusEnumList;
    $t_status_enum_lang_array = getLanguageListForEnum();

    foreach($t_StatusStringList as $key => $value) {
        $t_StatusStringList[$key] = $t_status_enum_lang_array[explode(':', $value)[0]];
    }

    return $t_StatusStringList;
}

function convertStringToStatusEnum($p_StringList){
    $t_StatusEnumList = $p_StringList;
    $t_status_lang_enum_array = array_flip(getLanguageListForEnum());
    
    foreach($t_StatusEnumList as $key => $value) {
        $t_StatusEnumList[$key] = $t_status_lang_enum_array[explode(':', $value)[0]];
    }
    
    return $t_StatusEnumList;
}

function getLanguageListForEnum(){
    $t_status_list_language = explode(',', lang_get( 'status_enum_string' ));
    $t_status_enum_lang_array = array();
   
    foreach( $t_status_list_language as $key => $value ) {
        $t_status_enum_lang_array[explode(':', $value)[0]] = explode(':', $value)[1];
    } 
    
    return $t_status_enum_lang_array;
}