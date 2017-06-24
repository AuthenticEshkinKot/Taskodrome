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
      updateTime: el.getAttribute("updateTime"),
      description: el.getAttribute("description"),
      severity: el.getAttribute("severity"),
      priority: el.getAttribute("priority"),
      priorityCode: el.getAttribute("priorityCode"),
      reproducibility: el.getAttribute("reproducibility"),
      version: el.getAttribute("version")
    };
  }
  
  return ret;
};

function getTemperatureColor(updateTime) {
  var currentTime = (new Date().getTime()) / 1000;
  var timeFromUpdate = currentTime - updateTime;

  if (timeFromUpdate > m_cooldown_period)
    return "#1D1DE2";

  var sat = 0.77;
  var lgt = 0.5;

  var diff = 0.2;
  var huePart = 0;
  var step = Math.floor((timeFromUpdate / m_cooldown_period) / diff);
  switch (step)
  {
    case 0: huePart = 0; break;
    case 1: huePart = 0.09; break;
    case 2: huePart = 0.18; lgt = 0.48; break;
    case 3: huePart = 0.38; lgt = 0.38; break;
    case 4: huePart = 0.81; break;
    default: huePart = 1; break;
  }
  var max_hue = 0.66667;
  var hue = huePart * max_hue;

  var rgb = hslToRgb(hue, sat, lgt);

  var r = rgb[0].toString(16);
  r = (r.length == 1) ? "0" + r : r;
  var g = rgb[1].toString(16);
  g = (g.length == 1) ? "0" + g : g;
  var b = rgb[2].toString(16);
  b = (b.length == 1) ? "0" + b : b;
  return "#" + r + g + b;
};

function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if(t < 0)
        t += 1;
      if(t > 1)
        t -= 1;
      if(t < 1/6)
        return p + (q - p) * 6 * t;
      if(t < 1/2)
        return q;
      if(t < 2/3)
        return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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

function getLangReportDetails() {
  var ret = [];
  var descr = document.getElementById("lang_description").getAttribute("value");
  ret["description"] = descr ? descr : "Description";
  var sev = document.getElementById("lang_severity").getAttribute("value");
  ret["severity"] = sev ? sev : "Severity";
  var pri = document.getElementById("lang_priority").getAttribute("value");
  ret["priority"] = pri ? pri : "Priority";
  var repr = document.getElementById("lang_reproducibility").getAttribute("value");
  ret["reproducibility"] = repr ? repr : "Reproducibility";
  return ret;
}

function checkExistence(functionName, obj) {
  var exists = (obj != null);
  console.log(functionName + ": exists - " + exists);
  if (exists) {
    console.log(functionName + ": length - " + obj.length);
  }
  return exists;
};
