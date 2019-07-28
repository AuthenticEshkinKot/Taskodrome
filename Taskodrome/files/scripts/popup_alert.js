function PopupAlert(/** @type {Page} */page) {
  var m_text_queue = [];
  var m_show_index = 0;

  var m_popup = { back: null, msg: null, group: null };

  var H_OFFSET = 20;
  var V_OFFSET = 20;

  var TIMEOUT = 3000;
  var DURATION = 500;

  constructor();
  function constructor() {
    m_popup.back = new fabric.Rect({
      fill: "#F9F9F9",
      stroke: "#C0BFC1",

      rx: 1,
      ry: 1,

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    m_popup.group = new fabric.Group([m_popup.back], {
      opacity: 0,

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    page.getCanvas().add(m_popup.group);
  };

  this.show = function(msgText) {
    m_text_queue.push(msgText);

    if (m_show_index == m_text_queue.length - 1) {
      redraw(msgText);
    }
  };

  function redraw(msgText) {
    m_popup.group.remove(m_popup.back);
    m_popup.group.remove(m_popup.msg);

    m_popup.msg = new fabric.Text(msgText, {
      fontFamily: "Arial",
      fontSize: fabric.util.parseUnit("20px"),
      fill: "#428AC8",

      evented: false,
      hasBorders: false,
      hasControls: false,
      selectable: false
    });

    m_popup.back.left = -H_OFFSET;
    m_popup.back.top = -V_OFFSET;
    m_popup.back.width = Math.round(m_popup.msg.getScaledWidth()) + 2 * H_OFFSET;
    m_popup.back.height = Math.round(m_popup.msg.getScaledHeight()) + 2 * V_OFFSET;

    m_popup.group.addWithUpdate(m_popup.back);
    m_popup.group.addWithUpdate(m_popup.msg);
    m_popup.group.left = Math.round((page.getCanvas().getWidth() - m_popup.back.getScaledWidth()) / 2);
    m_popup.group.top = 0;
    m_popup.group.opacity = 1;

    setTimeout(startAnimation, TIMEOUT);

    m_popup.group.dirty = true;
    m_popup.group.bringToFront();
    page.getCanvas().requestRenderAll();
  };

  function tryNextMsg() {
    ++m_show_index;

    if (m_show_index != m_text_queue.length) {
      redraw(m_text_queue[m_show_index]);
      return true;
    } else {
      m_text_queue = [];
      m_show_index = 0;
    }

    return false;
  };

  function startAnimation() {
    m_popup.group.animate("opacity", "0", { onChange: page.getCanvas().requestRenderAll.bind(page.getCanvas()), duration: DURATION, onComplete: tryNextMsg });
  };
};

var MessageTypeEnum = {
  NO_STATUS_TRANSITION : 0,
  DEPENDS_ON_ISSUES : 1
};

var MessageGenerator = (function() {
  var m_inst = null;

  var m_no_status_trans = "";
  var m_depends_on_issues = "";

  var Get = function(/** @type {MessageTypeEnum} */type, argumentList) {
    var res = "";
    switch (type) {
      case MessageTypeEnum.NO_STATUS_TRANSITION: {
        res = m_no_status_trans.replace("$1", "\"" + argumentList[0] + "\"").replace("$2", "\"" + argumentList[1] + "\"");
      } break;
      case MessageTypeEnum.DEPENDS_ON_ISSUES: {
        res = m_depends_on_issues.replace("$1", argumentList[0]);
        var blockers = "";
        var addIssueNumber = function(item) {
          blockers += item + ", ";
        };
        argumentList[1].forEach(addIssueNumber);
        blockers = blockers.substr(0, blockers.length - 2);

        res = res.replace("$2", blockers);
      } break;
      default: console.log("No such message type - " + type); break;
    }
    return res;
  };

  var CreateInst = function() {
    m_no_status_trans = document.getElementById("lang_no_status_transition").getAttribute("value");
    m_depends_on_issues = document.getElementById("lang_depends_on_issues").getAttribute("value");
    return {
      Get: Get
    };
  };

  return {
    Inst: function () {
      return m_inst || (m_inst = CreateInst());
    }
  };
})();
