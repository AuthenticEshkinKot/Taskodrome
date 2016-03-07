var issues_raw;
var cooldown_period;

function onLoadOpening() {
  var markIndex = window.location.href.lastIndexOf("#");
  
  if(markIndex != -1)
  {
    var prevGrid = window.location.href.substr(markIndex + 1, 2);
    openBoard(prevGrid);
  }
  else
  {
    openBoard("dg");
  }
}

function getCooldownPeriod() {
  var cooldownPeriodDays = document.getElementById("cooldown_period_days").getAttribute("value");
  var cooldownPeriodHours = document.getElementById("cooldown_period_hours").getAttribute("value");
  return cooldownPeriodHours * 3600 + cooldownPeriodDays * 86400;
}

function pageOnLoad() {
  onLoadOpening();

  issues_raw = getIssuesRaw();
  
  cooldown_period = getCooldownPeriod();

  init();
  statusInit();
}

document.addEventListener("DOMContentLoaded", pageOnLoad);
