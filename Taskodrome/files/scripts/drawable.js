function Drawable(LEFT_OFFSET, RIGHT_OFFSET, TOP_OFFSET, BOTTOM_OFFSET, isForFront, /** @type {Page} */page) {
  var m_self = this;
  var m_graphics = null;
  var m_isShown = false;
  this.m_bounds = { top : 0, bottom : 0, left : 0, right : 0 };

  this.draw = function(graphics) {
    if (m_self.isDrawn()) {
      return false;
    }

    m_graphics = graphics;

    return true;
  };
  
  this.redraw = function(graphics) {
    if (!m_self.isDrawn()) {
      return;
    }

    m_self.hide();

    var oldPos = new Position(m_graphics.left, m_graphics.top);
    m_graphics = graphics;

    m_self.setPos(oldPos);

    m_self.show();
  };

  this.undraw = function() {
    if (!m_self.isDrawn()) {
      return;
    }

    m_self.hide();
    m_graphics = null;

    m_self.setPos(new Position(m_self.m_bounds.left, m_self.m_bounds.top));
  };

  this.move = function(h, v) {
    h = Math.round(h);
    v = Math.round(v);
    if (m_self.isDrawn()) {
      m_graphics.left += h;
      m_graphics.top += v;
      m_graphics.setCoords();
    }
    m_self.m_bounds.left += h;
    m_self.m_bounds.right += h;
    m_self.m_bounds.top += v;
    m_self.m_bounds.bottom += v;

    if (m_self.isVisible()) {
      m_self.show();
    } else {
      m_self.hide();
    }
  };

  this.show = function() {
    if (!m_isShown && m_self.isDrawn() && m_self.isVisible()) {
      page.getCanvas().add(m_graphics);
      if (isForFront) {
        m_graphics.bringToFront();
      } else {
        m_graphics.sendToBack();
      }
      m_isShown = true;
    }
  };

  this.hide = function() {
    if (m_isShown) {
      page.getCanvas().remove(m_graphics);
      m_isShown = false;
    }
  };

  this.setPos = function(/** @type {Position} */pos) {
    var left = Math.round(pos.m_left);
    var top = Math.round(pos.m_top);
    if (m_self.isDrawn()) {
      m_graphics.left = LEFT_OFFSET + left;
      m_graphics.top = TOP_OFFSET + top;
      m_graphics.setCoords();
      m_self.m_bounds = { top : top, bottom : top + TOP_OFFSET + Math.round(m_graphics.getScaledHeight()) + BOTTOM_OFFSET, 
        left : left, right : left + LEFT_OFFSET + Math.round(m_graphics.getScaledWidth()) + RIGHT_OFFSET };
    } else {
      m_self.m_bounds = { top : top, bottom : top, left : left, right : left };
    }

    if (m_self.isVisible()) {
      m_self.show();
    } else {
      m_self.hide();
    }
  };

  this.setPosInv = function(/** @type {Position} */pos) {
    var right = Math.round(pos.m_left);
    var bottom = Math.round(pos.m_top);
    if (m_self.isDrawn()) {
      m_graphics.left = right - RIGHT_OFFSET - Math.round(m_graphics.getScaledWidth());
      m_graphics.top = bottom - BOTTOM_OFFSET - Math.round(m_graphics.getScaledHeight());
      m_graphics.setCoords();
      m_self.m_bounds = { top : bottom - BOTTOM_OFFSET - Math.round(m_graphics.getScaledHeight()) - TOP_OFFSET, bottom : bottom, 
        left : right - RIGHT_OFFSET - Math.round(m_graphics.getScaledWidth()) - LEFT_OFFSET, right : right };
    } else {
      m_self.m_bounds = { top : bottom, bottom : bottom, left : right, right : right };
    }

    if (m_self.isVisible()) {
      m_self.show();
    } else {
      m_self.hide();
    }
  };

  this.isDrawn = function() {
    return m_graphics != null;
  };

  this.isShown = function() {
    return m_isShown;
  };

  this.isVisible = function() {
    var hVisibility = (m_self.m_bounds.left >= 0 && m_self.m_bounds.left <= page.getCanvas().getWidth()) 
    || (m_self.m_bounds.right >= 0 && m_self.m_bounds.right <= page.getCanvas().getWidth())
    || (m_self.m_bounds.left < 0 && m_self.m_bounds.right > page.getCanvas().getWidth());
    var vVisibility = (m_self.m_bounds.top >= 0 && m_self.m_bounds.top <= page.getCanvas().getHeight()) 
    || (m_self.m_bounds.bottom >= 0 && m_self.m_bounds.bottom <= page.getCanvas().getHeight())
    || (m_self.m_bounds.top < 0 && m_self.m_bounds.bottom > page.getCanvas().getHeight());
    return m_self.isDrawn() && hVisibility && vVisibility;
  };

  this.getLeftOffset = function() {
    return LEFT_OFFSET;
  };

  this.getRightOffset = function() {
    return RIGHT_OFFSET;
  };

  this.getTopOffset = function() {
    return TOP_OFFSET;
  };

  this.getBottomOffset = function() {
    return BOTTOM_OFFSET;
  };

  this._getGraphics = function() {
    return m_graphics;
  };
};