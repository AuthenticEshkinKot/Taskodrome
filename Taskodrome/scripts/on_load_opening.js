var issues_raw;

function onLoadOpening() {
  var mark_index = window.location.href.lastIndexOf("#");
  
  document.getElementById("tab_l1").style.display = "block";
  document.getElementById("tab_l2").style.display = "block";
  
  if(mark_index != -1)
  {
    var prevGrid = window.location.href.substr(mark_index + 1, 2);
    if (prevGrid == "dg")
    {
      document.getElementById("tab_1").checked = "checked";
    }
    else if (prevGrid == "sg")
    {
      document.getElementById("tab_2").checked = "checked";
    }
  }
  else
  {
    document.getElementById("tab_1").checked = "checked";
  }
}

function pageOnLoad() {
  onLoadOpening();

  issues_raw = getIssuesRaw();
  
  init();
  statusInit();
}

document.addEventListener("DOMContentLoaded", pageOnLoad);
