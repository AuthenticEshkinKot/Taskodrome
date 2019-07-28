function Grid(/** @type {ColumnHandler} */columnHandler, /** @type {Page} */page, cardUpdater, getCardBlockName) {
  var m_blocks = new BlockList(page, new ScrollerByStep(), getCardBlockName);
  var m_borders = [];
  var m_headers = [];
  var m_scrollbarV = new ScrollbarV(this, page);
  var m_scrollbarH = new ScrollbarH(this, page);
  var m_cardUpdater = cardUpdater;
  var m_checkbox_empty_version = null;

  function onEmptyBlockVisibility() {
    m_blocks.setEmptyBlockVisibility(m_checkbox_empty_version.checked);
    m_scrollbarV.resize(m_blocks.getHeight(), m_blocks.getScrolledTop());
  };

  constructor();
  function constructor() {
    for (var i = 0; i != columnHandler.getColumnNumber(); ++i) {
      m_headers.push(new ColumnHeader(columnHandler.getColumnName(i), 0, (i != columnHandler.getColumnNumber() - 1), columnHandler, page));
    }

    m_checkbox_empty_version = document.getElementById("checkbox_version");
    m_checkbox_empty_version.addEventListener("click", onEmptyBlockVisibility);
  };

  this.addCard = function(/** @type {Card} */card) {
    var index = m_blocks.pushCard(card);
    if (index != -1) {
      m_headers[index].incCount();
    }
  };

  this.addBlock = function(/** @type {Block} */block) {
    block.setOnMouseUp(this.onMouseUpBlock);
    block.setShowIfEmpty(m_checkbox_empty_version.checked);
    m_blocks.pushBlock(block);
  };

  this.draw = function() {
    drawBorders();

    var headerHeight = drawColumnNames();
    m_blocks.setExtraVOffset(headerHeight);

    m_blocks.draw();
    m_blocks.setPHF();

    m_scrollbarV.draw(m_blocks.getHeight(), headerHeight);
    m_scrollbarV.show();

    m_scrollbarH.draw(m_blocks.getWidth());
    m_scrollbarH.show();

    page.getCanvas().requestRenderAll();
  };

  this.wheelScroll = function(evt) {
    var v = (evt.deltaY < 0 ? 24 : -24);
    scrollV(v);
  };

  this.keydown = function(evt) {
    switch (evt.key)
    {
      case ("ArrowLeft"): scrollH(8); break;
      case ("ArrowRight"): scrollH(-8); break;
      default: break;
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

  this.transferCard = function(/** @type {CardTransferEvent} */event) {
    var srcCoords = m_blocks.getCoords_byCard(event.m_card);
    var dstCoords = m_blocks.getCoords_byPos(event.m_pos);
    if (dstCoords.isValid() && !dstCoords.equal(srcCoords) && m_cardUpdater.isPermitted(event.m_card, srcCoords, dstCoords)) {
      m_blocks.removeCard(srcCoords, dstCoords.m_block);
      m_blocks.addCard(event.m_card, dstCoords);

      if (!dstCoords.inFactEqual(srcCoords)) {
        m_headers[srcCoords.m_column].decCount();
        m_headers[dstCoords.m_column].incCount();
        m_scrollbarV.resize(m_blocks.getHeight(), m_blocks.getScrolledTop());
        m_cardUpdater.perform(event.m_card, srcCoords, dstCoords);
      }
      return;
    }
    console.log("Restore");
    m_blocks.restoreCard(event.m_card);
  };

  this.updateCard = function(srcBlockName, srcColumnName, newCard) {
    var srcCoords = m_blocks.getCoords(srcBlockName, columnHandler.getColumnIndex(srcColumnName), newCard.getId());
    var dstCoords = m_blocks.getCoords(getCardBlockName(newCard), columnHandler.getColumnIndexByCard(newCard), newCard.getId());
    dstCoords.m_index = 0;
    if (srcCoords.isValid() && dstCoords.isValid()) {
      if (dstCoords.inFactEqual(srcCoords)) {
        m_blocks.updateCard(srcCoords, newCard);
      } else {
        var oldCard = m_blocks.removeCard(srcCoords, dstCoords.m_block);
        oldCard.update(newCard);
        m_blocks.addCard(oldCard, dstCoords);

        m_headers[srcCoords.m_column].decCount();
        m_headers[dstCoords.m_column].incCount();
      }
      m_scrollbarV.resize(m_blocks.getHeight(), m_blocks.getScrolledTop());
    }
  };

  function drawBorders() {
    var STROKE_WIDTH = 2;
    var columnWidth = columnHandler.getColumnWidth();
    for (var i = 1; i != columnHandler.getColumnNumber(); ++i) {
      var border = new fabric.Line([i * columnWidth - STROKE_WIDTH / 2, 0, i * columnWidth - STROKE_WIDTH / 2, page.getCanvas().getHeight()], {
        strokeWidth: STROKE_WIDTH,
        stroke: "#d2d1d3",

        evented: false,
        hasBorders: false,
        hasControls: false,
        selectable: false
      });
      m_borders[i - 1] = border;
      page.getCanvas().add(border);
    }
  };

  function drawColumnNames() {
    var BLUE_COLOR = "#428AC8";
    var back = new fabric.Rect({
      left: 0,
      top: 0,

      fill: BLUE_COLOR,
      strokeWidth: 0,

      width: page.getCanvas().getWidth(),
      height: 20,

      evented: true,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });
    page.getCanvas().add(back);
    back.bringToFront();

    var maxHeight = 0;
    var columnWidth = columnHandler.getColumnWidth();
    function prepareHeader(item, i) {
      item.draw();
      item.setPos(new Position(i * columnWidth, 0));
      maxHeight = Math.max(maxHeight, item.m_bounds.bottom);
      item.show();
    };
    m_headers.forEach(prepareHeader);

    back.height = maxHeight;

    return maxHeight;
  };

  function ScrollerByStep() {
    var m_rest = 0;
    var m_scrollingInterval = null;

    this.run = function(rest) {
      if (m_scrollingInterval == null) {
        m_rest = rest;
        makeStep();
      }
    };

    function makeStep() {
      var sign = (m_rest < 0 ? -1 : 1);
      var absRest = Math.abs(m_rest);
      var TIMEOUT = 25;
      var MIN_STEP = 30;
      var TIME_TO_SCROLL = 800;
      var step = Math.max(MIN_STEP, Math.round((absRest / TIME_TO_SCROLL) * TIMEOUT));
      var v = (absRest < step ? m_rest : sign * step);
      var res = (v != 0 ? scrollV(v) : 0);
      if (res != 0) {
        m_rest -= res;
        if (m_scrollingInterval == null) {
          m_scrollingInterval = setInterval(makeStep, TIMEOUT); 
        }
      } else if (m_scrollingInterval != null) {
        clearInterval(m_scrollingInterval);
        m_scrollingInterval = null;
      }
    };
  };

  function scrollV(v) {
    v = m_blocks.scrollV(v);
    m_scrollbarV.scroll(-v);

    page.getCanvas().requestRenderAll();

    return v;
  };

  function scrollH(h) {
    if (m_borders.length == 0) {
      return 0;
    }

    var columnWidth = columnHandler.getColumnWidth();

    if (m_borders[0].left + h > columnWidth) {
      h = columnWidth - m_borders[0].left;
    }

    if (m_borders[m_borders.length - 1].left + h < page.getCanvas().getWidth() - columnWidth) {
      h = -(m_borders[m_borders.length - 1].left - (page.getCanvas().getWidth() - columnWidth));
    }

    function moveBorder(item) {
      item.left += h;
      item.setCoords();
    };
    m_borders.forEach(moveBorder);

    function moveHeader(item) {
      item.move(h, 0);
    };
    m_headers.forEach(moveHeader);

    m_blocks.scrollH(h);

    m_scrollbarH.scroll(-h);

    page.getCanvas().requestRenderAll();
  };
};

function ColumnHeader(name, count, showDelimiter, /** @type {ColumnHandler} */columnHandler, /** @type {Page} */page) {
  var H_OFFSET = 7;
  var V_OFFSET = 5;
  Drawable.call(this, H_OFFSET, H_OFFSET, V_OFFSET, V_OFFSET, true, /** @type {Page} */page);

  var m_self = this;
  var m_count = { number: count, gr: null };
  var m_nameGr = null;
  var m_delimiter = null;

  var parentDraw = this.draw;
  this.draw = function() {
    if (this.isDrawn()) {
      return;
    }

    m_count.gr = drawCounter();

    m_nameGr = prepareName(m_count.gr);

    var header = new fabric.Group([m_nameGr, m_count.gr], {
      hasBorders: false,
      hasControls: false,
      subTargetCheck: false,
      selectable: false
    });

    if (showDelimiter) {
      m_delimiter = drawDelimiter();
      header.addWithUpdate(m_delimiter);
    }

    parentDraw(header);
  };

  this.incCount = function() {
    ++m_count.number;
    refresh();
  };

  this.decCount = function() {
    --m_count.number;
    refresh();
  };

  function refresh() {
    if (m_self.isDrawn()) {
      var left = m_self._getGraphics().left;
      var top = m_self._getGraphics().top;

      m_self._getGraphics().remove(m_count.gr);
      m_self._getGraphics().remove(m_nameGr);
      m_self._getGraphics().remove(m_delimiter);
      m_count.gr = drawCounter();
      m_nameGr = prepareName(m_count.gr);
      m_delimiter = drawDelimiter();
      m_self._getGraphics().addWithUpdate(m_nameGr);
      m_self._getGraphics().addWithUpdate(m_count.gr);
      m_self._getGraphics().addWithUpdate(m_delimiter);

      m_self._getGraphics().left = left;
      m_self._getGraphics().top = top;
      m_self._getGraphics().dirty = true;
    }
  };

  function drawCounter() {
    var res = new fabric.Text("(" + m_count.number + ")", {
      fontFamily: "Arial",
      fontSize: fabric.util.parseUnit("16px"),
      fill: "#ffffff",

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });
    res.left = columnHandler.getColumnWidth() - 2 * H_OFFSET - Math.round(res.getScaledWidth());
    return res;
  };

  function prepareName(countGr) {
    var H_BETWEEN_NAME_COUNT = 5;
    var maxNameWidth = columnHandler.getColumnWidth() - 2 * H_OFFSET - countGr.getScaledWidth() - H_BETWEEN_NAME_COUNT;
    var srcName = name;
    var res = drawName(srcName);
    while (srcName.length > 3 && res.getScaledWidth() > maxNameWidth) {
      srcName = srcName.substring(0, srcName.length - 1);
      res = drawName(srcName + "...");
    };
    return res;
  };

  function drawDelimiter() {
    var STROKE_WIDTH = 2;
    return new fabric.Line([columnHandler.getColumnWidth() - H_OFFSET - STROKE_WIDTH / 2, 0, columnHandler.getColumnWidth() - H_OFFSET - STROKE_WIDTH / 2, Math.round(m_nameGr.getScaledHeight())], {
      strokeWidth: STROKE_WIDTH,
      stroke: "#ffffff",
      opacity: 0.5,

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });
  };

  function drawName(text) {
    return new fabric.Text(text, {
      fontFamily: "Arial",
      fontSize: fabric.util.parseUnit("18px"),
      fill: "#FFFFFF",

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });
  };
};
