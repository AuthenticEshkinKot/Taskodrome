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

function init() {
	myPanel = new createjs.Stage("panel");

	var parentDiv = document.getElementById("dev-grid");

	parentWidth.value = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("width")) - H_PADDING_CORRECTION;
	parentHeight = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("height")) - V_PADDING_CORRECTION;

  security_token = getSecurityToken();
  
  sortIssues();
  draw();
}

function draw() {
	myPanel.clear();
	myPanel.uncache();
	myPanel.removeAllChildren();
	myPanel.removeAllEventListeners();
	
	var panelCanvas = document.getElementById("panel");
	panelCanvas.width = parentWidth.value;
	panelCanvas.height = parentHeight;
	
	createTable(issues, cardDescArray, developersNames, myPanel, "panel", "dev-grid", selectedCardMousePos, selectedCard, selectedCardSourceIndex, columnWidth, parentWidth, parentWidth.value, parentHeight, onPressUp);
	myPanel.update();
}

function onPressUp(evt) {
	var newColumnIndex = computeColumnIndex(evt.stageX, issues, H_OFFSET, columnWidth.value);

	if(newColumnIndex == -1) {
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
    
    bugsToSend.push({ handler_id : handler_id, bug_id : bug_id });
    
    if (bugsToSend.length == 1) {
      sendRequest(0);
    }
		
		setHrefMark(window, "dg");
	}

	selectedCard.value = null;

	fullRedraw();
}

function sendRequest(bugIndex)
{
  var requestToken = new XMLHttpRequest();
  var address = getPathToMantisFile(window, "view.php");
  address = address + "?id=" + bugsToSend[bugIndex].bug_id;
  requestToken.open("GET", address, true);
  
  requestToken.onreadystatechange = function() {
    if (requestToken.readyState == 4) {
      if(requestToken.status == 200) {
        page_text = requestToken.responseText;
        
        if (window.DOMParser)
        {
          parser = new DOMParser();
          xmlDoc = parser.parseFromString(page_text, "text/xml");
        }
        else // Internet Explorer
        {
          xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async=false;
          xmlDoc.loadXML(page_text);
        }
        
        security_token = 0;
        inputs = xmlDoc.getElementsByTagName("input");        
        for(var i = 0, n = inputs.length; i < n; i++)
        {
          if (inputs[i].getAttribute("name") == "bug_assign_token")
          {
            security_token = inputs[i].getAttribute("value");
          }
        }
        
        
        var requestAssign = new XMLHttpRequest();
        var address = getPathToMantisFile(window, "bug_assign.php");
        requestAssign.open("POST", address, true);
        requestAssign.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        requestAssign.onreadystatechange = function() {
          var index = bugIndex;

          if (requestAssign.readyState == 4) {
            if(requestAssign.status == 200) {
              if(index < bugsToSend.length - 1)
              {
                sendRequest(index + 1);               
              }
              else if(bugsToSend.length > 0)
              {
                bugsToSend.length = 0;               
              }
            }
          }
        }
        
        var bug_assign_token = security_token;
        var handler_id = bugsToSend[bugIndex].handler_id;
        var bug_id = bugsToSend[bugIndex].bug_id;
        var parameters = "bug_assign_token=" + bug_assign_token + "&handler_id=" +
        handler_id + "&bug_id=" + bug_id;
        requestAssign.send(parameters);
      }
    }
  }

  requestToken.send(null);
}

function getSecurityToken() {
  return document.getElementsByClassName("token_assign")[0].getAttribute("token");
}

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
}

function sortIssues() {
  var users = getUsersRaw();
	users.sort( function (a, b) { if(a.name > b.name) return 1; else return -1; });
	
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
}
