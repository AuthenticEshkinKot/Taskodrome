var H_OFFSET = 20;
var V_OFFSET = 20;

var CARD_H_OFFSET = 15;
var CARD_V_OFFSET = 10;

var FONT_COLOR = "#000000"
var FONT_FAMILY = "Arial"
var FONT_SIZE = "12px"
var FONT = FONT_SIZE + " " + FONT_FAMILY;

var MIN_COL_WIDTH = 140;

var POPUP_PAUSE = 600;

var update = false;
var stageToUpdate;

var popupPause = 0;

var statusColorMap = [];

function fullRedraw() {
  draw();
  sortIssues_st();
  draw_st();
};

function createTable(issues, cardDescArray, columnHeaders, panel, panelName, gridName, selectedCardMousePos, selectedCard, selectedCardSourceIndex, columnWidth, parentWidth, width, height, onPressUp) {
  var colNumber = columnHeaders.length;
  var colWidth = (width - 2 * H_OFFSET) / colNumber;
  if(colWidth < MIN_COL_WIDTH) {
    colWidth = MIN_COL_WIDTH;

    var tableWidth = colWidth * colNumber + 2 * H_OFFSET;
    if(tableWidth > parentWidth.value) {
      width = tableWidth;
      parentWidth.value = tableWidth;
      document.getElementById(panelName).width = tableWidth;
    }
  }

  var colHeight = height - 2 * V_OFFSET;

  columnWidth.value = colWidth;

  if(colWidth <= 0 || colHeight <= 0) {
    return null;
  }

  var columns = createColumns(columnHeaders, colNumber, colWidth, colHeight);

  var ColParams = {
    width : colWidth,
    height : colHeight
  }

  var cardWidth = colWidth - 2 * CARD_H_OFFSET;
  var cardHeight = colHeight / 5 - 2 * CARD_V_OFFSET;

  if(cardWidth <= 0 || cardHeight <= 0) {
    return null;
  }

  var isStatusGrid = (gridName == "st-grid") ? true : false;

  var cards = createCards(panel, issues, cardDescArray, selectedCardMousePos, selectedCard, selectedCardSourceIndex, colNumber, cardWidth, cardHeight, ColParams, onPressUp, isStatusGrid);

  if(cards != null) {
    if(ColParams.height > colHeight) {
      var add = ColParams.height - colHeight;
      colHeight += add;
      document.getElementById(panelName).height += add;

      columns = createColumns(columnHeaders, colNumber, colWidth, colHeight);

      ColParams.height += add;
      cards = createCards(panel, issues, cardDescArray, selectedCardMousePos, selectedCard, selectedCardSourceIndex, colNumber, cardWidth, cardHeight, ColParams, onPressUp, isStatusGrid);

      height += add;
    }

    document.getElementById(gridName).style.height = (document.getElementById(panelName).height + V_PADDING_CORRECTION) + "px";
  } else
    return null;

  panel.addChild(columns);

  for(var i = 0; i < cards.length; ++i) {
    panel.addChild(cards[i]);
  }

  var outerLine = createOuterLine(width, height);
  panel.addChild(outerLine);

  if (createjs.Ticker.hasEventListener("tick") == false) {
    createjs.Ticker.addEventListener("tick", tick);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
  }
};

function createCards(panel, issues, cardDescArray, selectedCardMousePos, selectedCard, selectedCardSourceIndex, colNumber, cardWidth, cardHeight, colParams, onPressUp, isStatusGrid) {
  var textHeight = 10;
  cardDescArray.length = 0;

  var cards = [];

  for(var i = 0; i < colNumber; ++i) {
    var issuesNumber = issues[i].length;
    var x = CARD_H_OFFSET + (H_OFFSET + i * colParams.width);

    var cardDescs = [];
    var y = V_OFFSET + textHeight + CARD_V_OFFSET;

    for(var k = 0; k < issuesNumber; ++k) {
      position = {
        x : x,
        y : y,
        width : cardWidth,
        height : cardHeight
      }

      var card = createCard(panel, position, issues, issues[i][k], selectedCardMousePos, cardDescArray, selectedCard, selectedCardSourceIndex, onPressUp, isStatusGrid);
      cards.push(card);

      CardDesc = {
        x : x,
        y : position.y,
        issueGroupIndex : i,
        issueIndex : k
      }

      if(y + position.height > colParams.height) {
        colParams.height += y + position.height - colParams.height;
      }

      y += position.height + 2 * CARD_V_OFFSET;

      cardDescs.push(CardDesc);
    }

    cardDescArray.push(cardDescs);
  }

  return cards;
};

function createCard(panel, position, issues, issue, selectedCardMousePos, cardDescArray, selectedCard, selectedCardSourceIndex, onPressUp, isStatusGrid) {
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

  if(summary.y + summary.getBounds().height + 10 > position.height) {
    var add = summary.y + summary.getBounds().height + 10 - position.height;
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
    selectedCardMousePos.X = evt.stageX - card.x;
    selectedCardMousePos.Y = evt.stageY - card.y;

    for(var i = 0; i < cardDescArray.length && !boolSuccess; ++i) {
      if(cardDescArray[i].length > 0 && cardDescArray[i][0].x == cardX) {
        for(var k = 0; k < cardDescArray[i].length && !boolSuccess; ++k) {
          if(cardDescArray[i][k].y == cardY) {
            boolSuccess = true;

            selectedCard.value = issues[i][k];
            selectedCardSourceIndex.value = { i : i, k : k };

            //console.log("Found! issues array index = " + i + " issue index = " + k + " selectedCard.id = " + selectedCard.id);
          }
        }
      }
    }

    if (popupCard != null) {
      panel.removeChild(popupCard);
      popupCard = null;
    }
  };
  card.on("mousedown", cardOnMousedown);

  function cardOnPressmove(evt) {
    card.x = evt.stageX - selectedCardMousePos.X;
    card.y = evt.stageY - selectedCardMousePos.Y;

    update = true;
    stageToUpdate = panel;
  };
  card.on("pressmove", cardOnPressmove);

  card.on("pressup", onPressUp);

  function cardOnRollover(evt) {
    popupCard = createPopupCard(evt.stageX, evt.stageY, position.width, issue.description, issue.severity, issue.priority, issue.reproducibility, isStatusGrid);
    popupPause = POPUP_PAUSE;
    stageToUpdate = panel;
  };
  card.on("rollover", cardOnRollover);

  function cardOnRollout(evt) {
    panel.removeChild(popupCard);
    popupCard = null;
    update = true;
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
    rootCanvas = myPanel_st.canvas;
  }
  else
  {
    rootCanvas = myPanel.canvas;
  }

  var POPUP_MAX_WIDTH = Math.round(rootCanvas.width / 3.5);
  var maxWidth = Math.max(POPUP_MAX_WIDTH, cardWidth);

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

function createColumns(columnNames, number, width, height) {
  var columns = new createjs.Container();

  for(var i = 0; i <= number; ++i) {
    var startX = H_OFFSET + i * width;
    var line = new createjs.Shape();
    line.graphics.setStrokeStyle(2, 2);
    line.graphics.beginStroke(createjs.Graphics.getRGB(0,0,0));
    line.graphics.moveTo(startX, V_OFFSET);
    line.graphics.lineTo(startX, height + V_OFFSET);
    columns.addChild(line);

    var text = new createjs.Text(columnNames[i], FONT, FONT_COLOR);
    text.x = startX + width / 2;
    text.y = V_OFFSET;
    text.textAlign = "center";
    text.lineWidth = width;
    columns.addChild(text);
  }

  columns.tickEnabled = false;

  return columns;
};

function createCardBack(width, height) {
  var back = new createjs.Shape();
  back.graphics.setStrokeStyle(1);
  back.graphics.beginStroke("#000000");
  back.graphics.beginFill("#F0F5FF");
  back.graphics.drawRect(0, 0, width, height);
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
  var numberColor = "#0000FF";
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

  var pressup_listener = number.on("pressup", handleInteraction, null, false, { id : issueNumber });
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

function handleInteraction(event, data) {
  var address = getPathToMantisFile(window, "view.php") + "?id=" + data.id;
  window.open(address);
};

function createCardAssignee(issueHandlerId, width, markWidth) {
  var assignee = new createjs.Text(nameToHandlerId[issueHandlerId], FONT, FONT_COLOR);
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

  while (--sz != 7 && summary.getBounds().width > summary.lineWidth) {
    summary.font = sz + "px " + FONT_FAMILY;
  }

  return summary;
};

function createOuterLine(width, height) {
  var line = new createjs.Shape();
  line.graphics.setStrokeStyle(2, 2);
  line.graphics.beginStroke(createjs.Graphics.getRGB(255,0,0));
  line.graphics.moveTo(0, 0);
  line.graphics.lineTo(0, height);
  line.graphics.lineTo(width, height);
  line.graphics.lineTo(width, 0);
  line.graphics.lineTo(0, 0);
  line.tickEnabled = false;
  return line;
};

function tick(event) {
  if(update) {
    update = false;
    stageToUpdate.update();
  }

  if (popupCard != null) {
    if (popupPause == 0) {
      stageToUpdate.addChild(popupCard);
      update = true;
      popupPause = -1;
    } else if (popupPause > 0) {
      popupPause -= Math.min(event.delta, popupPause);
    }
  }
};

function getColorByStatus(issueStatus) {
  return statusColorMap[issueStatus];
};
