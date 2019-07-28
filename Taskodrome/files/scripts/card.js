function Card(id, owner, version, summary, description, severity, priority, priorityCode, reproducibility, updateTime, status,
  showOwner,
  /** @type {CardTransferHandler} */cardTransferHandler, /** @type {ColumnHandler} */columnHandler, /** @type {Page} */page) {
  var H_OFFSET = 10;
  var V_OFFSET = 10;

  var TEXT_H_OFFSET = 12;
  var TEXT_V_OFFSET = 6;

  var BLUE_TEXT_COLOR = "#428AC8";
  var STROKE_COLOR = "#C0BFC1";

  Drawable.call(this, H_OFFSET, H_OFFSET, V_OFFSET, 0, false, page);

  var m_self = this;
  var m_id = id;
  var m_version = (version == null ? "" : version);
  var m_summary = { value: (summary == null ? "" : summary), gr: null };
  var m_description = (description == null ? " " : description);
  var m_updateTime = { value: updateTime, stamp: null };
  var m_status = { value: status, mark: null };
  var m_owner = { value: (owner == null ? " " : owner), gr: null };

  var m_content_back = null;

  var m_popup = null;
  var m_popup_vis_mgr = null;

  var m_isMouseDown = false;

  this.getId = function() { return m_id; };
  this.getVersion = function() { return m_version; };
  this.setVersion = function(name) { m_version = name; };
  this.getStatus = function() { return m_status.value; };
  this.getOwner = function() { return m_owner.value; };
  this.hasNoOwner = function() { return m_owner.value == " "; };
  this.getUpdateTime = function() { return m_updateTime.value; };

  var parentDraw = this.draw;
  this.draw = function() {
    if (m_self.isDrawn()) {
      return;
    }
    
    var width = getCardWidth();

    var header = createCardHeader(width);
    var content = createCardContent(width, header[0].getScaledHeight() - 1, showOwner);

    var card = new fabric.Group(content.concat(header), {
      evented: true,
      hasBorders: false,
      hasControls: false,
      subTargetCheck: true,
      selectable: (cardTransferHandler != null)
    });

    m_popup = new Popup(width, m_description, severity, priority, reproducibility, page);
    m_popup.draw();

    m_popup_vis_mgr = new PopupVisibilityManager(m_popup, page);

    setEventHandlers(card);

    parentDraw(card);
  };

  this.update = function(/** @type {Card} */src) {
    m_self.setVersion(src.getVersion());
    m_self.setStatus(src.getStatus());
    m_self.setOwner(src.getOwner());
    m_self.setUpdateTime(src.getUpdateTime());
    var card = new fabric.Group(m_self._getGraphics().getObjects(), {
      hasBorders: false,
      hasControls: false,
      subTargetCheck: true,
      selectable: true
    });
    setEventHandlers(card);

    m_self.redraw(card);
  };

  this.refreshUpdateTime = function() {
    var date = new Date();
    m_updateTime.value = Math.round(date.getTime() / 1000);

    var color = getTemperatureColor(m_updateTime.value);
    m_updateTime.stamp.text = date.toLocaleString();
    m_updateTime.stamp.fill = color;
    m_self._getGraphics().dirty = true;
  };
  
  this.setUpdateTime = function(updateTime) {
    m_updateTime.value = updateTime;

    var color = getTemperatureColor(m_updateTime.value);
    m_updateTime.stamp.text = (new Date(m_updateTime.value * 1000)).toLocaleString();
    m_updateTime.stamp.fill = color;
    m_self._getGraphics().dirty = true;
  };
  
  this.setStatus = function(status) {
    if (m_status.value != status) {
      m_status.value = status;
      m_status.mark.fill = DataSource.Inst().GetColorOfStatus(m_status.value);
      m_self._getGraphics().dirty = true;
    }
  };

  this.setOwner = function(owner) {
    if (m_owner.value != owner) {
      m_owner.value = owner;
      if (m_owner.gr != null) {
        var oldHeight = 0;
        if (m_owner.gr.opacity != 0) {
          oldHeight = Math.round(m_owner.gr.getScaledHeight()) + TEXT_V_OFFSET;
        }

        m_self._getGraphics().remove(m_owner.gr);

        var newGr = createShortenedText(m_owner.value, getContentAreaWidth(getCardWidth()), getTextMaxHeight(), false);
        newGr.top = m_owner.gr.top;
        newGr.left = m_owner.gr.left;
        newGr.fill = m_owner.gr.fill;
        m_owner.gr = newGr;

        var newHeight = 0;
        if (m_owner.value == " ") {
          m_owner.gr.opacity = 0;
        } else {
          newHeight = Math.round(m_owner.gr.getScaledHeight()) + TEXT_V_OFFSET;
        }

        m_self._getGraphics().add(m_owner.gr);

        var heightDiff = newHeight - oldHeight;
        m_summary.gr.top += heightDiff;
        m_updateTime.stamp.top += heightDiff;
        m_content_back.height += heightDiff;

        m_self._getGraphics().calcCoords();
        m_self._getGraphics().setCoords();
        m_self._getGraphics().dirty = true;
      }
    }
  };

  function setEventHandlers(card) {
    function onMouseDown() {
      m_isMouseDown = true;
      m_self._getGraphics().setShadow({ color: "#AFAFAF8F", offsetX: 5, offsetY: 5, blur: 4 });
      cardTransferHandler.Start(m_self);
    };

    function onMouseUp(evt) {
      m_isMouseDown = false;
      m_self._getGraphics().setShadow(null);
      m_self.hide();
      m_self.show();
      var pointer = page.getCanvas().getPointer(evt.e);
      cardTransferHandler.Finish(new Position(Math.round(pointer.x), Math.round(pointer.y)));
    };

    if (cardTransferHandler != null) {
      card.on("mousedown", onMouseDown);
      card.on("mouseup", onMouseUp);
    }

    card.on("mouseover", m_popup_vis_mgr.onMouseOver);
    card.on("mousemove", m_popup_vis_mgr.onMouseMove);
    card.on("mouseout", m_popup_vis_mgr.onMouseOut);
    card.on("mousedown", m_popup_vis_mgr.onMouseDown);
  };

  function createCardHeader(width) {
    var number = new fabric.Text(m_id.toString(), {
      fontFamily: "Arial",
      fontSize: fabric.util.parseUnit("12px"),
      fill: BLUE_TEXT_COLOR,
      underline: true,

      left: TEXT_H_OFFSET,
  
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    var height = Math.round(number.getScaledHeight()) * 2;
    number.top = Math.round(height / 4);

    function onMouseUp() {
      var address = getPathToMantisFile(window, "view.php") + "?id=" + m_id;
      window.open(address);
    }
    number.on("mouseup", onMouseUp);

    createPriorityMark(Math.round(number.left + number.getScaledWidth() + TEXT_H_OFFSET), number.top, Math.round(number.top + number.getScaledHeight()));

    var statusMarkSize = Math.round(height / 2);
    m_status.mark = new fabric.Rect({
      left: width - 2 * statusMarkSize,
      top: Math.round(statusMarkSize / 2),

      fill: DataSource.Inst().GetColorOfStatus(m_status.value),
      stroke: STROKE_COLOR,

      width: statusMarkSize,
      height: statusMarkSize,

      rx: 1,
      ry: 1,

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    var back = new fabric.Rect({
      left: 0,
      top: 0,

      fill: "#F9F9F9",
      stroke: STROKE_COLOR,

      width: width,
      height: height,

      rx: 1,
      ry: 1,

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    return [back, number, m_status.mark];
  };

  function createPriorityMark(left, top, bottom) {
    var path = "plugins/Taskodrome/files/assets/";
    switch (priorityCode) {
      case 20: path += "lower.png"; break;
      case 30: path += "minus.png"; break;
      case 40: path += "higher.png"; break;
      case 50: path += "arrow.png"; break;
      case 60: path += "danger.png"; break;
      default: return null;
    }

    function clb(smth) {
      if (m_self.isDrawn()) {
        smth.left = m_self._getGraphics().left + left;
        smth.top = m_self._getGraphics().top + Math.round((bottom + top - smth.getScaledHeight()) / 2);
        m_self._getGraphics().addWithUpdate(smth);
      }
    };

    fabric.Image.fromURL(path, clb);
  };

  function createCardContent(width, v_offset, add_owner) {
    var text_maxwidth = getContentAreaWidth(width);
    var maxHeight = getTextMaxHeight();

    var top = Math.round(v_offset * 1.5);

    if (add_owner) {
      m_owner.gr = createShortenedText(m_owner.value, text_maxwidth, maxHeight, false);
      m_owner.gr.fill = BLUE_TEXT_COLOR;
      m_owner.gr.left = TEXT_H_OFFSET;
      m_owner.gr.top = top;
      if (m_owner.value != " ") {
        top += Math.round(m_owner.gr.getScaledHeight()) + TEXT_V_OFFSET;
      } else {
        m_owner.gr.opacity = 0;
      }
    }

    m_summary.gr = createShortenedText(m_summary.value.toString(), text_maxwidth, maxHeight, false);
    m_summary.gr.left = TEXT_H_OFFSET;
    m_summary.gr.top = top;

    m_updateTime.stamp = createTimestamp();
    m_updateTime.stamp.left = TEXT_H_OFFSET;
    m_updateTime.stamp.top = Math.round(m_summary.gr.top + m_summary.gr.getScaledHeight() + m_updateTime.stamp.getScaledHeight() / 2);

    m_content_back = new fabric.Rect({
      left: 0,
      top: v_offset,

      fill: "#FFFFFF",
      stroke: STROKE_COLOR,

      width: width,
      height: Math.round(m_updateTime.stamp.top + 1.5 * m_updateTime.stamp.getScaledHeight()) - v_offset,

      rx: 1,
      ry: 1,

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    var res = [m_content_back, m_summary.gr, m_updateTime.stamp];
    if (m_owner.gr != null) {
      res.push(m_owner.gr);
    }
    return res;
  };

  function createTimestamp() {
    var date = new Date(m_updateTime.value * 1000);
    var color = getTemperatureColor(m_updateTime.value);
    
    var res = new fabric.Text(date.toLocaleString(), {
      fontFamily: "Arial",
      fontSize: fabric.util.parseUnit("12px"),
      fill: color,
  
      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    return res;
  };

  function getTemperatureColor(updateTime) {
    var currentTime = (new Date().getTime()) / 1000;
    var timeFromUpdate = currentTime - updateTime;
  
    if (timeFromUpdate > DataSource.Inst().CooldownPeriod())
      return "#1D1DE2";
    else if (timeFromUpdate < 0)
      timeFromUpdate = 0;
  
    var sat = 0.77;
    var lgt = 0.5;
  
    var diff = 0.2;
    var huePart = 0;
    var step = Math.floor((timeFromUpdate / DataSource.Inst().CooldownPeriod()) / diff);
    switch (step)
    {
      case 0: huePart = 0; break;
      case 1: huePart = 0.09; break;
      case 2: huePart = 0.18; lgt = 0.48; break;
      case 3: huePart = 0.38; lgt = 0.38; break;
      case 4: huePart = 0.81; break;
      default: huePart = 1; break;
    }
    var max_hue = 0.66667;
    var hue = huePart * max_hue;
  
    var rgb = hslToRgb(hue, sat, lgt);
  
    var r = rgb[0].toString(16);
    r = (r.length == 1) ? "0" + r : r;
    var g = rgb[1].toString(16);
    g = (g.length == 1) ? "0" + g : g;
    var b = rgb[2].toString(16);
    b = (b.length == 1) ? "0" + b : b;
    return "#" + r + g + b;
  };

  function hslToRgb(h, s, l) {
    var r, g, b;
  
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if(t < 0)
          t += 1;
        if(t > 1)
          t -= 1;
        if(t < 1/6)
          return p + (q - p) * 6 * t;
        if(t < 1/2)
          return q;
        if(t < 2/3)
          return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
  
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
  
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  function getCardWidth() {
    return columnHandler.getColumnWidth() - 2 * H_OFFSET;
  };

  function getTextMaxHeight() {
    return Math.round(page.getCanvas().getHeight() / 6);
  };

  function getContentAreaWidth(cardWidth) {
    return cardWidth - 2 * TEXT_H_OFFSET;
  };

  var parentMove = this.move;
  this.move = function(h, v) {
    if (!m_isMouseDown) {
      parentMove(h, v);
    }
  };
};

function Popup(cardWidth, description, severity, priority, reproducibility, /** @type {Page} */page) {
  var TEXT_H_OFFSET = 12;
  var TEXT_V_OFFSET = 8;

  var STROKE_COLOR = "#C0BFC1";

  Drawable.call(this, 0, 0, 0, 0, true, page);

  var parentDraw = this.draw;
  this.draw = function() {
    if (this.isDrawn()) {
      return;
    }

    var maxWidth = getPopupMaxWidth();
    var width = 0;
    var height = 0;

    var descriptionGr = createHeaderTextPair(DataSource.Inst().LangReportDetails()["description"] + ": ", description, maxWidth - 2 * TEXT_H_OFFSET);
    descriptionGr.left = TEXT_H_OFFSET;
    descriptionGr.top = TEXT_V_OFFSET;
    width = descriptionGr.getScaledWidth();
    height += TEXT_V_OFFSET + descriptionGr.getScaledHeight();

    var severityGr = createHeaderTextPair(DataSource.Inst().LangReportDetails()["severity"] + ": ", severity, maxWidth - 2 * TEXT_H_OFFSET);
    severityGr.left = TEXT_H_OFFSET;
    severityGr.top = Math.round(height + TEXT_V_OFFSET);
    width = Math.max(severityGr.getScaledWidth(), width);
    height += TEXT_V_OFFSET + severityGr.getScaledHeight();

    var priorityGr = createHeaderTextPair(DataSource.Inst().LangReportDetails()["priority"] + ": ", priority, maxWidth - 2 * TEXT_H_OFFSET);
    priorityGr.left = TEXT_H_OFFSET;
    priorityGr.top = Math.round(height + TEXT_V_OFFSET);
    width = Math.max(priorityGr.getScaledWidth(), width);
    height += TEXT_V_OFFSET + priorityGr.getScaledHeight();

    var reproducibilityGr = createHeaderTextPair(DataSource.Inst().LangReportDetails()["reproducibility"] + ": ", reproducibility, maxWidth - 2 * TEXT_H_OFFSET);
    reproducibilityGr.left = TEXT_H_OFFSET;
    reproducibilityGr.top = Math.round(height + TEXT_V_OFFSET);
    width = Math.max(reproducibilityGr.getScaledWidth(), width);
    height += 2 * TEXT_V_OFFSET + reproducibilityGr.getScaledHeight();

    var back = new fabric.Rect({
      fill: "#FFFFFF",
      stroke: STROKE_COLOR,

      width: Math.round(width + 2 * TEXT_H_OFFSET),
      height: Math.round(height),

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    var card = new fabric.Group([back, descriptionGr, severityGr, priorityGr, reproducibilityGr], {
      hasBorders: false,
      hasControls: false,
      subTargetCheck: false,
      selectable: false
    });

    parentDraw(card);
  };

  function createHeaderTextPair(header, text, maxLineWidth) {
    var headerGr = new fabric.Text(header, {
      fontFamily: "Arial",
      fontSize: fabric.util.parseUnit("12px"),
      fontStyle: "bold",

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    var textGr = createShortenedText(text, Math.round(maxLineWidth - headerGr.getScaledWidth()), page.getCanvas().getHeight(), false);
    textGr.left = Math.round(headerGr.getScaledWidth());

    return new fabric.Group([headerGr, textGr], {
      hasBorders: false,
      hasControls: false,
      subTargetCheck: true,
      selectable: true
    });
  };

  function getPopupMaxWidth() {
    var popupMaxWidth = Math.round(page.getCanvas().getWidth() / 3.5);
    return Math.max(popupMaxWidth, cardWidth);
  };
};

function PopupVisibilityManager(/** @type {Drawable} */popup, /** @type {Page} */page) {
  var TIMEOUT = 800;

  var m_mouseOver = false;
  var m_mouseMoved = false;
  var m_lastPointerPos = null;

  constructor();
  function constructor() {
    setInterval(tryShowPopup, TIMEOUT);
  };

  this.onMouseDown = function() {
    m_mouseOver = false;
    popup.hide();
  };

  this.onMouseOver = function(evt) {
    m_mouseOver = true;
    var pointer = page.getCanvas().getPointer(evt.e);
    m_lastPointerPos = new Position(pointer.x, pointer.y);
  };

  this.onMouseMove = function(evt) {
    m_mouseMoved = true;
    var pointer = page.getCanvas().getPointer(evt.e);
    m_lastPointerPos = new Position(pointer.x, pointer.y);
  };

  this.onMouseOut = function() {
    m_mouseOver = false;
    popup.hide();
  };

  function tryShowPopup() {
    if (m_mouseOver && !m_mouseMoved) {
      popup.setPos(m_lastPointerPos);
    }
    m_mouseMoved = false;
  };
};
