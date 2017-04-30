function getIssuesRaw() {
  var ret = [];
  var array = document.getElementsByClassName("issue_data");
  if (!checkExistence("getIssuesRaw", array)) {
    return ret;
  }

  for(var i = 0; i != array.length; ++i) {
    var el = array[i];
    ret[i] = { id : el.getAttribute("id"),
      summary : el.getAttribute("summary"),
      status : el.getAttribute("status"),
      handler_id : el.getAttribute("handler_id"),
      topColor: el.getAttribute("topColor"),
      bottomColor: el.getAttribute("bottomColor"),
      updateTime: el.getAttribute("updateTime"),
      description: el.getAttribute("description"),
      severity: el.getAttribute("severity"),
      priority: el.getAttribute("priority"),
      reproducibility: el.getAttribute("reproducibility"),
      version: el.getAttribute("version")
    };
  }
  
  return ret;
};

function getTemperatureColor(updateTime) {
  var colorPeriod = m_cooldown_period / 4;
  var currentTime = (new Date().getTime()) / 1000;
  var timeFromUpdate = currentTime - updateTime;

  if(timeFromUpdate <= colorPeriod) {
    var green = Math.round((timeFromUpdate / colorPeriod) * 255);
    var greenStr = green.toString(16);
    if (greenStr.length == 2) {
      return '#FF' + greenStr + '00';
    } else {
      return '#FF0' + greenStr + '00';
    }
  } else if(timeFromUpdate <= 2 * colorPeriod ) {
    var blue = Math.round(((timeFromUpdate - colorPeriod) / colorPeriod) * 255);
    var blueStr = blue.toString(16);
    if (blueStr.length == 2) {
      return '#FFFF' + blueStr;
    } else {
      return '#FFFF0' + blueStr;
    }
  } else if( timeFromUpdate <= 3 * colorPeriod ) {
    var red = Math.round(( 1 - ( (timeFromUpdate - 2 * colorPeriod) / colorPeriod)) * 255);
    var redStr = red.toString(16);
    if (redStr.length == 2) {
      return '#' + redStr + 'FFFF';
    } else {
      return '#0' + redStr + 'FFFF';
    }
  } else if( timeFromUpdate <= 4 * colorPeriod ) {
    var green = Math.round(( 1 - ( (timeFromUpdate - 3 * colorPeriod) / colorPeriod)) * 255);
    var greenStr = green.toString(16);
    if (greenStr.length == 2) {
      return '#00' + greenStr + 'FF';
    } else {
      return '#000' + greenStr + 'FF';
    }
  } else {
    return '#0000FF';
  }
};

function setHrefMark(window, mark) {
  var href = window.location.href;
  var mark_index = href.lastIndexOf("#");

  if(mark_index == -1) {
    window.location.href = href + "#" + mark;
  } else {
    window.location.href = href.substr(0, mark_index + 1) + mark;
  }
};

function getPathToMantisFile(window, filename) {
  var protocol = window.location.protocol;
  var hostname = window.location.hostname;

  var path = window.location.pathname.substr(0, window.location.pathname.lastIndexOf("/"));

  var result = protocol + "//" + hostname + path + "/" + filename;

  return result;
};

function computeColumnIndex(x, tableScheme) {
  var columnBorders = tableScheme.columnBorders;
  for (var i = columnBorders.length - 1; i > -1; --i) {
    if (x >= columnBorders[i]) {
      return i == columnBorders.length - 1 ? -1 : i;
    }
  }
  return -1;
}

function computeVersionIndex(y, tableScheme) {
  var versionBorders = tableScheme.versionBorders;
  for (var i = versionBorders.length - 1; i > -1; --i) {
    if (y >= versionBorders[i]) {
      return i;
    }
  }
  return -1;
}

function openBoard(board) {
  setHrefMark(window, board);

  if (board == "sg") {
    document.getElementById("radio_sg").checked = true;
    document.getElementById("radio_dg").checked = false;
  } else {
    document.getElementById("radio_dg").checked = true;
    document.getElementById("radio_sg").checked = false;
  }
};

function getStatusesAllowanceMap() {
  var ret = [];
  var array = document.getElementsByClassName("status_pair");
  if (!checkExistence("getStatusesAllowanceMap", array)) {
    return ret;
  }

  for(var i = 0; i != array.length; ++i) {
    var el = array[i];
    var id = el.getAttribute("id");
    ret[id] = [];

    var src_status = el.getAttribute("src_status").split(';');
    src_status.pop();

    var dst_status = el.getAttribute("dst_status").split(';');
    dst_status.pop();

    for (var s_i = 0; s_i != src_status.length; ++s_i) {
      var dst_status_per_src = dst_status[s_i].split(',');
      dst_status_per_src.pop();
      ret[id][src_status[s_i]] = dst_status_per_src;
    }
  }

  return ret;
};

function getStatusColors() {
  var ret = [];
  var statusColorMap = document.getElementsByClassName("status_color_map")[0].getAttribute("value");
  if (!checkExistence("getStatusColors", statusColorMap)) {
    return ret;
  }

  var pairs = statusColorMap.split(';');

  for (var i = 0, l = pairs.length; i != l - 1; ++i) {
    var pair = pairs[i].split(':');
    ret[pair[0]] = pair[1];
  }

  return ret;
};

function getVersions() {
  var ret = [''];
  var versions = document.getElementsByClassName("version");
  for (var i = 0, l = versions.length; i != l; ++i) {
    ret.push(versions[i].getAttribute("value"));
  }
  return ret;
};

function checkExistence(functionName, obj) {
  var exists = (obj != null);
  console.log(functionName + ": exists - " + exists);
  if (exists) {
    console.log(functionName + ": length - " + obj.length);
  }
  return exists;
};
