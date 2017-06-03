var m_issues_raw;
var m_cooldown_period;
var m_allowed_statuses_map;
var m_status_color_map;
var m_versions;
var m_lang_report_details;

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
  return isIndexInArray(m_allowed_statuses_map, id)
  && isIndexInArray(m_allowed_statuses_map[id], src_status)
  && m_allowed_statuses_map[id][src_status].indexOf(dst_status) != -1;
};

function getCooldownPeriod() {
  var cooldownPeriodDays = document.getElementById("cooldown_period_days").getAttribute("value");
  var cooldownPeriodHours = document.getElementById("cooldown_period_hours").getAttribute("value");
  console.log("getCooldownPeriod: cooldownPeriodDays - " + cooldownPeriodDays
  + " cooldownPeriodHours - " + cooldownPeriodHours);
  return cooldownPeriodHours * 3600 + cooldownPeriodDays * 86400;
};

function pageOnLoad() {
  onLoadOpening();

  m_issues_raw = getIssuesRaw();
  m_cooldown_period = getCooldownPeriod();
  m_allowed_statuses_map = getStatusesAllowanceMap();
  m_status_color_map = getStatusColors();
  m_versions = getVersions();
  m_lang_report_details = getLangReportDetails();

  init();
  statusInit();
};

window.addEventListener("load", pageOnLoad);
