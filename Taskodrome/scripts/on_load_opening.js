var issues_raw;
var cooldown_period;
var allowed_statuses_map;

function onLoadOpening() {
  var markIndex = window.location.href.lastIndexOf("#");

  if(markIndex != -1) {
    var prevGrid = window.location.href.substr(markIndex + 1, 2);
    openBoard(prevGrid);
  } else {
    openBoard("dg");
  }
};

function isIndexInArray(array, index) {
  return array.length > index && array[index] != null;
};

function isStatusAllowed(id, src_status, dst_status) {
  return isIndexInArray(allowed_statuses_map, id)
  && isIndexInArray(allowed_statuses_map[id], src_status)
  && allowed_statuses_map[id][src_status].indexOf(dst_status) != -1;
};

function getCooldownPeriod() {
  var cooldownPeriodDays = document.getElementById("cooldown_period_days").getAttribute("value");
  var cooldownPeriodHours = document.getElementById("cooldown_period_hours").getAttribute("value");
  return cooldownPeriodHours * 3600 + cooldownPeriodDays * 86400;
};

function pageOnLoad() {
  onLoadOpening();

  issues_raw = getIssuesRaw();

  cooldown_period = getCooldownPeriod();

  allowed_statuses_map = getStatusesAllowanceMap();

  init();
  statusInit();
};

document.addEventListener("DOMContentLoaded", pageOnLoad);
