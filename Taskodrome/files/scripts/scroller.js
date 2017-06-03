var SCROLL_BASE_STEP = 20;

var m_scrollTimer = null;

function createScroller(canvas, parentDiv) {
  function canvas_onmousedown(evt) {
    canvas.m_down = true;
  };
  canvas.addEventListener("mousedown", canvas_onmousedown);

  function canvas_onmouseup(evt) {
    canvas.m_down = false;
    if (m_scrollTimer != null) {
      window.clearInterval(m_scrollTimer);
      m_scrollTimer = null;
    }
  };
  canvas.addEventListener("mouseup", canvas_onmouseup);

  var scrollStep = SCROLL_BASE_STEP;
  var scrollInterval = 40;
  var rect = parentDiv.getBoundingClientRect();

  function scrollRight() {
    parentDiv.scrollLeft += scrollStep;
  };

  function scrollLeft() {
    parentDiv.scrollLeft -= scrollStep;
  };

  function wnd_onkeydown(evt) {
    var fnc = null;
    switch (evt.keyCode) {
      case 37: fnc = scrollLeft(); break;
      case 39: fnc = scrollRight(); break;
      default: return;
    }
    if (m_scrollTimer == null) {
      m_scrollTimer = window.setInterval(fnc, scrollInterval);
    }
  };
  window.addEventListener("keydown", wnd_onkeydown);

  function wnd_onkeyup(evt) {
    if (m_scrollTimer != null) {
      window.clearInterval(m_scrollTimer);
      m_scrollTimer = null;
    }
  };
  window.addEventListener("keyup", wnd_onkeyup);

  function canvas_onmousemove(evt) {
    if (!canvas.m_down)
      return;

    var mouseX = evt.clientX - rect.left;
    var actArea = rect.width * 0.15;
    var rightEdge = rect.width - actArea;
    if (mouseX > rightEdge) {
      scrollStep = SCROLL_BASE_STEP * ((mouseX - rightEdge) / actArea);
      if (m_scrollTimer != null)
        return;
      m_scrollTimer = window.setInterval(scrollRight, scrollInterval);
    } else if (mouseX < actArea) {
      scrollStep = SCROLL_BASE_STEP * ((actArea - mouseX) / actArea);
      if (m_scrollTimer != null)
        return;
      m_scrollTimer = window.setInterval(scrollLeft, scrollInterval);
    } else if (m_scrollTimer != null) {
      window.clearInterval(m_scrollTimer);
      m_scrollTimer = null;
    }
  };
  canvas.addEventListener("mousemove", canvas_onmousemove);
};
