var m_mainPanel_rl;

var m_relations_rl = [];

var m_parentSize_rl = { width : null,
                        height : null };

function relationshipInit() {
  m_mainPanel_rl = new createjs.Stage("panel_rl");
  m_mainPanel_rl.enableMouseOver(4);

  setupParentSize("tab_c3", m_parentSize_rl);

  draw_rl();

  addRadioCallback(window, "rg", "radio_rg");
};

function draw_rl() {
  m_mainPanel_rl.clear();
  m_mainPanel_rl.uncache();
  m_mainPanel_rl.removeAllChildren();
  m_mainPanel_rl.removeAllEventListeners();

  m_relations_rl = getRelationList_rl();

  var sizeOut = { width : 0, height : 0 };
  drawRelations_rl(sizeOut);

  m_parentSize_rl.width = Math.max(m_parentSize_rl.width, sizeOut.width + 10);
  m_parentSize_rl.height = Math.max(m_parentSize_rl.height, sizeOut.height);
  setupParentSizeWithBorder("tab_c3", m_parentSize_rl, "panel_rl");

  m_mainPanel_rl.update();
};

function drawRelations_rl(sizeOut)
{
  if (m_relations_rl.length == 0) {
    noIssuesWarning_rl();
    return;
  }

  mapIssuesToRelations_rl(m_issues_raw, m_relations_rl);
  var trie = createTrie_rl(m_relations_rl);
  console.log("Trie:");
  console.log(trie);
  drawTrie_rl(trie, sizeOut);
};

function getRelationList_rl() {
  var ret = [];
  var rels = document.getElementsByClassName("relationship_data");
  if (!checkExistence("getRelationList_rl", rels)) {
    return ret;
  }

  for(var i = 0; i != rels.length; ++i) {
    var el = rels[i];
    if (el.getAttribute("src_project_id") == el.getAttribute("dest_project_id")
      && el.getAttribute("type") == 2) {
      ret.push({ id : el.getAttribute("id"),
        src_project_id : el.getAttribute("src_project_id"),
        dest_project_id : el.getAttribute("dest_project_id"),
        src_bug_id : el.getAttribute("src_bug_id"),
        dest_bug_id: el.getAttribute("dest_bug_id"),
        type: el.getAttribute("type"),
      });
    }
  }
  return ret;
};

function noIssuesWarning_rl() {
  var msg = document.getElementById("lang_no_relations_msg").getAttribute("value");
  msg = msg ? msg : "No relations between issues";
  var text = new createjs.Text(msg, COL_HEADER_FONT, BLUE_COLOR);
  text.x = 10;
  text.y = 10;
  m_mainPanel_rl.addChild(text);
};

function mapIssuesToRelations_rl(issues_raw, rels) {
  var mapIds = {};
  function checkId(element) {
    return element.id == this.id;
  };

  function mapIssuesToRels(item) {
    var src_id = item.src_bug_id.toString();
    var dest_id = item.dest_bug_id.toString();

    if (mapIds[src_id] == undefined) {
      mapIds[src_id] = issues_raw.find(checkId, {id : item.src_bug_id});
    }

    if (mapIds[dest_id] == undefined) {
      mapIds[dest_id] = issues_raw.find(checkId, {id : item.dest_bug_id});
    }

    item[src_id] = mapIds[src_id];
    item[dest_id] = mapIds[dest_id];
  };
  rels.forEach(mapIssuesToRels);
};

function createTrie_rl(rels) {
  var ret = [];

  var mappedIssuesWithRels = createMappedIsseuesWithRelations_rl(rels);

  function collectToTree(item) {
    if (item.inTree == undefined) {
      item.inTree = true;
      item.children.forEach(collectToTree);
    }
  };

  function extractFreeParents(item) {
    if (!mappedIssuesWithRels[item].isChild) {
      collectToTree(mappedIssuesWithRels[item]);
      ret.push(mappedIssuesWithRels[item]);
    }
  };
  Object.keys(mappedIssuesWithRels).forEach(extractFreeParents);

  function extractDependentParents(item) {
    if (mappedIssuesWithRels[item].inTree == undefined) {
      collectToTree(mappedIssuesWithRels[item]);
      ret.push(mappedIssuesWithRels[item]);
    }
  };
  Object.keys(mappedIssuesWithRels).forEach(extractDependentParents);

  return ret;
};

function createMappedIsseuesWithRelations_rl(rels) {
  var ret = {};

  function connectTrees(item) {
    var src_id = item.src_bug_id.toString();
    var dest_id = item.dest_bug_id.toString();

    if (ret[src_id] == undefined) {
      ret[src_id] = { issue : item[src_id], children : [], isChild : false };
    }

    if (ret[dest_id] == undefined) {
      ret[dest_id] = { issue : item[dest_id], children : [], isChild : false };
    }

    ret[src_id].children.push(ret[dest_id]);
    ret[dest_id].isChild = true;
  };

  rels.forEach(connectTrees);

  return ret;
};

function drawTrie_rl(trie, sizeOut) {
  var V_TRIE_OFFSET = 10;
  var H_TRIE_OFFSET = 10;
  var H_TREE_STEP = 80;
  var H_CARD_STEP = 50;
  var V_CARD_STEP = 10;
  var CARD_WIDTH = 200;

  for (var tree_i = 0; tree_i != trie.length; ++tree_i) {
    var rect_y = V_TRIE_OFFSET;

    function drawTree(item) {
      if (item.drawn_i == tree_i)
        return;

      var rect = {
        x : this.x,
        y : rect_y,
        width : CARD_WIDTH,
        height : 0
      };

      sizeOut.width = Math.max(sizeOut.width, this.x + rect.width);

      var onRollover = createCardOnRollover(m_mainPanel_rl, rect, item.issue);
      var onRollout = createCardOnRollout(m_mainPanel_rl);
      var card = createCard(rect, item.issue, false, null, null, null, onRollover, onRollout);
      m_mainPanel_rl.addChild(card);

      rect_y += rect.height + V_CARD_STEP;
      sizeOut.height = Math.max(sizeOut.height, rect_y);

      var strokeStyle = 2;
      if (this.connX != undefined)
      {
        var branchToParent = new createjs.Shape();
        branchToParent.graphics.beginStroke("#000000").setStrokeStyle(strokeStyle)
            .moveTo(this.connX, rect.y + rect.height / 2)
            .lineTo(rect.x, rect.y + rect.height / 2);
        m_mainPanel_rl.addChild(branchToParent);
        branchToParent = new createjs.Shape();
        branchToParent.graphics.beginStroke("#000000").setStrokeStyle(strokeStyle)
            .moveTo(this.connX, rect.y + rect.height / 2)
            .lineTo(this.connX, this.connY);
        m_mainPanel_rl.addChild(branchToParent);
      }

      item.drawn_i = tree_i;
      if (item.children.length != 0) {
        var h_offset = 10;
        var v_offset = 5;
        var x = rect.x + rect.width + h_offset;
        var blockedParentFound = false;
        function checkChildren(blocked) {
          if (blocked.drawn_i == tree_i)
          {
            blockedParentFound = true;
            var blockedParentNumber = createCardNumber(blocked.issue.id);
            blockedParentNumber.y = (rect.y + rect.height / 2) - blockedParentNumber.getBounds().height - v_offset;
            blockedParentNumber.x = x;
            x += blockedParentNumber.getBounds().width + h_offset;
            m_mainPanel_rl.addChild(blockedParentNumber);
          }
        };
        item.children.forEach(checkChildren);
        item.children.forEach(drawTree, { x : rect.x + H_CARD_STEP, connX : rect.x + H_CARD_STEP / 2, connY : rect.y + rect.height });

        if (blockedParentFound) {
          var branchToBlockedParent = new createjs.Shape();
          branchToBlockedParent.graphics.beginStroke("#000000").setStrokeStyle(strokeStyle)
            .moveTo(rect.x + rect.width, rect.y + rect.height / 2)
            .lineTo(x, rect.y + rect.height / 2);
          m_mainPanel_rl.addChild(branchToBlockedParent);
        }

        sizeOut.width = Math.max(sizeOut.width, x);
      }
    };

    drawTree.call({ x : sizeOut.width + (tree_i > 0 ? H_TREE_STEP : 0) + H_TRIE_OFFSET }, trie[tree_i]);
  }
};
