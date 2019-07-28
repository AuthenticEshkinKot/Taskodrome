function pageOnLoad() {
  openPage();

  DataSource.Inst();

  initVersionVisibility();

  DevPage.Inst();
  StatusPage.Inst();
  RelPage.Inst();
};
window.addEventListener("load", pageOnLoad);

function openPage() {
  var markIndex = window.location.href.lastIndexOf("#");

  if(markIndex != -1) {
    var prevGrid = window.location.href.substr(markIndex + 1, 2);
    openBoard(prevGrid);
  } else {
    openBoard("dg");
  }
};

function initVersionVisibility() {
  var checkbox_version = document.getElementById("checkbox_version");
  var show_empty_versions = sessionStorage.getItem("show_empty_versions");
  if (show_empty_versions != null) {
    show_empty_versions = (show_empty_versions == "true");
    checkbox_version.checked = show_empty_versions;
  } else {
    show_empty_versions = checkbox_version.checked;
    sessionStorage.setItem("show_empty_versions", show_empty_versions);
  }
  console.log("show_empty_versions - " + show_empty_versions);

  function onCheckboxClick() {
    sessionStorage.setItem("show_empty_versions", checkbox_version.checked);
  };
  checkbox_version.addEventListener("click", onCheckboxClick);
};