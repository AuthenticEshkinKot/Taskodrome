var H_OFFSET = 20;
var V_OFFSET = 20;

var MIN_COL_WIDTH = 140;

var update = false;
var stageToUpdate;

function fullRedraw() {
  draw();
  sortIssues_st();
  draw_st();
}

function createTable(issues, cardDescArray, columnHeaders, panel, panelName, gridName, selectedCardMousePos, selectedCard, selectedCardSourceIndex, columnWidth, parentWidth, width, height, onPressUp) {
	var colNumber = issues.length;
	var colWidth = (width - 2 * H_OFFSET) / colNumber;
	if(colWidth < MIN_COL_WIDTH) {
		colWidth = MIN_COL_WIDTH;
		
		var tableWidth = colWidth * colNumber + 2 * H_OFFSET;
		if(tableWidth > parentWidth.value)
		{
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
	
	var cardHorOffset = 15;
	var cardVerOffset = 10;	
	
	var cardWidth = colWidth - 2 * cardHorOffset;
	var cardHeight = colHeight / 5 - 2 * cardVerOffset;	
	
	if(cardWidth <= 0 || cardHeight <= 0) {
		return null;
	}
	
	var cards = createCards(panel, issues, cardDescArray, selectedCardMousePos, selectedCard, selectedCardSourceIndex, colNumber, cardWidth, cardHeight, cardHorOffset, cardVerOffset, ColParams, onPressUp);
	
	if(cards != null)
	{
		if(ColParams.height > colHeight)
		{
			var add = ColParams.height - colHeight;
			colHeight += add;
			document.getElementById(panelName).height += add;
			
			columns = createColumns(columnHeaders, colNumber, colWidth, colHeight);
			
			ColParams.height += add;
			cards = createCards(panel, issues, cardDescArray, selectedCardMousePos, selectedCard, selectedCardSourceIndex, colNumber, cardWidth, cardHeight, cardHorOffset, cardVerOffset, ColParams, onPressUp);
			
			height += add;
		}
		
		document.getElementById(gridName).style.height = (document.getElementById(panelName).height + V_PADDING_CORRECTION) + "px";
	}
	else
		return null;
		
	panel.addChild(columns);
	
	for(var i = 0; i < cards.length; ++i)
	{
		panel.addChild(cards[i]);
	}
	
	var outerLine = createOuterLine(width, height);
	panel.addChild(outerLine);
  
  if (createjs.Ticker.hasEventListener("tick") == false)
  {
    createjs.Ticker.addEventListener("tick", tick);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
  }
}

function createCards(panel, issues, cardDescArray, selectedCardMousePos, selectedCard, selectedCardSourceIndex, colNumber, cardWidth, cardHeight, cardHorOffset, cardVerOffset, colParams, onPressUp) {
	var textHeight = 10;
	cardDescArray.length = 0;
	
	var cards = [];
	
	for(var i = 0; i < colNumber; ++i) {
		var issuesNumber = issues[i].length;
		var x = cardHorOffset + (H_OFFSET + i * colParams.width);
		
		var cardDescs = [];
		var y = V_OFFSET + textHeight + cardVerOffset;
		
		for(var k = 0; k < issuesNumber; ++k) {
			position = {
				x : x,
				y : y,
				width : cardWidth,
				height : cardHeight
			}
			
			var card = createCard(panel, position, issues, issues[i][k], selectedCardMousePos, cardDescArray, selectedCard, selectedCardSourceIndex, onPressUp);
			cards.push(card);
			
			CardDesc = {
				x : x,
				y : position.y,
				issueGroupIndex : i,
				issueIndex : k
			}
			
			if(y + position.height > colParams.height)
			{
				colParams.height += y + position.height - colParams.height;
			}
			
			y += position.height + 2 * cardVerOffset;
			
			cardDescs.push(CardDesc);
		}
		
		cardDescArray.push(cardDescs);
	}
	
	return cards;
}

function createCard(panel, position, issues, issue, selectedCardMousePos, cardDescArray, selectedCard, selectedCardSourceIndex, onPressUp) {
	var card = new createjs.Container();
	
	var back = createCardBack(position.width, position.height);	
	
	var markWidth = 6;
	
	issue.topColor = getColorByStatus(issue.status);
	issue.bottomColor = getTemperatureColor(issue.updateTime);
	
	var topMark = createCardTopMark(issue.topColor, position.width, markWidth);
	var bottomMark = createCardBottomMark(issue.bottomColor, position.width, position.height, markWidth);
	var number = createCardNumber(issue.id, position.width, markWidth);
	var summary = createCardSummary(issue.summary, position.width, markWidth, number);
	
	if(summary.y + summary.getBounds().height + 10 > position.height) {
		var add = summary.y + summary.getBounds().height + 10 - position.height;
		position.height += add;
		
		back = createCardBack(position.width, position.height);
		topMark = createCardTopMark(issue.topColor, position.width, markWidth);
		bottomMark = createCardBottomMark(issue.bottomColor, position.width, position.height, markWidth);
	}
	
	card.on("mousedown", function(evt) {
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
						selectedCardSourceIndex.value = { i, k };
						
						//console.log("Found! issues array index = " + i + " issue index = " + k + " selectedCard.id = " + selectedCard.id);
					}
				}
			}
		}
	});

	card.on("pressmove", function(evt) {
		card.x = evt.stageX - selectedCardMousePos.X;
		card.y = evt.stageY - selectedCardMousePos.Y;
		
    update = true;
    stageToUpdate = panel;
	});
	
	card.on("pressup", onPressUp);
	
	card.x = position.x;
	card.y = position.y;
	
	card.addChild(back);
	card.addChild(topMark);
	card.addChild(bottomMark);
	card.addChild(number);
	card.addChild(summary);
	
	card.tickEnabled = false;
	
	return card;
}

function createColumns(columnNames, number, width, height) {
	var columns = new createjs.Container();

	for(var i = 0; i <= number; ++i)	{
		var startX = H_OFFSET + i * width;		
		var line = new createjs.Shape();
		line.graphics.setStrokeStyle(2, 2);
		line.graphics.beginStroke(createjs.Graphics.getRGB(0,0,0)); 
		line.graphics.moveTo(startX, V_OFFSET);
		line.graphics.lineTo(startX, height + V_OFFSET);
		columns.addChild(line);
		
		var text = new createjs.Text(columnNames[i], "12px Arial", "#000000");
		text.x = startX + width / 2;
		text.y = V_OFFSET;
		text.textAlign = "center";
		text.lineWidth = width;
		columns.addChild(text);
	}
	
	columns.tickEnabled = false;
	
	return columns;
}

function createCardBack(width, height) {
	var back = new createjs.Shape();
	back.graphics.setStrokeStyle(1);
	back.graphics.beginStroke("#000000"); 
	back.graphics.beginFill("#F0F5FF"); 
	back.graphics.drawRect(0, 0, width, height);
	return back;
}

function createCardTopMark(markColor, cardWidth, markWidth) {
	var mark = new createjs.Shape();
	mark.graphics.setStrokeStyle(1);
	mark.graphics.beginStroke(markColor); 
	mark.graphics.beginFill(markColor);	
	mark.graphics.drawRect(1, 1, cardWidth - 2, markWidth);
	return mark;
}

function createCardBottomMark(markColor, cardWidth, cardHeight, markWidth) {
	var mark = new createjs.Shape();
	mark.graphics.setStrokeStyle(1);
	mark.graphics.beginStroke(markColor); 
	mark.graphics.beginFill(markColor);	
	mark.graphics.drawRect(1, cardHeight - 1 - markWidth, cardWidth - 2, markWidth);
	return mark;
}

function createCardNumber(issueNumber, width, markWidth) {
	var number = new createjs.Text(issueNumber, "12px Arial", "#000000");
	number.x = width - number.getBounds().width - 5;
	number.y += markWidth + 3;
	return number;
}

function createCardSummary(issueText, width, markWidth, number) {
	var sz = 12;
	var summary = new createjs.Text(issueText, sz + "px Arial", "#000000");
	summary.x = width / 2;
	summary.textAlign = "center";
	summary.lineWidth = width - 4;
	summary.y = 2 * number.getBounds().height + markWidth;
		
	while (--sz != 7 && summary.getBounds().width > summary.lineWidth)
	{
		summary.font = sz + "px Arial";
	}
	
	return summary;
}

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
}

function tick(event) {
  if(update) {
    update = false;
    stageToUpdate.update();
  }
}
