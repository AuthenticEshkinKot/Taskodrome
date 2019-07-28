function Page(canvasName, tab_name) {
  var m_canvas = null;

  constructor();
  function constructor() {
    m_canvas = new fabric.Canvas(canvasName);
    m_canvas.renderOnAddRemove = false;
    m_canvas.isDrawingMode = false;
    m_canvas.selection = false;

    var tab = document.getElementById(tab_name);
    var tab_style = window.getComputedStyle(tab);

    var border_width = parseInt(tab_style.getPropertyValue("border-right-width")) + parseInt(tab_style.getPropertyValue("border-left-width"));

    m_canvas.setWidth(tab.offsetWidth - border_width);
    m_canvas.setHeight(tab.offsetHeight);
    m_canvas.calcOffset();
  };

  this.getCanvas = function() {
    return m_canvas;
  };
};