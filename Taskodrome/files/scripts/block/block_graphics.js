function BlockGraphics(name, /** @type {ColumnHandler} */columnHandler, /** @type {Page} */page) {
  Drawable.call(this, 0, 0, 0, 0, true, page);

  var m_name = name;
  var m_name_height = 0;

  var TEXT_COLOR = "#428AC8";
  var DELIMITER_COLOR = "#BFD5E1";

  var m_label = null;
  var m_delimiter = null;

  function Counter(number, /** @type {Page} */page) {
    Drawable.call(this, 0, 0, 0, 0, true, page);

    var m_self = this;
    var m_number = { value: number, gr: null };

    var parentDraw = this.draw;
    this.draw = function() {
      parentDraw(drawNumber());
    };

    this.inc = function() {
      ++m_number.value;
      refresh();
    };

    this.dec = function() {
      --m_number.value;
      refresh();
    };

    function refresh() {
      if (m_self.isDrawn()) {
        var right = m_self.m_bounds.right;
        var bottom = m_self.m_bounds.bottom;
        m_self.undraw();
        m_self.draw();
        m_self.setPosInv(new Position(right, bottom));
      }
    };

    function drawNumber() {
      return new fabric.Text("(" + m_number.value + ")", {
        fontFamily: "Arial",
        fontSize: fabric.util.parseUnit("12px"),
        fill: TEXT_COLOR,

        evented: false,
        hasBorders: false,
        hasControls: false,
        selectable: false
      });
    };
  };
  var m_counters = [];

  var m_onMouseUp = function() { };

  construct();
  function construct() {
    if (name == null) {
      m_name = "NO_NAME";
    }

    for (var i = 0; i != columnHandler.getColumnNumber(); ++i) {
      m_counters[i] = new Counter(0, page);
    }
  };

  this.incCounter = function(index) {
    m_counters[index].inc();
  };

  this.decCounter = function(index) {
    m_counters[index].dec();
  };

  var parentMove = this.move;
  this.move = function(h, v) {
    parentMove(0, v);
    function moveCounter(item) {
      item.move(h, v);
    };
    m_counters.forEach(moveCounter);
  };

  var parentDraw = this.draw;
  this.draw = function() {
    if (this.isDrawn()) {
      return;
    }

    m_label = new fabric.Text(m_name, {
      left: 5,
      top: 0,
  
      fontFamily: "Arial",
      fontSize: fabric.util.parseUnit("14px"),
      fontWeight: "bold",
      fill: TEXT_COLOR,
  
      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    var width = page.getCanvas().getWidth();
    m_name_height = Math.round(m_label.getScaledHeight());

    var STROKE_WIDTH = 4;
    m_delimiter = new fabric.Line([0, m_label.top + m_name_height, width, m_label.top + m_name_height], {
      strokeWidth: STROKE_WIDTH,
      stroke: DELIMITER_COLOR,
  
      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    var block = new fabric.Group([], {
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    function drawCounter(item) {
      item.draw();
    };
    m_counters.forEach(drawCounter);

    block.addWithUpdate(m_label);
    block.addWithUpdate(m_delimiter);
    // block.setCoords();

    block.on("mouseup", onMouseUp);

    parentDraw(block);
  };

  var parentUndraw = this.undraw;
  this.undraw = function() {
    if (!this.isDrawn()) {
      return;
    }

    m_label = null;
    m_delimiter = null;

    parentUndraw();
    function undrawCounter(item) {
      item.undraw();
    };
    m_counters.forEach(undrawCounter);
  };

  var parentShow = this.show;
  this.show = function() {
    parentShow();
    function showCounter(item) {
      item.show();
    };
    m_counters.forEach(showCounter);
  };

  var parentHide = this.hide;
  this.hide = function() {
    parentHide(m_name);
    function hideCounter(item) {
      item.hide();
    };
    m_counters.forEach(hideCounter);
  };

  var parentSetPos = this.setPos;
  this.setPos = function(/** @type {Position} */pos) {
    parentSetPos(pos);
    setCountersPos(this.m_bounds);
  };

  var parentSetPosInv = this.setPosInv;
  this.setPosInv = function(/** @type {Position} */posInv) {
    parentSetPosInv(posInv);
    setCountersPos(this.m_bounds);
  };

  this.makeFooter = function(status) {
    this.makePrev(status);
  };

  this.makePrev = function(status) {
    if (!this.isDrawn()) {
      return;
    }

    if (status) {
      m_delimiter.opacity = 0.5;
      m_label.opacity = 0.5;
    } else {
      m_delimiter.opacity = 1;
      m_label.opacity = 1;
    }

    function setOpacCounter(item) {
      item._getGraphics().opacity = m_label.opacity;
    };
    m_counters.forEach(setOpacCounter);

    this._getGraphics().dirty = true;
    page.getCanvas().requestRenderAll();
  };

  this.setOnMouseUp = function(onMouseUp) {
    m_onMouseUp = onMouseUp;
  };

  function setCountersPos(block_bounds) {
    var columnWidth = columnHandler.getColumnWidth();
    for (var i = 0; i != columnHandler.getColumnNumber(); ++i) {
      if (m_counters[i].m_bounds.left == m_counters[i].m_bounds.right)
      {
        m_counters[i].setPosInv(new Position((i + 1) * columnWidth - 5, block_bounds.top + m_name_height));
      }
      else
      {
        m_counters[i].setPosInv(new Position(m_counters[i].m_bounds.right, block_bounds.top + m_name_height));
      }
    }
  };

  function onMouseUp() {
    m_onMouseUp(name);
  };
};