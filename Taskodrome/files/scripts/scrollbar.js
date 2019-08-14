function ScrollbarV(grid, /** @type {Page} */page) {
  Drawable.call(this, 0, 0, 0, 0, true, page);

  var WIDTH = 20;
  var BAR_MIN_HEIGHT = 30;

  var m_isSelected = false;
  var m_prevPointerY = 0;
  var m_self = this;

  var m_contentHeight = 0;
  var m_contentScrolled = 0;
  var m_contentToBar_px = 0;

  var m_extra_v_offset = 0;

  /** @type {VisibilityAnimator} */var m_visibilityAnimator = null;

  var parentDraw = this.draw;
  this.draw = function(contentHeight, extra_v_offset) {
    m_contentHeight = contentHeight;
    m_extra_v_offset = extra_v_offset;
    var barHeight = getBarHeight(contentHeight);
    var bar = new fabric.Rect({
      left: page.getCanvas().getWidth() - WIDTH,
      top: m_extra_v_offset,

      fill: "#d2d1d3",
      stroke: "#d2d1d3",

      width: WIDTH,
      height: barHeight,

      evented: true,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    parentDraw(bar);

    m_visibilityAnimator = new VisibilityAnimator(this, page);
    m_visibilityAnimator.setWakeupArea(new Position(page.getCanvas().getWidth() - WIDTH, m_extra_v_offset), new Size(WIDTH, page.getCanvas().getHeight() - m_extra_v_offset));

    bar.on("mousedown", function(opt) {
      m_isSelected = true;
      m_prevPointerY = Math.round(opt.pointer.y);
      m_visibilityAnimator.onMouseDown();
    });

    function onMouseMove(opt) {
      if (m_isSelected) {
        var pointerY = Math.round(opt.pointer.y);
        var diff = pointerY - m_prevPointerY;
        if (diff != 0)
        {
          m_prevPointerY = pointerY;
          m_self.scrollGrid(-diff);
        }
      }
    };

    bar.on("mousemove", onMouseMove);
    page.getCanvas().on("mouse:move", onMouseMove);

    function onMouseUp() {
      m_isSelected = false;
      m_visibilityAnimator.onMouseUp();
    };

    bar.on("mouseup", onMouseUp);
    page.getCanvas().on("mouse:up", onMouseUp);

    bar.on("mouseover", m_visibilityAnimator.onMouseOver);

    bar.on("mouseout", m_visibilityAnimator.onMouseOut);
  };

  this.isVisible = function() {
    return this._getGraphics().height >= BAR_MIN_HEIGHT;
  };

  this.scroll = function(contentV) {
    if (!this.isShown()) {
      return;
    }

    m_contentScrolled += contentV;
    this._getGraphics().height = getBarHeight(m_contentHeight);
    if (m_contentScrolled == 0) {
      this.setPos(new Position(page.getCanvas().getWidth() - WIDTH, m_extra_v_offset));
    } else if (m_contentScrolled == m_contentHeight - (page.getCanvas().getHeight() - m_extra_v_offset)) {
      this.setPos(new Position(page.getCanvas().getWidth() - WIDTH, page.getCanvas().getHeight() - this._getGraphics().height));
    } else {
      this.setPos(new Position(page.getCanvas().getWidth() - WIDTH, Math.max(1, Math.floor(m_contentScrolled / m_contentToBar_px) + m_extra_v_offset)));
    }

    if (this._getGraphics().height != 0) {
      this._getGraphics().bringToFront();
    }

    m_visibilityAnimator.onScroll(m_isSelected);
  };

  this.scrollGrid = function(v) {
    grid.barScroll(0, Math.round(v * m_contentToBar_px));
  };

  this.resize = function(contentHeight, contentTop) {
    var vertCorrection = -(m_contentScrolled + contentTop);
    if (vertCorrection != 0) {
      this.scroll(vertCorrection);
    }

    if (contentHeight != m_contentHeight) {
      m_contentHeight = contentHeight;
      this._getGraphics().height = getBarHeight(contentHeight);
    }

    vertCorrection = -Math.min(-contentTop, Math.max(0, page.getCanvas().getHeight() - (contentTop + contentHeight)));

    if (this.isVisible()) {
      this.show();
    } else {
      this.hide();
    }
  };

  function getBarHeight(contentHeight) {
    var scrollableAreaHeight = page.getCanvas().getHeight() - m_extra_v_offset;
    var heightToShow = m_contentScrolled + scrollableAreaHeight + Math.max(0, contentHeight - m_contentScrolled - scrollableAreaHeight);

    if (heightToShow <= scrollableAreaHeight) {
      return 0;
    }

    var res = Math.max(BAR_MIN_HEIGHT, Math.round((scrollableAreaHeight / heightToShow) * scrollableAreaHeight));
    m_contentToBar_px = (heightToShow - scrollableAreaHeight) / (scrollableAreaHeight - res);
    return res;
  };
};

function ScrollbarH(grid, /** @type {Page} */page) {
  Drawable.call(this, 0, 0, 0, 0, true, page);

  var HEIGHT = 20;
  var BAR_MIN_WIDTH = 30;

  var m_isSelected = false;
  var m_prevPointerX = 0;
  var m_self = this;

  var m_contentWidth = 0;
  var m_contentScrolled = 0;
  var m_contentToBar_px = 0;

  /** @type {VisibilityAnimator} */var m_visibilityAnimator = null;

  var parentDraw = this.draw;
  this.draw = function(contentWidth) {
    m_contentWidth = contentWidth;
    var barWidth = getBarWidth(contentWidth);
    if (barWidth == 0) {
      return;
    }

    var bar = new fabric.Rect({
      left: 0,
      top: page.getCanvas().getHeight() - HEIGHT,

      fill: "#d2d1d3",
      stroke: "#d2d1d3",

      width: barWidth,
      height: HEIGHT,

      evented: true,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    parentDraw(bar);

    m_visibilityAnimator = new VisibilityAnimator(this, page);
    m_visibilityAnimator.setWakeupArea(new Position(0, page.getCanvas().getHeight() - HEIGHT), new Size(page.getCanvas().getWidth(), HEIGHT));

    function onMouseDown(opt) {
      m_isSelected = true;
      m_prevPointerX = Math.round(opt.pointer.x);
      m_visibilityAnimator.onMouseDown();
    };
    bar.on("mousedown", onMouseDown);

    function onMouseMove(opt) {
      if (m_isSelected) {
        var pointerX = Math.round(opt.pointer.x);
        var diff = pointerX - m_prevPointerX;
        if (diff != 0)
        {
          m_prevPointerX = pointerX;
          m_self.scrollGrid(-diff);
        }
      }
    };
    bar.on("mousemove", onMouseMove);
    page.getCanvas().on("mouse:move", onMouseMove);

    function onMouseUp() {
      m_isSelected = false;
      m_visibilityAnimator.onMouseUp();
    };
    bar.on("mouseup", onMouseUp);
    page.getCanvas().on("mouse:up", onMouseUp);

    bar.on("mouseover", m_visibilityAnimator.onMouseOver);

    bar.on("mouseout", m_visibilityAnimator.onMouseOut);
  };

  this.scroll = function(contentH) {
    if (!this.isShown()) {
      return;
    }

    m_contentScrolled += contentH;
    if (m_contentScrolled == 0) {
      this.setPos(new Position(0, page.getCanvas().getHeight() - HEIGHT));
    } else if (m_contentScrolled == m_contentWidth - page.getCanvas().getWidth()) {
      this.setPos(new Position(page.getCanvas().getWidth() - this._getGraphics().width, page.getCanvas().getHeight() - HEIGHT));
    } else {
      this.setPos(new Position(Math.max(1, Math.floor(m_contentScrolled / m_contentToBar_px)), page.getCanvas().getHeight() - HEIGHT));
    }

    m_visibilityAnimator.onScroll(m_isSelected);
  };

  this.scrollGrid = function(h) {
    grid.barScroll(Math.round(h * m_contentToBar_px), 0);
  };

  function getBarWidth(contentWidth) {
    if (contentWidth <= page.getCanvas().getWidth()) {
      return 0;
    }

    var res = Math.max(BAR_MIN_WIDTH, Math.round((page.getCanvas().getWidth() / contentWidth) * page.getCanvas().getWidth()));
    m_contentToBar_px = (contentWidth - page.getCanvas().getWidth()) / (page.getCanvas().getWidth() - res);
    return res;
  };
};

function VisibilityAnimator(/** @type {Drawable} */drawable, /** @type {Page} */page) {
  var TIMEOUT = 750;
  var DURATION = 500;

  var m_keepVisible = false;
  var m_isMouseOver = false;
  var m_isMouseDown = false;

  constructor();
  function constructor() {
    setInterval(tryMakeInvisibleByTimeout, TIMEOUT);
  };

  this.onMouseDown = function() {
    m_isMouseDown = true;
  };

  this.onMouseUp = function() {
    m_isMouseDown = false;
  };

  this.onMouseOver = function() {
    makeVisible();
    m_keepVisible = true;
    m_isMouseOver = true;
  };

  this.onMouseOut = function() {
    m_isMouseOver = false;
  };

  this.onScroll = function(isSelected) {
    if (!isSelected) {
      makeVisible();
      m_keepVisible = true;
    }
  };

  this.setWakeupArea = function(/** @type {Position} */pos, /** @type {Size} */size) {
    var area = new fabric.Rect({
      left: pos.m_left,
      top: pos.m_top,

      width: size.m_width,
      height: size.m_height,
      opacity: 0,

      evented: true,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    area.on("mouseover", this.onMouseOver);
    area.on("mouseout", this.onMouseOut);

    page.getCanvas().add(area);
    area.bringToFront();
  };

  function makeVisible() {
    drawable._getGraphics().opacity = 1;
    page.getCanvas().requestRenderAll();
  };

  function tryMakeInvisibleByTimeout() {
    if (!m_keepVisible) {
      drawable._getGraphics().animate("opacity", "0", { onChange: page.getCanvas().requestRenderAll.bind(page.getCanvas()), duration: DURATION, abort: function() {
        return m_keepVisible;
      } });
    } else if (!m_isMouseOver && !m_isMouseDown) {
      m_keepVisible = false;
    }
  };
};