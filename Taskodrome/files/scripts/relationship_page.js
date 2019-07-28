var RelPage = (function() {
  var m_inst = null;

  var m_page = null;
  var m_columnHandler = null;
  var m_scrollbarV = null;
  var m_scrollbarH = null;

  var m_size = new Size(0, 0);
  var m_pos = new Position(0, 0);
  var m_cards = [];
  var m_lines = [];

  function init() {
    m_page = new Page("canvas_rl", "tab_c3");
    m_scrollbarV = new ScrollbarV(this, m_page);
    m_scrollbarH = new ScrollbarH(this, m_page);
    m_columnHandler = new ColumnHandler([], m_page.getCanvas().getWidth());

    drawRelations();

    m_scrollbarV.draw(m_size.m_height, 0);
    m_scrollbarV.show();

    m_scrollbarH.draw(m_size.m_width);
    m_scrollbarH.show();

    document.getElementById("tab_c3").addEventListener("wheel", WheelScroll);
    document.addEventListener("keydown", Keydown);

    addRadioCallback(window, "rg", "radio_rg");
  };

  function drawRelations() {
    if (DataSource.Inst().Relations().length == 0) {
      noIssuesWarning_rl();
      return;
    }

    mapIssuesToRelations();
    var trie = createTrie();
    console.log("Trie:");
    console.log(trie);
    drawTrie_rl(trie);
  };

  function noIssuesWarning_rl() {
    var msg = document.getElementById("lang_no_relations_msg").getAttribute("value");
    msg = msg ? msg : "No relations between issues";
    var text = new fabric.Text(msg, {
      fontFamily: "Arial",
      fontSize: fabric.util.parseUnit("14px"),
      fill: "#428AC8",

      left: 10,
      top: 10,

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });
    m_page.getCanvas().add(text);
  };

  function mapIssuesToRelations() {
    var mapIds = {};
    function checkId(element) {
      return element.id == this.id;
    };

    function mapIssuesToRels(item) {
      var src_id = item.src_bug_id.toString();
      var dest_id = item.dest_bug_id.toString();

      if (mapIds[src_id] == undefined) {
        mapIds[src_id] = DataSource.Inst().IssuesRaw().find(checkId, {id : item.src_bug_id});
      }

      if (mapIds[dest_id] == undefined) {
        mapIds[dest_id] = DataSource.Inst().IssuesRaw().find(checkId, {id : item.dest_bug_id});
      }

      item[src_id] = mapIds[src_id];
      item[dest_id] = mapIds[dest_id];
    };
    DataSource.Inst().Relations().forEach(mapIssuesToRels);
  };

  function createTrie() {
    var ret = [];

    var mappedIssuesWithRels = createMappedIsseuesWithRelations();

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

  function createMappedIsseuesWithRelations() {
    var ret = {};

    function connectTrees(item) {
      var src_id = item.src_bug_id.toString();
      var dest_id = item.dest_bug_id.toString();

      if (item[src_id] == undefined || item[dest_id] == undefined)
        return;

      if (ret[src_id] == undefined) {
        ret[src_id] = { issue : item[src_id], children : [], isChild : false };
      }

      if (ret[dest_id] == undefined) {
        ret[dest_id] = { issue : item[dest_id], children : [], isChild : false };
      }

      ret[src_id].children.push(ret[dest_id]);
      ret[dest_id].isChild = true;
    };

    DataSource.Inst().Relations().forEach(connectTrees);

    return ret;
  };

  function drawTrie_rl(trie) {
    var V_TRIE_OFFSET = 10;
    var H_TRIE_OFFSET = 10;
    var H_TREE_STEP = 10;
    var H_CARD_STEP = 30;

    for (var tree_i = 0; tree_i != trie.length; ++tree_i) {
      var rect_y = 0;

      var drawTree = function drawTreeFunc(item) {
        if (item.drawn_i == tree_i)
          return;

        var rect = {
          x : this.x,
          y : rect_y,
          width : 0,
          height : 0
        };

        var card = new Card(item.issue.id, DataSource.Inst().UserName(item.issue.handler_id), item.issue.version, item.issue.summary, item.issue.description, item.issue.severity, item.issue.priority, item.issue.priorityCode, item.issue.reproducibility, item.issue.updateTime, item.issue.status, 
          false,
          null, m_columnHandler, m_page);
        card.draw();
        card.setPos(new Position(rect.x, rect.y));
        card.show();
        m_cards.push(card);
        m_size.m_width = Math.max(m_size.m_width, rect.x + card.m_bounds.right - card.m_bounds.left);

        rect.x += card.getLeftOffset();
        rect.height = card.m_bounds.bottom - card.m_bounds.top;
        rect.width = card.m_bounds.right - card.getRightOffset() - card.m_bounds.left - card.getLeftOffset();
        rect_y += rect.height;
        m_size.m_height = Math.max(m_size.m_height, rect_y);

        var strokeStyle = 2;
        if (this.connX != undefined)
        {
          var branchToParent = new fabric.Line([this.connX, rect.y + Math.round(rect.height / 2), rect.x, rect.y + Math.round(rect.height / 2)], {
            strokeWidth: strokeStyle,
            stroke: "#000000",

            evented: false,
            hasBorders: false,
            hasControls: false,
            selectable: false
          });
          m_page.getCanvas().add(branchToParent);
          m_lines.push(branchToParent);

          branchToParent = new fabric.Line([this.connX, rect.y + Math.round(rect.height / 2), this.connX, this.connY], {
            strokeWidth: strokeStyle,
            stroke: "#000000",

            evented: false,
            hasBorders: false,
            hasControls: false,
            selectable: false
          });
          m_page.getCanvas().add(branchToParent);
          m_lines.push(branchToParent);
        }

        item.drawn_i = tree_i;
        if (item.children.length != 0) {
          var h_offset = 10;
          var v_offset = 5;
          var x = rect.x + rect.width + h_offset;
          var blockedParentFound = false;
          var checkChildren = function checkChildrenFunc(blocked) {
            if (blocked.drawn_i == tree_i)
            {
              blockedParentFound = true;
              var number = new fabric.Text(blocked.issue.id.toString(), {
                fontFamily: "Arial",
                fontSize: fabric.util.parseUnit("12px"),
                fill: "#428AC8",
                underline: true,

                left: x,

                hasBorders: false,
                hasControls: false,
                selectable: false
              });
              var onMouseUp = function onMouseUpFunc() {
                var address = getPathToMantisFile(window, "view.php") + "?id=" + blocked.issue.id;
                window.open(address);
              };
              number.on("mouseup", onMouseUp);
              number.top = (rect.y + Math.round(rect.height / 2)) - Math.round(number.getScaledHeight()) - v_offset;
              number.setCoords();
              x += Math.round(number.getScaledWidth()) + h_offset;
              m_page.getCanvas().add(number);
              m_lines.push(number);
            }
          };
          item.children.forEach(checkChildren);
          item.children.forEach(drawTree, { x : rect.x + H_CARD_STEP, connX : rect.x + H_CARD_STEP / 2, connY : rect.y + rect.height });

          if (blockedParentFound) {
            var branchToBlockedParent = new fabric.Line([rect.x + rect.width, rect.y + Math.round(rect.height / 2), x, rect.y + Math.round(rect.height / 2)], {
              strokeWidth: strokeStyle,
              stroke: "#000000",

              evented: false,
              hasBorders: false,
              hasControls: false,
              selectable: false
            });
            m_page.getCanvas().add(branchToBlockedParent);
            m_lines.push(branchToBlockedParent);
          }

          m_size.m_width = Math.max(m_size.m_width, x);
        }
      };

      drawTree.call({ x : m_size.m_width + (tree_i > 0 ? H_TREE_STEP : 0) + H_TRIE_OFFSET }, trie[tree_i]);
    }

    m_size.m_height += V_TRIE_OFFSET;
  };

  var UpdateCard = function(/** @type {Card} */newCard) {
    for (var i = 0; i != m_cards.length; ++i) {
      if (newCard.getId() == m_cards[i].getId()) {
        m_cards[i].setStatus(newCard.getStatus());
        m_cards[i].setUpdateTime(newCard.getUpdateTime());
      }
    }
  };

  this.barScroll = function(h, v) {
    if (h != 0) {
      return scrollH(h);
    }

    if (v != 0) {
      return scrollV(v);
    }
  };

  var WheelScroll = function(evt) {
    var v = (evt.deltaY < 0 ? 24 : -24);
    scrollV(v);
  };

  function scrollV(v) {
    if (v > 0) {
      v = Math.min(v, -m_pos.m_top);
    } else {
      v = Math.max(v, Math.min(0, m_page.getCanvas().getHeight() - (m_pos.m_top + m_size.m_height)));
    }

    m_pos.m_top += v;

    function scrollCard(card) {
      card.move(0, v);
    };
    m_cards.forEach(scrollCard);

    m_scrollbarV.scroll(-v);

    function scrollLine(line) {
      line.top += v;
      line.setCoords();
    };
    m_lines.forEach(scrollLine);

    m_page.getCanvas().requestRenderAll();

    return v;
  };

  var CreateInst = function() {
    init();
    return {
      UpdateCard: UpdateCard
    };
  };

  var Keydown = function(evt) {
    var h = 0;
    switch (evt.key)
    {
      case ("ArrowLeft"): h = 8; break;
      case ("ArrowRight"): h = -8; break;
      default: return;
    }
    scrollH(h);
  };

  function scrollH(h) {
    if (h > 0) {
      h = Math.min(h, -m_pos.m_left);
    } else {
      h = Math.max(h, Math.min(0, m_page.getCanvas().getWidth() - (m_pos.m_left + m_size.m_width)));
    }

    m_pos.m_left += h;

    function scrollCard(card) {
      card.move(h, 0);
    };
    m_cards.forEach(scrollCard);

    m_scrollbarH.scroll(-h);

    function scrollLine(line) {
      line.left += h;
      line.setCoords();
    };
    m_lines.forEach(scrollLine);

    m_page.getCanvas().requestRenderAll();

    return h;
  };

  return {
    Inst: function () {
      return m_inst || (m_inst = CreateInst());
    }
  };
})();
