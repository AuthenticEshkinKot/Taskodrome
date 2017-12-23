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
                      versionBorders : [],
                      headerHeight : 0 };

var m_redrawn = false;

function init() {
  m_mainPanel = new createjs.Stage("panel");
  m_mainPanel.enableMouseOver(4);

  var parentDiv = document.getElementById("parent_div");
  m_parentSize.width = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("width"));

  parentDiv = document.getElementById("tab_c1");
  m_parentSize.height = parseInt(window.getComputedStyle(parentDiv).getPropertyValue("height"));

  sortIssues();
  draw();

  addRadioCallback(window, "dg", "radio_dg");
};

function draw() {
  m_mainPanel.clear();
  m_mainPanel.uncache();
  m_mainPanel.removeAllChildren();
  m_mainPanel.removeAllEventListeners();

  var panelCanvas = document.getElementById("panel");
  panelCanvas.width = m_parentSize.width;
  panelCanvas.height = m_parentSize.height;

  var tab_c1 = document.getElementById("tab_c1");

  var show_empty_versions = document.getElementById("checkbox_version").checked;

  createTable(m_issues, m_cardDescArray, m_developersNames, m_mainPanel, panelCanvas, tab_c1,
              false, m_selectedCard, m_parentSize, onPressUp, show_empty_versions, m_columnWidth, m_tableScheme);
  var tab_c1_width = parseInt(window.getComputedStyle(tab_c1).getPropertyValue("width"));
  if (!m_redrawn && (panelCanvas.width > tab_c1_width)) {
    m_redrawn = true;
    m_parentSize.width = tab_c1_width;
    draw();
  } else {
    m_redrawn = false;
    m_mainPanel.update();
  }
};

function onPressUp(evt) {
  var newVersionIndex = computeVersionIndex(evt.stageY, m_tableScheme);
  var newColumnIndex = computeColumnIndex(evt.stageX, m_tableScheme);
  if(newColumnIndex == -1) {
    newColumnIndex = m_selectedCard.sourceIndex.i;
  }

  if(newVersionIndex != -1 && m_selectedCard.sourceIndex.i != newColumnIndex) {
    m_issues[m_selectedCard.sourceIndex.i].splice(m_selectedCard.sourceIndex.k, 1);
    m_issues[newColumnIndex].splice(m_issues[newColumnIndex].length, 0, m_selectedCard.value);

    m_selectedCard.value.updateTime = Math.round((new Date().getTime()) / 1000);

    if(m_selectedCard.value.handler_id == 0 && m_selectedCard.value.status != 80
    && m_selectedCard.value.status != 90) {
      m_selectedCard.value.status = '50';
    }

    var bug_id = m_selectedCard.value.id;
    var handler_id = user_ids[newColumnIndex];
    m_selectedCard.value.handler_id = handler_id;
    m_selectedCard.value.version = m_versions[newVersionIndex];
    var version = m_selectedCard.value.version;
    update_issue(bug_id, handler_id, version);
  } else if(newVersionIndex != -1 && m_selectedCard.value.version != m_versions[newVersionIndex]) {
    m_selectedCard.value.updateTime = Math.round((new Date().getTime()) / 1000);
    m_selectedCard.value.version = m_versions[newVersionIndex];

    var bug_id = m_selectedCard.value.id;
    var handler_id = m_selectedCard.value.handler_id;
    var version = m_selectedCard.value.version;
    update_issue(bug_id, handler_id, version);
  }

  m_selectedCard.value = null;

  fullRedraw();
};

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
