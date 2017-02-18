var myPanel_st;

var statusList = [];

var issues_st = [];

var cardDescArray_st = [];
var selectedCard_st = { value : null };
var selectedCardSourceIndex_st = { value : null };
var selectedCardMousePos_st = { X : 0, Y : 0 };

var columnWidth_st = { value : null };

var parentWidth_st = { value : null }, parentHeight_st;

var bugsToSend_st = [];

var statusByColumns = [];
var columnByStatus = [];

function statusInit() {
  myPanel_st = new createjs.Stage("panel_st");
  myPanel_st.enableMouseOver(4);

  statusList = getStatusList_st();
  statusColorMap = getStatusColors();

  var parentDiv = document.getElementById("st-grid");

  parentWidth_st.value = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("width"));
  parentHeight_st = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("height"));

  createColumnStatusMap();
  sortIssues_st();

  draw_st();
};

function draw_st() {
  myPanel_st.clear();
  myPanel_st.uncache();
  myPanel_st.removeAllChildren();
  myPanel_st.removeAllEventListeners();

  var panelCanvas = document.getElementById("panel_st");
  panelCanvas.width = parentWidth_st.value;
  panelCanvas.height = parentHeight_st;

  createTable(issues_st, cardDescArray_st, statusList, myPanel_st, "panel_st",
              true, selectedCardMousePos_st, selectedCard_st,
              selectedCardSourceIndex_st, columnWidth_st, parentWidth_st,
              parentWidth_st.value, parentHeight_st, onPressUp_st);
  myPanel_st.update();
};

function onPressUp_st(evt) {
  setHrefMark(window, "sg");

  var newColumnIndex = computeColumnIndex(evt.stageX, issues_st, H_OFFSET, columnWidth_st.value);
  var currStatus = getStatusByColumn_st(selectedCardSourceIndex_st.value.i);
  var newStatus = getStatusByColumn_st(newColumnIndex);

  if(newColumnIndex == -1
    || !isStatusAllowed(selectedCard_st.value.id, currStatus, newStatus)) {
    newColumnIndex = selectedCardSourceIndex_st.value.i;
  }

  if(selectedCardSourceIndex_st.value.i != newColumnIndex) {
    issues_st[selectedCardSourceIndex_st.value.i].splice(selectedCardSourceIndex_st.value.k, 1);
    issues_st[newColumnIndex].splice(issues_st[newColumnIndex].length, 0, selectedCard_st.value);

    var status = getStatusByColumn_st(newColumnIndex);
    selectedCard_st.value.status = status;
    selectedCard_st.value.updateTime = Math.round((new Date().getTime()) / 1000);

    var handler_id = selectedCard_st.value.handler_id;
    var bug_id = selectedCard_st.value.id;
    bugsToSend_st.push({ handler_id : handler_id, bug_id : bug_id, status : status });

    if (bugsToSend_st.length == 1) {
      sendRequest_st(0);
    }

    setHrefMark(window, "sg");
  }

  selectedCard_st.value = null;

  fullRedraw();
};

function sendRequest_st(bugIndex) {
  var requestToken = new XMLHttpRequest();
  var address = getPathToMantisFile(window, "bug_change_status_page.php");
  requestToken.open("POST", address, true);
  requestToken.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  function tokenOnReadyStateChange() {
    if (requestToken.readyState == 4 && requestToken.status == 200) {
      var page_text = requestToken.responseText;
      var security_token = getValueByName_st(page_text, "bug_update_token");

      var requestUpdate = new XMLHttpRequest();
      var address = getPathToMantisFile(window, "bug_update.php");
      requestUpdate.open("POST", address, true);
      requestUpdate.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

      function reqUpdateOnReadyStateChanged() {
        if (requestUpdate.readyState == 4 && requestUpdate.status == 200) {
          if(bugIndex < bugsToSend_st.length - 1) {
            sendRequest_st(bugIndex + 1);
          } else if(bugsToSend_st.length > 0) {
            bugsToSend_st.length = 0;
          }
        }
      };
      requestUpdate.onreadystatechange = reqUpdateOnReadyStateChanged;

      var bug_update_token = security_token;
      var handler_id = bugsToSend_st[bugIndex].handler_id;
      var bug_id = bugsToSend_st[bugIndex].bug_id;
      var status = bugsToSend_st[bugIndex].status;
      var parameters = "bug_update_token=" + bug_update_token + "&handler_id=" + handler_id + "&bug_id=" + bug_id + "&status=" + status;
      requestUpdate.send(parameters);
    }
  };
  requestToken.onreadystatechange = tokenOnReadyStateChange;

  var bug_id = bugsToSend_st[bugIndex].bug_id;
  var status = bugsToSend_st[bugIndex].status;
  var parameters = "id=" + bug_id + "&new_status=" + status;
  requestToken.send(parameters);
};

function createColumnStatusMap() {
  var statusCodes = getStatusCodes_st();

  if (statusList[statusList.length - 1] == '') {
    statusList.pop();
  }

  for (var i = 0; i != statusList.length; ++i) {
    var status = statusList[i];
    var statusNameL = status.toLowerCase();
    statusByColumns[i] = statusCodes[statusNameL];
  }

  for (var i = 0; i != 91; ++i) {
    columnByStatus[i] = statusList.length;
  }

  for (var i = 0; i != statusByColumns.length; ++i) {
    var index = parseInt(statusByColumns[i]);
    columnByStatus[index] = i;
  }
};

function sortIssues_st() {
  issues_st = [];
  for(var i = 0; i != statusList.length + 1; ++i) {
    issues_st[i] = [];
  }

  for(var i = 0; i != issues_raw.length; ++i) {
    var columnIndex = getColumnByStatus_st(issues_raw[i].status);
    var posIndex = issues_st[columnIndex].length;
    issues_st[columnIndex][posIndex] = issues_raw[i];
  }
};

function getValueByName_st(page_text, name) {
  var prefix = 'name="' + name + '" value="';
  var src_string = page_text.match(new RegExp('.*' + prefix + '.*'))[0];
  var start_index = src_string.indexOf(prefix) + prefix.length;
  return src_string.substr(start_index, src_string.indexOf("\"", start_index + 1) - start_index);
};

function getStatusByColumn_st(columnIndex) {
  if (columnIndex >= 0) {
    return statusByColumns[columnIndex];
  } else {
    return '90';
  }
};

function getColumnByStatus_st(status) {
  return columnByStatus[parseInt(status)];
};

function getStatusList_st() {
  var ret = [];
  var statusString = document.getElementsByClassName("status_board_order")[0].getAttribute("value");
  if (!checkExistence("getStatusList_st", statusString)) {
    return ret;
  }

  ret = statusString.split(';');
  ret = ret.splice(0, ret.length - 1);
  return ret;
};

function getStatusCodes_st() {
  var ret = [];
  var statusNameMap = document.getElementsByClassName("status_name_map")[0].getAttribute("value");
  if (!checkExistence("getStatusCodes_st", statusNameMap)) {
    return ret;
  }
  var pairs = statusNameMap.split(';');

  for (var i = 0, l = pairs.length; i != l - 1; ++i) {
    var pair = pairs[i].split(':');
    ret[pair[1].toLowerCase()] = pair[0];
  }

  return ret;
};
