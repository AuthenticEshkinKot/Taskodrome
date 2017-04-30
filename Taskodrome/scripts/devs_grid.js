var m_mainPanel;

var m_issues = [];

var m_cardDescArray = [];
var m_selectedCard = { value : null,
                       mousePos : { X : 0, Y : 0 },
                       sourceIndex : null };

var m_columnWidth = { value : null };

var m_parentSize = { width : null,
                     height : null };

var m_developersNames = [];

var m_nameToHandlerId = [];

var m_popupCard = null;

var m_tableScheme = { columnBorders : [],
                      versionBorders : [] };

function init() {
  m_mainPanel = new createjs.Stage("panel");
    m_mainPanel.enableMouseOver(4);

  var parentDiv = document.getElementById("dev-grid");

  m_parentSize.width = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("width"));
  m_parentSize.height = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("height"));

  sortIssues();
  draw();
};

function draw() {
  m_mainPanel.clear();
  m_mainPanel.uncache();
  m_mainPanel.removeAllChildren();
  m_mainPanel.removeAllEventListeners();

  var panelCanvas = document.getElementById("panel");
  panelCanvas.width = m_parentSize.width;
  panelCanvas.height = m_parentSize.height;

  createTable(m_issues, m_cardDescArray, m_developersNames, m_mainPanel, "panel",
              false, m_selectedCard, m_parentSize, onPressUp, m_columnWidth, m_tableScheme);
  m_mainPanel.update();
};

function onPressUp(evt) {
  setHrefMark(window, "dg");

// <<<<<<< HEAD:Taskodrome/scripts/devs_grid.js
//   var newColumnIndex = computeColumnIndex(evt.stageX, m_issues, H_OFFSET, m_columnWidth.value);
// 
//   if(newColumnIndex == -1
//     || !isStatusAllowed(m_selectedCard.value.id, m_selectedCard.value.status, '50')) {
// =======
  var newVersionIndex = computeVersionIndex(evt.stageY, m_tableScheme);
  var newColumnIndex = computeColumnIndex(evt.stageX, m_tableScheme);
  if(newColumnIndex == -1) {
// >>>>>>> 6bd53bc... 106 done:Taskodrome/files/scripts/devs_grid.js
    newColumnIndex = m_selectedCard.sourceIndex.i;
  }

  if(m_selectedCard.sourceIndex.i != newColumnIndex) {
    m_issues[m_selectedCard.sourceIndex.i].splice(m_selectedCard.sourceIndex.k, 1);
    m_issues[newColumnIndex].splice(m_issues[newColumnIndex].length, 0, m_selectedCard.value);

    m_selectedCard.value.updateTime = Math.round((new Date().getTime()) / 1000);

    var handler_id = user_ids[newColumnIndex];
    var bug_id = m_selectedCard.value.id;

    if(handler_id != 0) {
      m_selectedCard.value.status = '50';
    }

// <<<<<<< HEAD:Taskodrome/scripts/devs_grid.js
// =======
//     var bug_id = m_selectedCard.value.id;
//     var handler_id = user_ids[newColumnIndex];
// >>>>>>> 6bd53bc... 106 done:Taskodrome/files/scripts/devs_grid.js
    m_selectedCard.value.handler_id = handler_id;
    m_selectedCard.value.version = m_versions[newVersionIndex];
    var version = m_selectedCard.value.version;
    update_issue(bug_id, handler_id, version);

// <<<<<<< HEAD:Taskodrome/scripts/devs_grid.js
//     m_bugsToSend.push({ handler_id : handler_id, bug_id : bug_id });
// =======
    setHrefMark(window, "dg");
  } else if(m_selectedCard.value.version != m_versions[newVersionIndex]) {
    m_selectedCard.value.updateTime = Math.round((new Date().getTime()) / 1000);
    m_selectedCard.value.version = m_versions[newVersionIndex];
// >>>>>>> 6bd53bc... 106 done:Taskodrome/files/scripts/devs_grid.js

    var bug_id = m_selectedCard.value.id;
    var handler_id = m_selectedCard.value.handler_id;
    var version = m_selectedCard.value.version;
    update_issue(bug_id, handler_id, version);

    setHrefMark(window, "dg");
  }

  m_selectedCard.value = null;

  fullRedraw();
};

// <<<<<<< HEAD:Taskodrome/scripts/devs_grid.js
// function sendRequest(bugIndex) {
//   console.log("----");
//   console.log("bugIndex = " + bugIndex);
// 
//   var HTTP_REQUEST_TIMEOUT = 4000;
//   var requestToken = new XMLHttpRequest();
//   var address = getPathToMantisFile(window, "view.php");
//   address = address + "?id=" + m_bugsToSend[bugIndex].bug_id;
//   requestToken.open("GET", address, true);
//   requestToken.timeout = HTTP_REQUEST_TIMEOUT;
// 
//   function tokenOnTimeout() {
//     console.log("sendRequest ERROR: timed out");
//     trySendNextBug(bugIndex);
//   };
//   requestToken.ontimeout = tokenOnTimeout;
// 
//   function tokenOnReadyStateChange() {
//     if (requestToken.readyState == 4 && requestToken.status == 200) {
//       console.log("requestToken OK");
// 
//       var page_text = requestToken.responseText;
//       var security_token = getValueByName(page_text, "bug_assign_token");
// 
//       var requestAssign = new XMLHttpRequest();
//       var address = getPathToMantisFile(window, "bug_assign.php");
//       requestAssign.open("POST", address, true);
//       requestAssign.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//       requestAssign.timeout = HTTP_REQUEST_TIMEOUT;
// 
//       function reqAssignOnTimeout() {
//         console.log("requestToken.onreadystatechange ERROR: timed out");
//         trySendNextBug(bugIndex);
//       };
//       requestAssign.ontimeout = reqAssignOnTimeout;
// 
//       function reqAssignOnReadyStateChange() {
//         if (requestAssign.readyState == 4 && requestAssign.status == 200) {
//           console.log("requestAssign OK");
//           trySendNextBug(bugIndex);
//         } else if (requestAssign.readyState == 0 || requestAssign.status == 404) {
//           requestAssign.onreadystatechange = null;
//           requestAssign.abort();
// 
//           console.log("requestAssign.onreadystatechange ERROR: readyState=" + requestAssign.readyState
//                 + " status=" + requestAssign.status);
// 
//           trySendNextBug(bugIndex);
//         } else {
//           console.log("requestAssign.onreadystatechange UNKNOWN: readyState=" + requestAssign.readyState
//                 + " status=" + requestAssign.status);
//         }
//       };
//       requestAssign.onreadystatechange = reqAssignOnReadyStateChange;
// 
//       var bug_assign_token = security_token;
//       var handler_id = m_bugsToSend[bugIndex].handler_id;
//       var bug_id = m_bugsToSend[bugIndex].bug_id;
//       var parameters = "bug_assign_token=" + bug_assign_token + "&handler_id=" +
//                         handler_id + "&bug_id=" + bug_id;
//       requestAssign.send(parameters);
//     } else if (requestToken.readyState == 0 || requestToken.status == 404) {
//       requestToken.onreadystatechange = null;
//       requestToken.abort();
// 
//       console.log("requestToken.onreadystatechange ERROR: readyState=" + requestToken.readyState
//                 + " status=" + requestToken.status);
// 
//       trySendNextBug(bugIndex);
//     } else {
//       console.log("requestToken.onreadystatechange UNKNOWN: readyState=" + requestToken.readyState
//                 + " status=" + requestToken.status);
//     }
//   };
// 
//   requestToken.onreadystatechange = tokenOnReadyStateChange;
//   requestToken.send(null);
// };
// 
// function trySendNextBug(index) {
//   if(index < m_bugsToSend.length - 1) {
//     sendRequest(index + 1);
//   } else if(m_bugsToSend.length > 0) {
//     m_bugsToSend.length = 0;
//   }
// };
// 
// =======
// >>>>>>> 6bd53bc... 106 done:Taskodrome/files/scripts/devs_grid.js
function getUsersRaw() {
  var ret = [];
  var array = document.getElementsByClassName("user_data");
  if (!checkExistence("getUsersRaw", array)) {
    return ret;
  }

  for(var i = 0; i != array.length; ++i) {
    var el = array[i];
    ret[i] = { name :  el.getAttribute("name"), 
      id : el.getAttribute("id")
    };
  }

  return ret;
};

function sortIssues() {
  var users = getUsersRaw();
  function sorter(a, b) {
    if(a.name > b.name) return 1; else return -1;
  };
  users.sort( sorter );

  m_nameToHandlerId = createUsernamesMap(users);

  m_issues = [];
  m_developersNames = [];
  user_ids = [];
  var idsIndexes = [];
  for(var i = 0; i != users.length; ++i) {
    user_ids[i] = users[i].id;
    m_developersNames[i] = users[i].name;
    m_issues[i] = [];
    idsIndexes[users[i].id] = i;
  }

  for(var i = 0; i != m_issues_raw.length; ++i) {
    var index = idsIndexes[m_issues_raw[i].handler_id];
    m_issues[index].splice(m_issues[index].length, 0, m_issues_raw[i]);
  }
};

function createUsernamesMap(users) {
  var ret = [];
  for(var i = 0; i != users.length; ++i) {
    ret[users[i].id] = users[i].name;
  }

  return ret;
};
