var H_PADDING_CORRECTION = 6;
var V_PADDING_CORRECTION = 20;

var myPanel;

var issues = [];

var cardDescArray = [];
var selectedCard = { value : null };
var selectedCardSourceIndex = { value : null };
var selectedCardMousePos = { X : 0, Y : 0 };

var columnWidth = { value : null };

var parentWidth = { value : null }, parentHeight;

var bugsToSend = [];

var developersNames = [];

var nameToHandlerId = [];

var popupCard = null;

function init() {
  myPanel = new createjs.Stage("panel");
  myPanel.enableMouseOver(4);

  var parentDiv = document.getElementById("dev-grid");

  parentWidth.value = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("width")) - H_PADDING_CORRECTION;
  parentHeight = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("height")) - V_PADDING_CORRECTION;

  sortIssues();
  draw();
};

function draw() {
  myPanel.clear();
  myPanel.uncache();
  myPanel.removeAllChildren();
  myPanel.removeAllEventListeners();

  var panelCanvas = document.getElementById("panel");
  panelCanvas.width = parentWidth.value;
  panelCanvas.height = parentHeight;

  createTable(issues, cardDescArray, developersNames, myPanel, "panel",
              "dev-grid", selectedCardMousePos, selectedCard,
             selectedCardSourceIndex, columnWidth, parentWidth,
             parentWidth.value, parentHeight, onPressUp);
  myPanel.update();
};

function onPressUp(evt) {
  setHrefMark(window, "dg");

  var newColumnIndex = computeColumnIndex(evt.stageX, issues, H_OFFSET, columnWidth.value);

  if(newColumnIndex == -1
    || !isStatusAllowed(selectedCard.value.id, selectedCard.value.status, '50')) {
    newColumnIndex = selectedCardSourceIndex.value.i;
  }

  if(selectedCardSourceIndex.value.i != newColumnIndex) {
    issues[selectedCardSourceIndex.value.i].splice(selectedCardSourceIndex.value.k, 1);
    issues[newColumnIndex].splice(issues[newColumnIndex].length, 0, selectedCard.value);

    selectedCard.value.updateTime = Math.round((new Date().getTime()) / 1000);

    var handler_id = user_ids[newColumnIndex];
    var bug_id = selectedCard.value.id;

    if(handler_id != 0)
    {
      selectedCard.value.status = '50';
    }

    selectedCard.value.handler_id = handler_id;

    bugsToSend.push({ handler_id : handler_id, bug_id : bug_id });

    if (bugsToSend.length == 1) {
      sendRequest(0);
    }

    setHrefMark(window, "dg");
  }

  selectedCard.value = null;

  fullRedraw();
};

function sendRequest(bugIndex)
{
  console.log("----");
  console.log("bugIndex = " + bugIndex);

  var HTTP_REQUEST_TIMEOUT = 4000;
  var requestToken = new XMLHttpRequest();
  var address = getPathToMantisFile(window, "view.php");
  address = address + "?id=" + bugsToSend[bugIndex].bug_id;
  requestToken.open("GET", address, true);
  requestToken.timeout = HTTP_REQUEST_TIMEOUT;

  function tokenOnTimeout() {
    console.log("sendRequest ERROR: timed out");
    trySendNextBug(bugIndex);
  };
  requestToken.ontimeout = tokenOnTimeout;

  function tokenOnReadyStateChange() {
    if (requestToken.readyState == 4 && requestToken.status == 200) {
      console.log("requestToken OK");

      var page_text = requestToken.responseText;
      var security_token = getValueByName(page_text, "bug_assign_token");

      var requestAssign = new XMLHttpRequest();
      var address = getPathToMantisFile(window, "bug_assign.php");
      requestAssign.open("POST", address, true);
      requestAssign.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      requestAssign.timeout = HTTP_REQUEST_TIMEOUT;

      function reqAssignOnTimeout() {
        console.log("requestToken.onreadystatechange ERROR: timed out");
        trySendNextBug(bugIndex);
      };
      requestAssign.ontimeout = reqAssignOnTimeout;

      function reqAssignOnReadyStateChange() {
        if (requestAssign.readyState == 4 && requestAssign.status == 200) {
          console.log("requestAssign OK");
          trySendNextBug(bugIndex);
        }
        else if (requestAssign.readyState == 0 || requestAssign.status == 404) {
          requestAssign.onreadystatechange = null;
          requestAssign.abort();

          console.log("requestAssign.onreadystatechange ERROR: readyState=" + requestAssign.readyState
                + " status=" + requestAssign.status);

          trySendNextBug(bugIndex);
        }
        else
        {
          console.log("requestAssign.onreadystatechange UNKNOWN: readyState=" + requestAssign.readyState
                + " status=" + requestAssign.status);
        }
      };
      requestAssign.onreadystatechange = reqAssignOnReadyStateChange;

      var bug_assign_token = security_token;
      var handler_id = bugsToSend[bugIndex].handler_id;
      var bug_id = bugsToSend[bugIndex].bug_id;
      var parameters = "bug_assign_token=" + bug_assign_token + "&handler_id=" +
                        handler_id + "&bug_id=" + bug_id;
      requestAssign.send(parameters);
    }
    else if (requestToken.readyState == 0 || requestToken.status == 404) {
      requestToken.onreadystatechange = null;
      requestToken.abort();

      console.log("requestToken.onreadystatechange ERROR: readyState=" + requestToken.readyState
                + " status=" + requestToken.status);

      trySendNextBug(bugIndex);
    }
    else
    {
      console.log("requestToken.onreadystatechange UNKNOWN: readyState=" + requestToken.readyState
                + " status=" + requestToken.status);
    }
  };

  requestToken.onreadystatechange = tokenOnReadyStateChange;
  requestToken.send(null);
};

function trySendNextBug(index)
{
  if(index < bugsToSend.length - 1)
  {
    sendRequest(index + 1);
  }
  else if(bugsToSend.length > 0)
  {
    bugsToSend.length = 0;
  }
};

function getUsersRaw() {
  var ret = [];
  var array = document.getElementsByClassName("user_data");

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

  nameToHandlerId = createUsernamesMap(users);

  issues = [];
  developersNames = [];
  user_ids = [];
  var idsIndexes = [];
  for(var i = 0; i != users.length; ++i) {
    user_ids[i] = users[i].id;
    developersNames[i] = users[i].name;
    issues[i] = [];
    idsIndexes[users[i].id] = i;
  }

  for(var i = 0; i != issues_raw.length; ++i) {
    var index = idsIndexes[issues_raw[i].handler_id];
    issues[index].splice(issues[index].length, 0, issues_raw[i]);
  }
};

function createUsernamesMap(users) {
  var ret = [];
  for(var i = 0; i != users.length; ++i) {
    ret[users[i].id] = users[i].name;
  }

  return ret;
};

function getValueByName(page_text, name) {
  var prefix = 'name="' + name + '" value="';
  var src_string = page_text.match(new RegExp('.*' + prefix + '.*'))[0];
  //console.log(src_string);
  var start_index = src_string.indexOf(prefix) + prefix.length;
  var res = src_string.substr(start_index, src_string.indexOf("\"", start_index + 1) - start_index);
  //console.log(res);
  return res;
};
