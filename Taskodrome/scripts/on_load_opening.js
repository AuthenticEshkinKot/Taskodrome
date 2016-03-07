var issues_raw;

function onLoadOpening() {
  var mark_index = window.location.href.lastIndexOf("#");
  
  if(mark_index != -1)
  {
    var prevGrid = window.location.href.substr(mark_index + 1, 2);
    openBoard(prevGrid);
  }
  else
  {
    openBoard("dg");
  }
}

function pageOnLoad() {
  onLoadOpening();

  issues_raw = getIssuesRaw();
  
  init();
  statusInit();
}

document.addEventListener("DOMContentLoaded", pageOnLoad);
