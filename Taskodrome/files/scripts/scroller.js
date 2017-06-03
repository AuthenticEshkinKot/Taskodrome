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

  var scrollStep = 15;
  var scrollInterval = 40;

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

    var rect = parentDiv.getBoundingClientRect();
    var mouseX = evt.clientX - rect.left;
    var actArea = rect.width * 0.15;
    if (mouseX > rect.width - actArea) {
      if (m_scrollTimer != null)
        return;
      m_scrollTimer = window.setInterval(scrollRight, scrollInterval);
    } else if (mouseX < actArea) {
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
