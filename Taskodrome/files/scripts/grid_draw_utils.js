var H_OFFSET = 0;
var V_OFFSET = 10;

var CARD_H_OFFSET = 10;
var CARD_V_OFFSET = 10;
var CARD_STROKE_COLOR = "#C0BFC1";
var CARD_FILL_COLOR = "#FFFFFF";

var CARD_SHADOW_COLOR = "#AFAFAF";
var CARD_SHADOW_X = 5;
var CARD_SHADOW_Y = 5;

var FONT_FAMILY = "sans-serif";
var FONT_COLOR = "#393939";
var FONT_SIZE = "10pt";
var FONT = FONT_SIZE + " " + FONT_FAMILY;

var BLUE_COLOR = "#428AC8";

var CARD_TEXT_H_OFFSET = 12;

var COL_HEADER_TEXT_OFFSET = 10;
var COL_HEADER_FONT_COLOR = "#FFFFFF";
var COL_HEADER_FONT_SIZE = "14pt";
var COL_HEADER_FONT = COL_HEADER_FONT_SIZE + " " + FONT_FAMILY;

var MAX_CANVAS_HEIGHT = 32767;

var MIN_COL_WIDTH = 200;

var POPUP_PAUSE = 600;

var COLUMN_DELIMITER_WIDTH = 1;
var VERSION_DELIMITER_WIDTH = 4;

var m_update = false;
var m_stageToUpdate;

var m_popupPause = 0;

function fullRedraw() {
  draw();
  sortIssues_st();
  draw_st();
};

function createTable(issues, cardDescArray, columnHeaders, panel, canvas, parentDiv, isStatusGrid, selectedCard, parentSize, onPressUp, showEmptyVersions, columnWidthOut, tableSchemeOut) {
  var colNumber = columnHeaders.length;
  var colSize = {
    width : 0,
    height : 0
  }
  colSize.width = Math.round((parentSize.width - 2 * H_OFFSET) / colNumber);
  if(colSize.width < MIN_COL_WIDTH) {
    colSize.width = MIN_COL_WIDTH;

    var tableWidth = colSize.width * colNumber + 2 * H_OFFSET;
    if(tableWidth > parentSize.width) {
      parentSize.width = tableWidth;
      canvas.width = tableWidth;
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

  var columns = createColumns(issues, columnHeaders, colSize, parentSize, tableSchemeOut);
  var oldColHeight = colSize.height;
  var cardCounts = [];
  var cards = createCards(panel, issues, cardDescArray, selectedCard, colNumber, cardSize, onPressUp, isStatusGrid, showEmptyVersions, colSize, tableSchemeOut, cardCounts);
  if(cards != null) {
    if(colSize.height > oldColHeight) {
      var add = colSize.height - oldColHeight;
      canvas.height += add;

      columns = createColumns(issues, columnHeaders, colSize, parentSize, tableSchemeOut);

      colSize.height += add;
      cardCounts.length = 0;
      cards = createCards(panel, issues, cardDescArray, selectedCard, colNumber, cardSize, onPressUp, isStatusGrid, showEmptyVersions, colSize, tableSchemeOut, cardCounts);
    }
  } else
    return null;

  panel.addChild(columns);

  for(var i = 0; i < cards.length; ++i) {
    panel.addChild(cards[i]);
  }

  var version_borders = createVersionBorders(tableSchemeOut, parentSize.width, cardCounts, showEmptyVersions);
  for(var i = 0; i != version_borders.length; ++i) {
    panel.addChild(version_borders[i]);
  }

  if (createjs.Ticker.hasEventListener("tick") == false) {
    createjs.Ticker.addEventListener("tick", tick);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
  }

  createScroller(canvas, parentDiv);
};

function createVersionBorders(tableScheme, parentWidth, cardCounts, showEmptyVersions) {
  var ret = [];
  var versionBorders = tableScheme.versionBorders;
  for (var i = 1, l = versionBorders.length; i < l; ++i) {
    if (!showEmptyVersions && cardCounts[i].no_cards_w_version)
    {
      continue;
    }

    var versionName = new createjs.Text(m_versions[i], "bold " + FONT, BLUE_COLOR);
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
      var cardsCount = new createjs.Text("(" + cardCounts[i][k - 1] + ")", FONT, BLUE_COLOR);
      var countBnds = cardsCount.getBounds();
      cardsCount.x = tableScheme.columnBorders[k] - COLUMN_DELIMITER_WIDTH / 2 - countBnds.width - 10;
      cardsCount.y = versionName.y;
      ret.push(cardsCount);
    }
  }
  return ret;
};

function createCards(panel, issues, cardDescArray, selectedCard, colNumber, cardSize, onPressUp, isStatusGrid, showEmptyVersions, colSizeOut, tableSchemeOut, cardCountsOut) {
  var textHeight = 10;
  cardDescArray.length = 0;
  tableSchemeOut.versionBorders.length = 0;

  var cards = [];
  var lower_edge = 0;
  var lower_edge_curr = 0;
  var onMousedown = createCardOnMousedown(panel, selectedCard, cardDescArray, issues);
  var onPressmove = createCardOnPressmove(panel, selectedCard);
  var onRollout = createCardOnRollout(panel);

  for(var v_i = 0, l = m_versions.length; v_i != l; ++v_i) {
    var start_y = tableSchemeOut.headerHeight + 2 * CARD_V_OFFSET + lower_edge;
    tableSchemeOut.versionBorders.push(start_y);
    cardCountsOut[v_i] = [];

    var no_cards_w_version = true;
    var ver = m_versions[v_i];
    for(var i = 0; i < colNumber; ++i) {
      var x = CARD_H_OFFSET + (H_OFFSET + i * colSizeOut.width);
      var y = start_y + ((lower_edge == 0) ? 0 : (2 * CARD_V_OFFSET + VERSION_DELIMITER_WIDTH / 2));
      cardCountsOut[v_i][i] = 0;

      var cardDescs = [];
      for(var k = 0, issuesNumber = issues[i].length; k < issuesNumber; ++k) {
        if (issues[i][k].version != ver)
          continue;

        var rect = {
          x : x,
          y : y,
          width : cardSize.width,
          height : cardSize.height
        };
        var onRollover = createCardOnRollover(panel, rect, issues[i][k]);

        var card = createCard(rect, issues[i][k], isStatusGrid, onMousedown, onPressmove, onPressUp, onRollover, onRollout);
        var newColHeight = y + rect.height;
        if (newColHeight > MAX_CANVAS_HEIGHT)
        {
          console.log("WARNING: Unable to show issue id " + issues[i][k].id + " due to canvas height exhaustion");
          break;
        }

        cards.push(card);

        if(newColHeight > colSizeOut.height) {
          colSizeOut.height = newColHeight;
        }

        y += rect.height + 2 * CARD_V_OFFSET;
        lower_edge_curr = Math.max(y, lower_edge_curr);

        CardDesc = {
          x : x,
          y : rect.y,
          issueGroupIndex : i,
          issueIndex : k
        }

        cardDescs.push(CardDesc);
        ++cardCountsOut[v_i][i];
        no_cards_w_version = false;
      }

      cardDescArray.push(cardDescs);
    }

    cardCountsOut[v_i].no_cards_w_version = no_cards_w_version;

    if (showEmptyVersions || !no_cards_w_version) {
      if (lower_edge_curr - lower_edge < 1.5 * cardSize.height)
      {
        lower_edge_curr = lower_edge + 1.5 * cardSize.height;
        colSizeOut.height = lower_edge + 1.5 * cardSize.height;
      }

      lower_edge = lower_edge_curr;
    }
  }

  return cards;
};

function createCard(rect, issue, isStatusGrid, onMousedown, onPressmove, onPressUp, onRollover, onRollout) {
  var card = new createjs.Container();

  var back = createRect(rect.width, rect.height, CARD_STROKE_COLOR, CARD_FILL_COLOR);

  var cardHeaderHeightOut = { value : -1 };
  var cardHeaderMarkColor = getColorByStatus(issue.status);
  var cardHeader = createCardHeader(issue.id, cardHeaderMarkColor, rect.width, issue.priorityCode, cardHeaderHeightOut);

  var y = cardHeaderHeightOut.value * 1.5;

  var assignee = null;
  if (isStatusGrid && issue.handler_id != 0) {
    assignee = createCardAssignee(issue.handler_id);
    assignee.y = y;
    y += assignee.getBounds().height * 1.5;
  }

  var summary = createCardSummary(issue.summary, rect.width);
  summary.y = y;
  var summaryHeight = summary.getBounds() ? summary.getBounds().height : 0;
  y += summaryHeight + 10;

  var updateTime = createCardUpdateTime(issue.updateTime);
  var updateTimeHeight = updateTime.getBounds().height;
  updateTime.y = y;

  if(summary.y + summaryHeight + updateTimeHeight + 20 > rect.height) {
    var add = summary.y + summaryHeight + updateTimeHeight + 20 - rect.height;
    rect.height += add;

    back = createRect(rect.width, rect.height, CARD_STROKE_COLOR, CARD_FILL_COLOR);
  }

  var shadowBack = createRect(rect.width, rect.height, "#00000000", "#000000");
  card.shadowBack = shadowBack;

  card.x = rect.x;
  card.y = rect.y;

  card.addChild(shadowBack);
  card.addChild(back);
  card.addChild(cardHeader);
  if (assignee) {
    card.addChild(assignee);
  }
  card.addChild(summary);
  card.addChild(updateTime);

  card.tickEnabled = false;

  if (onMousedown) {
    card.on("mousedown", onMousedown);
  }
  if (onPressmove) {
    card.on("pressmove", onPressmove);
  }
  if (onPressUp) {
    card.on("pressup", onPressUp);
  }
  if (onRollover) {
    card.on("rollover", onRollover);
  }
  if (onRollout) {
    card.on("rollout", onRollout);
  }

  return card;
};

function createCardOnMousedown(panel, selectedCard, cardDescArray, issues) {
  function OnMousedown(evt) {
    panel.removeChild(this);
    panel.addChild(this);

    var boolSuccess = false;
    var cardX = this.x;
    var cardY = this.y;
    selectedCard.mousePos.X = evt.stageX - this.x;
    selectedCard.mousePos.Y = evt.stageY - this.y;

    for(var i = 0; i < cardDescArray.length && !boolSuccess; ++i) {
      if(cardDescArray[i].length > 0 && cardDescArray[i][0].x == cardX) {
        for(var k = 0; k < cardDescArray[i].length && !boolSuccess; ++k) {
          if(cardDescArray[i][k].y == cardY) {
            boolSuccess = true;

            console.log("Found! issues array index = " + i + " issue index = " + k);
            console.log("cardX - " + cardX + ", cardY - " + cardY);

            var issueGroupIndex = cardDescArray[i][k].issueGroupIndex;
            var issueIndex = cardDescArray[i][k].issueIndex;

            selectedCard.value = issues[issueGroupIndex][issueIndex];
            selectedCard.sourceIndex = { i : issueGroupIndex, k : issueIndex };
          }
        }
      }
    }

    this.shadowBack.shadow = new createjs.Shadow(CARD_SHADOW_COLOR, CARD_SHADOW_X, CARD_SHADOW_Y, 8);

    if (m_popupCard != null) {
      panel.removeChild(m_popupCard);
      m_popupCard = null;
    }
  };

  return OnMousedown;
};

function createCardOnPressmove(panel, selectedCard) {
  function OnPressmove(evt) {
    this.x = evt.stageX - selectedCard.mousePos.X;
    this.y = evt.stageY - selectedCard.mousePos.Y;

    m_update = true;
    m_stageToUpdate = panel;
  };

  return OnPressmove;
};

function createCardOnRollover(panel, rect, issue) {
  function OnRollover(evt) {
    if (m_scrollTimer != null)
      return;

    m_popupCard = createPopupCard(evt.stageX, evt.stageY, rect.width, issue.description, issue.severity, issue.priority, issue.reproducibility, panel.canvas);
    m_popupPause = POPUP_PAUSE;
    m_stageToUpdate = panel;
  };

  return OnRollover;
};

function createCardOnRollout(panel) {
  function OnRollout(evt) {
    panel.removeChild(m_popupCard);
    m_popupCard = null;
    m_update = true;
  };

  return OnRollout;
};

function createPopupCard(x, y, cardWidth, descriptionText, severityText, priorityText, reproducibilityText, rootCanvas) {
  var card = new createjs.Container();
  var height = 0;
  var width = 0;
  var offset = 8;

  var maxWidth = getPopupMaxWidth(rootCanvas, cardWidth);

  var description = createHeaderTextPair(m_lang_report_details["description"] + ": ", descriptionText, 12 + offset, maxWidth - 2 * offset);
  description.x = offset;
  description.y = offset;
  width = description.getBounds().width + 2 * offset;
  height += description.getBounds().height + offset;

  var severity = createHeaderTextPair(m_lang_report_details["severity"] + ": ", severityText, 12 + offset);
  severity.x = offset;
  severity.y = Math.round(height);
  width = Math.max(severity.getBounds().width + 2 * offset, width);
  maxWidth = Math.max(severity.getBounds().width + 2 * offset, maxWidth);
  height += severity.getBounds().height;

  var priority = createHeaderTextPair(m_lang_report_details["priority"] + ": ", priorityText, 12 + offset);
  priority.x = offset;
  priority.y = Math.round(height);
  width = Math.max(priority.getBounds().width + 2 * offset, width);
  maxWidth = Math.max(priority.getBounds().width + 2 * offset, maxWidth);
  height += priority.getBounds().height;

  var reproducibility = createHeaderTextPair(m_lang_report_details["reproducibility"] + ": ", reproducibilityText, 12 + offset);
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

  var back = createRect(width, height, CARD_STROKE_COLOR, CARD_FILL_COLOR);

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

function createColumns(issues, columnNames, colSize, backSize, tableSchemeOut) {
  var columns = new createjs.Container();
  var number = columnNames.length;
  tableSchemeOut.columnBorders = [];

  var headerHeight = 0;
  var headerBack = new createjs.Shape();
  headerBack.graphics.beginStroke(BLUE_COLOR);
  headerBack.graphics.beginFill(BLUE_COLOR);
  columns.addChild(headerBack);
  var headerDelimOffset = 5;

  for(var i = 0; i <= number; ++i) {
    var startX = Math.round(H_OFFSET + i * colSize.width);
    tableSchemeOut.columnBorders.push(startX);

    var issueCounter = null;
    var x_offset_counter = 10;
    var issueCounterWidth = 0;
    if (i != number) {
      issueCounter = new createjs.Text("(" + issues[i].length + ")", COL_HEADER_FONT, COL_HEADER_FONT_COLOR);
      issueCounter.x = startX + colSize.width - issueCounter.getBounds().width - COLUMN_DELIMITER_WIDTH / 2 - x_offset_counter;
      issueCounter.y = V_OFFSET;
      issueCounterWidth = issueCounter.getBounds().width;
    }

    var columnNameText = columnNames[i];
    var targetWidth = colSize.width - COL_HEADER_TEXT_OFFSET -  issueCounterWidth - COLUMN_DELIMITER_WIDTH - x_offset_counter;
    var text = createShortenedText(columnNameText, targetWidth, COL_HEADER_FONT, COL_HEADER_FONT_COLOR, 1, true);
    text.x = startX + COL_HEADER_TEXT_OFFSET;
    text.y = V_OFFSET;

    if (headerHeight == 0 && text.getBounds()) {
      headerHeight = text.getBounds().height + 2 * V_OFFSET;
    }

    if (!(H_OFFSET == 0 && (i == 0 || i == number))) {
      var headerDelim = new createjs.Shape();
      headerDelim.graphics.setStrokeStyle(COLUMN_DELIMITER_WIDTH);
      headerDelim.graphics.beginStroke("#FFFFFF");
      headerDelim.graphics.moveTo(startX, headerDelimOffset);
      headerDelim.graphics.lineTo(startX, headerHeight - headerDelimOffset);

      var columnDelim = new createjs.Shape();
      columnDelim.graphics.setStrokeStyle(COLUMN_DELIMITER_WIDTH);
      columnDelim.graphics.beginStroke("#d2d1d3");
      columnDelim.graphics.moveTo(startX, headerHeight);
      columnDelim.graphics.lineTo(startX, colSize.height);

      columns.addChild(columnDelim);
      columns.addChild(headerDelim);
    }

    if (issueCounter != null) {
      columns.addChild(issueCounter);
    }
    columns.addChild(text);
  }

  headerBack.graphics.rect(0, 0, backSize.width, headerHeight);
  tableSchemeOut.headerHeight = headerHeight;

  columns.tickEnabled = false;

  return columns;
};

function createRect(width, height, strokeColor, fillColor) {
  var back = new createjs.Shape();
  back.graphics.setStrokeStyle(1);
  back.graphics.beginStroke(strokeColor);
  back.graphics.beginFill(fillColor);
  back.graphics.drawRect(0, 0, width, height);
  return back;
};

function createCardHeader(id, markColor, cardWidth, priorityCode, heightOut) {
  var cont = new createjs.Container();

  var number = createCardNumber(id);
  var height = number.getBounds().height * 2;
  heightOut.value = height;
  var numberWidth = number.getBounds().width;
  number.y = height / 4;

  var back = new createjs.Shape();
  back.graphics.setStrokeStyle(1);
  back.graphics.beginStroke("#c0bfc1");
  back.graphics.beginFill("#F9F9F9");
  back.graphics.drawRect(0, 0, cardWidth, height);

  var statusMark = new createjs.Shape();
  statusMark.graphics.setStrokeStyle(1);
  statusMark.graphics.beginStroke("#c0bfc1");
  statusMark.graphics.beginFill(markColor);
  var statusMarkHeight = Math.round(height / 2);
  statusMark.graphics.drawRoundRect(cardWidth - height, (height - statusMarkHeight) / 2, statusMarkHeight, statusMarkHeight, 1);

  var priorityMark = createPriorityMark(priorityCode, number.x + numberWidth, height);

  cont.addChild(back);
  cont.addChild(number);
  cont.addChild(statusMark);
  if (priorityMark) {
    cont.addChild(priorityMark);
  }
  return cont;
};

function createCardNumber(issueNumber) {
  var cont = new createjs.Container();
  var number = new createjs.Text(issueNumber, FONT, BLUE_COLOR);
  var numberBounds = number.getBounds();

  var underline = new createjs.Shape();
  underline.graphics.beginStroke(BLUE_COLOR).setStrokeStyle(1)
            .moveTo(number.x, number.y + numberBounds.height)
            .lineTo(number.x + numberBounds.width, number.y + numberBounds.height);

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
  cont.x = CARD_TEXT_H_OFFSET;

  return cont;
};

function createPriorityMark(priorityCode, h_offset, height)
{
  var path = "plugins/Taskodrome/files/assets/";
  switch (priorityCode) {
    case "20": path += "lower.png"; break;
    case "30": path += "minus.png"; break;
    case "40": path += "higher.png"; break;
    case "50": path += "arrow.png"; break;
    case "60": path += "danger.png"; break;
    default: return null;
  }

  var priorityMark = new createjs.Bitmap(path);
  if (!priorityMark) {
    console.error("Unable to load priorityMark bitmap");
    return null;
  }

  priorityMark.x = h_offset + 20;
  priorityMark.y = (height - 20) / 2;
  return priorityMark;
};

function onIssueIdPressup(event, issue) {
  var address = getPathToMantisFile(window, "view.php") + "?id=" + issue.id;
  window.open(address);
};

function createCardAssignee(issueHandlerId) {
  var assignee = new createjs.Text(m_nameToHandlerId[issueHandlerId], FONT, BLUE_COLOR);
  assignee.x = CARD_TEXT_H_OFFSET;
  return assignee;
};

function createCardSummary(issueText, width) {
  var summary = createShortenedText(issueText, width - 2 * CARD_TEXT_H_OFFSET, FONT, FONT_COLOR, 5);
  summary.x = CARD_TEXT_H_OFFSET;
  return summary;
};

function createShortenedText(text, lineWidth, font, font_color, step, is_single_line = false) {
  var textObj = new createjs.Text(text, font, font_color);
  textObj.lineWidth = is_single_line ? null : lineWidth;
  var textObjWidth = textObj.getBounds() ? textObj.getBounds().width : 0;

  while (textObjWidth > lineWidth) {
    text = text.substring(0, text.length - step);
    textObj.text = text + "...";
    textObjWidth = textObj.getBounds() ? textObj.getBounds().width : 0;
  }

  return textObj;
};

function createCardUpdateTime(updateTime) {
  var date = new Date(updateTime * 1000);
  var color = getTemperatureColor(updateTime);
  var time = new createjs.Text(date.toLocaleString(), FONT, color);
  time.x = CARD_TEXT_H_OFFSET;
  return time;
};

function tick(event) {
  if(m_update) {
    m_update = false;
    m_stageToUpdate.update();
  }

  if (m_popupCard != null) {
    if (m_scrollTimer != null) {
      m_stageToUpdate.removeChild(m_popupCard);
      m_popupCard = null;
      m_popupPause = -1;
    }

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
