var H_OFFSET = 20;
var V_OFFSET = 20;

var CARD_H_OFFSET = 15;
var CARD_V_OFFSET = 10;

var FONT_COLOR = "#393939"
var FONT_FAMILY = "Open Sans"
var FONT_SIZE = "12px"
var FONT = FONT_SIZE + " " + FONT_FAMILY;

var MIN_COL_WIDTH = 140;

var POPUP_PAUSE = 600;

var COLUMN_DELIMITER_WIDTH = 2;
var VERSION_DELIMITER_WIDTH = 4;

var m_update = false;
var m_stageToUpdate;

var m_popupPause = 0;

function fullRedraw() {
  draw();
  sortIssues_st();
  draw_st();
};

function createTable(issues, cardDescArray, columnHeaders, panel, panelName, isStatusGrid, selectedCard, parentSize, onPressUp, columnWidthOut, tableSchemeOut) {
  var colNumber = columnHeaders.length;
  var colSize = {
    width : 0,
    height : 0
  }
  colSize.width = (parentSize.width - 2 * H_OFFSET) / colNumber;
  if(colSize.width < MIN_COL_WIDTH) {
    colSize.width = MIN_COL_WIDTH;

    var tableWidth = colSize.width * colNumber + 2 * H_OFFSET;
    if(tableWidth > parentSize.width) {
      parentSize.width = tableWidth;
      document.getElementById(panelName).width = tableWidth;
    }
  }

  columnWidthOut.value = colSize.width;

  colSize.height = parentSize.height - 2 * V_OFFSET;

  if(colSize.width <= 0 || colSize.height <= 0) {
    return null;
  }

  var cardSize = { width : colSize.width - 2 * CARD_H_OFFSET,
                   height : colSize.height / 5 - 2 * CARD_V_OFFSET };

  if(cardSize.width <= 0 || cardSize.height <= 0) {
    return null;
  }

  var columns = createColumns(issues, columnHeaders, colSize, tableSchemeOut);
  var oldColHeight = colSize.height;
  var cardCounts = [];
  var cards = createCards(panel, issues, cardDescArray, selectedCard, colNumber, cardSize, onPressUp, isStatusGrid, colSize, tableSchemeOut, cardCounts);
  if(cards != null) {
    if(colSize.height > oldColHeight) {
      var add = colSize.height - oldColHeight;
      document.getElementById(panelName).height += add;

      columns = createColumns(issues, columnHeaders, colSize, tableSchemeOut);

      colSize.height += add;
      cardCounts.length = 0;
      cards = createCards(panel, issues, cardDescArray, selectedCard, colNumber, cardSize, onPressUp, isStatusGrid, colSize, tableSchemeOut, cardCounts);
    }
  } else
    return null;

  panel.addChild(columns);

  for(var i = 0; i < cards.length; ++i) {
    panel.addChild(cards[i]);
  }

  var version_borders = createVersionBorders(tableSchemeOut, parentSize.width, cardCounts);
  for(var i = 0; i != version_borders.length; ++i) {
    panel.addChild(version_borders[i]);
  }

  if (createjs.Ticker.hasEventListener("tick") == false) {
    createjs.Ticker.addEventListener("tick", tick);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
  }
};

function createVersionBorders(tableScheme, parentWidth, cardCounts) {
  var ret = [];
  var versionBorders = tableScheme.versionBorders;
  for (var i = 1, l = versionBorders.length; i < l; ++i) {
    var versionName = new createjs.Text(m_versions[i], "bold " + FONT, "#4C8FBD");
    var versionBnds = versionName.getBounds();
    versionName.x = tableScheme.columnBorders[0] + 1 + COLUMN_DELIMITER_WIDTH / 2;
    versionName.y = versionBorders[i] - versionBnds.height - VERSION_DELIMITER_WIDTH / 2;
    ret.push(versionName);
    var line = new createjs.Shape();
    line.graphics.setStrokeStyle(VERSION_DELIMITER_WIDTH);
    line.graphics.beginStroke("#bfd5e1");
    line.graphics.moveTo(tableScheme.columnBorders[0], versionBorders[i]);
    line.graphics.lineTo(tableScheme.columnBorders[tableScheme.columnBorders.length - 1], versionBorders[i]);
    ret.push(line);

    for (var k = 1, l_k = tableScheme.columnBorders.length; k < l_k; ++k) {
      var cardsCount = new createjs.Text("(" + cardCounts[i][k - 1] + ")", FONT, "#000000");
      var countBnds = cardsCount.getBounds();
      cardsCount.x = tableScheme.columnBorders[k] - COLUMN_DELIMITER_WIDTH / 2 - countBnds.width - 10;
      cardsCount.y = versionName.y;
      ret.push(cardsCount);
    }
  }
  return ret;
};

function createCards(panel, issues, cardDescArray, selectedCard, colNumber, cardSize, onPressUp, isStatusGrid, colSizeOut, tableSchemeOut, cardCountsOut) {
  var textHeight = 10;
  cardDescArray.length = 0;
  tableSchemeOut.versionBorders.length = 0;

  var cards = [];
  var lower_edge = 0;
  var lower_edge_curr = 0;

  for(var v_i = 0, l = m_versions.length; v_i != l; ++v_i) {
    var start_y = V_OFFSET + textHeight + CARD_V_OFFSET + lower_edge;
    tableSchemeOut.versionBorders.push(start_y);
    cardCountsOut[v_i] = [];

    var ver = m_versions[v_i];
    for(var i = 0; i < colNumber; ++i) {
      var x = CARD_H_OFFSET + (H_OFFSET + i * colSizeOut.width);
      var y = start_y + ((lower_edge == 0) ? 0 : VERSION_DELIMITER_WIDTH);
      cardCountsOut[v_i][i] = 0;

      var cardDescs = [];
      for(var k = 0, issuesNumber = issues[i].length; k < issuesNumber; ++k) {
        if (issues[i][k].version != ver)
          continue;

        position = {
          x : x,
          y : y,
          width : cardSize.width,
          height : cardSize.height
        }

        var card = createCard(panel, position, issues, issues[i][k], selectedCard, cardDescArray, onPressUp, isStatusGrid);
        cards.push(card);

        CardDesc = {
          x : x,
          y : position.y,
          issueGroupIndex : i,
          issueIndex : k
        }

        if(y + position.height > colSizeOut.height) {
          colSizeOut.height += y + position.height - colSizeOut.height;
        }

        y += position.height + 2 * CARD_V_OFFSET;
        lower_edge_curr = Math.max(y, lower_edge_curr);

        cardDescs.push(CardDesc);
        ++cardCountsOut[v_i][i];
      }

      cardDescArray.push(cardDescs);
    }

    if (lower_edge == lower_edge_curr)
    {
      lower_edge_curr += cardSize.height;
      colSizeOut.height += cardSize.height;
    }

    lower_edge = lower_edge_curr;
  }

  return cards;
};

function createCard(panel, position, issues, issue, selectedCard, cardDescArray, onPressUp, isStatusGrid) {
  var card = new createjs.Container();

  var back = createCardBack(position.width, position.height);

  var markWidth = 6;

  issue.topColor = getColorByStatus(issue.status);
  issue.bottomColor = getTemperatureColor(issue.updateTime);

  var topMark = createCardTopMark(issue.topColor, position.width, markWidth);
  var bottomMark = createCardBottomMark(issue.bottomColor, position.width, position.height, markWidth);
  var number = createCardNumber(issue.id, position.width, markWidth);
  var assignee = null;
  if (isStatusGrid) {
    assignee = createCardAssignee(issue.handler_id, position.width, markWidth);
  }

  var summary = createCardSummary(issue.summary, position.width, markWidth, number);
  var summaryHeight = summary.getBounds() ? summary.getBounds().height : 0;

  if(summary.y + summaryHeight + 10 > position.height) {
    var add = summary.y + summaryHeight + 10 - position.height;
    position.height += add;

    back = createCardBack(position.width, position.height);
    topMark = createCardTopMark(issue.topColor, position.width, markWidth);
    bottomMark = createCardBottomMark(issue.bottomColor, position.width, position.height, markWidth);
  }

  function cardOnMousedown(evt) {
    //console.log("mousedown");
    //console.log("mouse X = " + evt.stageX);
    //console.log("mouse Y = " + evt.stageY);

    panel.removeChild(card);
    panel.addChild(card);

    var boolSuccess = false;
    var cardX = card.x;
    var cardY = card.y;
    selectedCard.mousePos.X = evt.stageX - card.x;
    selectedCard.mousePos.Y = evt.stageY - card.y;

    for(var i = 0; i < cardDescArray.length && !boolSuccess; ++i) {
      if(cardDescArray[i].length > 0 && cardDescArray[i][0].x == cardX) {
        for(var k = 0; k < cardDescArray[i].length && !boolSuccess; ++k) {
          if(cardDescArray[i][k].y == cardY) {
            boolSuccess = true;

            console.log("Found! issues array index = " + i + " issue index = " + k + " selectedCard.id = " + selectedCard.id);
            console.log("cardX - " + cardX + ", cardY - " + cardY);

            issueGroupIndex = cardDescArray[i][k].issueGroupIndex;
            issueIndex = cardDescArray[i][k].issueIndex;

            selectedCard.value = issues[issueGroupIndex][issueIndex];
            selectedCard.sourceIndex = { i : issueGroupIndex, k : issueIndex };
          }
        }
      }
    }

    if (m_popupCard != null) {
      panel.removeChild(m_popupCard);
      m_popupCard = null;
    }
  };
  card.on("mousedown", cardOnMousedown);

  function cardOnPressmove(evt) {
    card.x = evt.stageX - selectedCard.mousePos.X;
    card.y = evt.stageY - selectedCard.mousePos.Y;

    m_update = true;
    m_stageToUpdate = panel;
  };
  card.on("pressmove", cardOnPressmove);

  card.on("pressup", onPressUp);

  function cardOnRollover(evt) {
    m_popupCard = createPopupCard(evt.stageX, evt.stageY, position.width, issue.description, issue.severity, issue.priority, issue.reproducibility, isStatusGrid);
    m_popupPause = POPUP_PAUSE;
    m_stageToUpdate = panel;
  };
  card.on("rollover", cardOnRollover);

  function cardOnRollout(evt) {
    panel.removeChild(m_popupCard);
    m_popupCard = null;
    m_update = true;
  };
  card.on("rollout", cardOnRollout);

  card.x = position.x;
  card.y = position.y;

  card.addChild(back);
  card.addChild(topMark);
  card.addChild(bottomMark);
  card.addChild(number);
  if (isStatusGrid) {
    card.addChild(assignee);
  }
  card.addChild(summary);

  card.tickEnabled = false;

  return card;
};

function createPopupCard(x, y, cardWidth, descriptionText, severityText, priorityText, reproducibilityText, isStatusGrid) {
  var card = new createjs.Container();
  var height = 0;
  var width = 0;
  var offset = 8;

  var rootCanvas;
  if (isStatusGrid)
  {
    rootCanvas = m_mainPanel_st.canvas;
  }
  else
  {
    rootCanvas = m_mainPanel.canvas;
  }

  var maxWidth = getPopupMaxWidth(rootCanvas, cardWidth);

  var description = createHeaderTextPair("Description: ", descriptionText, 12 + offset, maxWidth - 2 * offset);
  description.x = offset;
  description.y = offset;
  width = description.getBounds().width + 2 * offset;
  height += description.getBounds().height + offset;

  var severity = createHeaderTextPair("Severity: ", severityText, 12 + offset);
  severity.x = offset;
  severity.y = Math.round(height);
  width = Math.max(severity.getBounds().width + 2 * offset, width);
  maxWidth = Math.max(severity.getBounds().width + 2 * offset, maxWidth);
  height += severity.getBounds().height;

  var priority = createHeaderTextPair("Priority: ", priorityText, 12 + offset);
  priority.x = offset;
  priority.y = Math.round(height);
  width = Math.max(priority.getBounds().width + 2 * offset, width);
  maxWidth = Math.max(priority.getBounds().width + 2 * offset, maxWidth);
  height += priority.getBounds().height;

  var reproducibility = createHeaderTextPair("Reproducibility: ", reproducibilityText, 12 + offset);
  reproducibility.x = offset;
  reproducibility.y = Math.round(height);
  width = Math.max(reproducibility.getBounds().width + 2 * offset, width);
  maxWidth = Math.max(reproducibility.getBounds().width + 2 * offset, maxWidth);
  height += reproducibility.getBounds().height;

  if (width > maxWidth)
  {
    height -= description.getBounds().height;

    description = createHeaderTextPair("Description: ", descriptionText, 12 + offset, width - 2 * offset);
    description.x = offset;
    description.y = offset;
    width = Math.max(description.getBounds().width + 2 * offset, width);
    height += description.getBounds().height;
  }

  var back = createCardBack(width, height);

  card.addChild(back);
  card.addChild(description);
  card.addChild(severity);
  card.addChild(priority);
  card.addChild(reproducibility);

  card.x = Math.min(rootCanvas.width - width - 2, x);
  card.y = Math.min(rootCanvas.height - height - 2, y);

  card.tickEnabled = false;
  card.mouseEnabled = false;

  return card;
};

function getPopupMaxWidth(rootCanvas, cardWidth) {
  var popupMaxWidth = Math.round(rootCanvas.width / 3.5);
  return Math.max(popupMaxWidth, cardWidth);
};

function createHeaderTextPair(header, text, lineHeigth, maxLineWidth) {
  var res = new createjs.Container();

  var headerC = new createjs.Text(header, "bold " + FONT, FONT_COLOR);
  headerC.lineHeight = lineHeigth;

  var textC = new createjs.Text(text, FONT, FONT_COLOR);
  headerC.lineHeight = lineHeigth;
  var headerWidth = headerC.getBounds().width;
  textC.x = headerWidth;
  textC.lineHeight = lineHeigth;
  textC.lineWidth = maxLineWidth - headerWidth;

  res.addChild(headerC);
  res.addChild(textC);

  return res;
};

function createColumns(issues, columnNames, colSize, tableSchemeOut) {
  var columns = new createjs.Container();
  var number = columnNames.length;
  tableSchemeOut.columnBorders = [];

  for(var i = 0; i <= number; ++i) {
    var startX = Math.round(H_OFFSET + i * colSize.width);
    tableSchemeOut.columnBorders.push(startX);
    var line = new createjs.Shape();
    line.graphics.setStrokeStyle(COLUMN_DELIMITER_WIDTH);
    line.graphics.beginStroke("#b3cbd8");
    line.graphics.moveTo(startX, V_OFFSET);
    line.graphics.lineTo(startX, colSize.height + V_OFFSET);
    columns.addChild(line);

    var columnNameText = columnNames[i];
    if (columnNameText && columnNameText != " " && i != number) {
      columnNameText += " (" + issues[i].length + ")";
    }
    var text = new createjs.Text(columnNameText, FONT, FONT_COLOR);
    text.x = startX + colSize.width / 2;
    text.y = V_OFFSET;
    text.textAlign = "center";
    text.lineWidth = colSize.width;
    columns.addChild(text);
  }

  columns.tickEnabled = false;

  return columns;
};

function createCardBack(width, height) {
  var back = new createjs.Shape();
  back.graphics.setStrokeStyle(1);
  back.graphics.beginStroke("#bfd5e1");
  back.graphics.beginFill("#F0F5FF");
  back.graphics.drawRoundRect(0, 0, width, height, 3, 3 ,3, 3);
  return back;
};

function createCardTopMark(markColor, cardWidth, markWidth) {
  var mark = new createjs.Shape();
  mark.graphics.setStrokeStyle(1);
  mark.graphics.beginStroke(markColor);
  mark.graphics.beginFill(markColor);
  mark.graphics.drawRect(1, 1, cardWidth - 2, markWidth);
  return mark;
};

function createCardBottomMark(markColor, cardWidth, cardHeight, markWidth) {
  var mark = new createjs.Shape();
  mark.graphics.setStrokeStyle(1);
  mark.graphics.beginStroke(markColor);
  mark.graphics.beginFill(markColor);
  mark.graphics.drawRect(1, cardHeight - 1 - markWidth, cardWidth - 2, markWidth);
  return mark;
};

function createCardNumber(issueNumber, width, markWidth) {
  var cont = new createjs.Container();
  var numberColor = "#4C8FBD";
  var number = new createjs.Text(issueNumber, FONT, numberColor);
  number.x = width - number.getBounds().width - 5;
  number.y += markWidth + 3;

  var underline = new createjs.Shape();
  underline.graphics.beginStroke(numberColor).setStrokeStyle(1)
            .moveTo(number.x, number.y + number.getMeasuredHeight() + 1)
            .lineTo(number.x + number.getMeasuredWidth(), number.y + number.getMeasuredHeight() + 1);

  var hit = new createjs.Shape();
  var ext = 5;
  hit.graphics.beginFill("#000")
              .drawRect(-ext, -ext, 2 * ext + number.getMeasuredWidth(), 2 * ext + number.getMeasuredHeight());
  number.hitArea = hit;

  var pressup_listener = number.on("pressup", onIssueIdPressup, null, false, { id : issueNumber });
  function save_crd(evt) {
    number.startX = evt.stageX;
    number.startY = evt.stageY;
  };
  number.on("mousedown", save_crd);

  function off(evt) {
    if (Math.abs(evt.stageX - number.startX) > 2 || Math.abs(evt.stageY - number.startY) > 2) {
      number.off("pressup", pressup_listener);
      number.off("pressmove", pressmove_listener);
    }
  };
  var pressmove_listener = number.on("pressmove", off);

  cont.addChild(number);
  cont.addChild(underline);

  return cont;
};

function onIssueIdPressup(event, issue) {
  var address = getPathToMantisFile(window, "view.php") + "?id=" + issue.id;
  window.open(address);
};

function createCardAssignee(issueHandlerId, width, markWidth) {
  var assignee = new createjs.Text(m_nameToHandlerId[issueHandlerId], FONT, FONT_COLOR);
  assignee.x = 5;
  assignee.y += markWidth + 3;
  return assignee;
};

function createCardSummary(issueText, width, markWidth, number) {
  var sz = 12;
  var summary = new createjs.Text(issueText, sz + "px " + FONT_FAMILY, FONT_COLOR);
  summary.x = width / 2;
  summary.textAlign = "center";
  summary.lineWidth = width - 4;
  summary.y = 2 * number.getBounds().height + markWidth;
  var summaryWidth = summary.getBounds() ? summary.getBounds().width : 0;

  while (--sz != 7 && summaryWidth > summary.lineWidth) {
    summary.font = sz + "px " + FONT_FAMILY;
  }

  return summary;
};

function tick(event) {
  if(m_update) {
    m_update = false;
    m_stageToUpdate.update();
  }

  if (m_popupCard != null) {
    if (m_popupPause == 0) {
      m_stageToUpdate.addChild(m_popupCard);
      m_update = true;
      m_popupPause = -1;
    } else if (m_popupPause > 0) {
      m_popupPause -= Math.min(event.delta, m_popupPause);
    }
  }
};

function getColorByStatus(issueStatus) {
  return m_status_color_map[issueStatus];
};
