var H_PADDING_CORRECTION = 6;
var V_PADDING_CORRECTION = 20;

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

  var parentDiv = document.getElementById("st-grid");

  parentWidth_st.value = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("width")) - H_PADDING_CORRECTION;
  parentHeight_st = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("height")) - V_PADDING_CORRECTION;

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
              "st-grid", selectedCardMousePos_st, selectedCard_st,
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

function sendRequest_st(bugIndex)
{
  var requestToken = new XMLHttpRequest();
  var address = getPathToMantisFile(window, "bug_change_status_page.php");
  requestToken.open("POST", address, true);
  requestToken.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  function tokenOnReadyStateChange() {
    if (requestToken.readyState == 4) {
      if(requestToken.status == 200) {
        var page_text = requestToken.responseText;

        var xmlDoc;
        if (window.DOMParser)
        {
          var parser = new DOMParser();
          xmlDoc = parser.parseFromString(page_text, "text/html");
        }
        else // Internet Explorer
        {
          xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async = false;
          xmlDoc.loadXML(page_text);
        }

        var security_token = 0;
        var last_updated = 0;
        inputs = xmlDoc.getElementsByTagName("input");        
        for(var i = 0, n = inputs.length; i < n; i++)
        {
          if (inputs[i].getAttribute("name") == "bug_update_token")
          {
            security_token = inputs[i].getAttribute("value");
          }
          else if (inputs[i].getAttribute("name") == "last_updated")
          {
            last_updated = inputs[i].getAttribute("value");
          }
        }

        var requestUpdate = new XMLHttpRequest();
        var address = getPathToMantisFile(window, "bug_update.php");
        requestUpdate.open("POST", address, true);
        requestUpdate.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        function reqUpdateOnReadyStateChanged() {
          var index = bugIndex;

          if (requestUpdate.readyState == 4) {
            if(requestUpdate.status == 200) {
              if(index < bugsToSend_st.length - 1)
              {
                sendRequest_st(index + 1);
              }
              else if(bugsToSend_st.length > 0)
              {
                bugsToSend_st.length = 0;
              }
            }
          }
        };
        requestUpdate.onreadystatechange = reqUpdateOnReadyStateChanged;

        var bug_update_token = security_token;
        var handler_id = bugsToSend_st[bugIndex].handler_id;
        var bug_id = bugsToSend_st[bugIndex].bug_id;
        var status = bugsToSend_st[bugIndex].status;
        var parameters = "bug_update_token=" + bug_update_token
        + "&handler_id=" + handler_id + "&bug_id=" + bug_id
        + "&status=" + status + "&last_updated=" + last_updated;
        requestUpdate.send(parameters);
      }
    }
  };
  requestToken.onreadystatechange = tokenOnReadyStateChange;

  var bug_id = bugsToSend_st[bugIndex].bug_id;
  var status = bugsToSend_st[bugIndex].status;
  var parameters = "id=" + bug_id + "&new_status=" + status;
  requestToken.send(parameters);
};

function createColumnStatusMap() {
  var statusString = document.getElementsByClassName("status_board_order")[0].getAttribute("value");
  statusList = statusString.split(';', 7);

  if (statusList[statusList.length - 1] == '')
  {
    statusList.pop();
  }

  for (var i = 0; i != statusList.length; ++i) {
    var status = '100';
    switch(statusList[i])
    {
      case 'New': status = '10'; break;
      case 'Feedback': status = '20'; break;
      case 'Acknowledged': status = '30'; break;
      case 'Confirmed': status = '40'; break;
      case 'Assigned': status = '50'; break;
      case 'Resolved': status = '80'; break;
      case 'Closed': status = '90'; break;
      default: status = '100'; break;
    }
    statusByColumns[i] = status;
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

function getStatusByColumn_st(columnIndex) {
  /*switch(columnIndex)
  {
    case 0: return '10';
    case 1: return '20';
    case 2: return '30';
    case 3: return '40';
    case 4: return '50';
    case 5: return '80';
    case 6: return '90';
    default: return '90';
  }*/
  if (columnIndex >= 0) {
    return statusByColumns[columnIndex];
  }
  else
  {
    return '90';
  }
};

function getColumnByStatus_st(status) {
  /*switch(status)
  {
    case '10': return 0;
    case '20': return 1;
    case '30': return 2;
    case '40': return 3;
    case '50': return 4;
    case '80': return 5;
    case '90': return 6;
    default: return 6;
  }*/
  return columnByStatus[parseInt(status)];
};
