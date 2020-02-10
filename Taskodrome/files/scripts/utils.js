function checkExistence(functionName, obj) {
  var exists = (obj != null);
  console.log(functionName + ": exists - " + exists);
  if (exists) {
    console.log(functionName + ": length - " + obj.length);
  }
  return exists;
};

function openBoard(board) {
  setHrefMark(window, board);

  switch (board) {
    case "sg":
      document.getElementById("radio_sg").checked = true;
      document.getElementById("radio_dg").checked = false;
      document.getElementById("radio_rg").checked = false;
      break;
    case "dg":
      document.getElementById("radio_dg").checked = true;
      document.getElementById("radio_sg").checked = false;
      document.getElementById("radio_rg").checked = false;
      break;
    case "rg":
      document.getElementById("radio_rg").checked = true;
      document.getElementById("radio_sg").checked = false;
      document.getElementById("radio_dg").checked = false;
      break;
    default:
      console.log("Unknown board id - " + board);
  }
};

function setHrefMark(window, mark) {
  var href = window.location.href;
  var mark_index = href.lastIndexOf("#");

  if(mark_index == -1) {
    window.location.href = href + "#" + mark;
  } else {
    window.location.href = href.substr(0, mark_index + 1) + mark;
  }
};

function addRadioCallback(window, mark, radioId) {
  function onRadioClick() {
    setHrefMark(window, mark);
  };
  document.getElementById(radioId).onclick = onRadioClick;
};

function Position(left, top) {
  this.m_left = left;
  this.m_top = top;
};

function Size(width, height) {
  this.m_width = width;
  this.m_height = height;
};

function CardCoords() {
  this.m_block = -1;
  this.m_column = -1;
  this.m_index = -1;

  this.isValid = function() {
    return this.m_block != -1 && this.m_column != -1 && this.m_index != -1;
  };

  this.equal = function(/** @type {CardCoords} */coords) {
    return this.m_block == coords.m_block && this.m_column == coords.m_column && this.m_index == coords.m_index;
  };

  this.inFactEqual = function(/** @type {CardCoords} */coords) {
    return this.m_block == coords.m_block && this.m_column == coords.m_column;
  };
};

function getPathToMantisFile(window, filename) {
  var protocol = window.location.protocol;
  var host = window.location.host;

  var path = window.location.pathname.substr(0, window.location.pathname.lastIndexOf("/"));

  var result = protocol + "//" + host + path + "/" + filename;

  return result;
};

function createShortenedText(text, maxWidth, maxHeight, isSingleLine) {
  var textGr = null;
  var resWidth = null;
  var resHeight = null;
  var shortenedText = text;

  var fontSize = fabric.util.parseUnit("12px");

  do {
    if (isSingleLine) {
      textGr = new fabric.Text(shortenedText, {
        fontFamily: "Arial",
        fontSize: fontSize,

        evented: false,
        hasBorders: false,
        hasControls: false,
        selectable: false
      });
    } else {
      textGr = new fabric.Textbox(shortenedText, {
        fontFamily: "Arial",
        fontSize: fontSize,

        width: maxWidth - 2,

        evented: false,
        hasBorders: false,
        hasControls: false,
        selectable: false
      });
    }

    resWidth = Math.round(textGr.getScaledWidth());
    resHeight = Math.round(textGr.getScaledHeight());

    if (shortenedText.length < 8) {
      return textGr;
    }

    var subtract = 3;

    if (!isSingleLine) {
      var removeChars = 0;
      if (resHeight > maxHeight) {
        var currentHeight = resHeight;
        for (var i = textGr.textLines.length - 1; i >= 0; --i) {
          currentHeight -= textGr.getHeightOfLine(i);
          removeChars += textGr.textLines[i].length;
          if (currentHeight <= maxHeight) {
            break;
          }
        }
      } else if (resWidth > maxWidth && textGr.textLines.length > 1) {
        var longestLineIndex = textGr.textLines.length - 1;
        for (var i = textGr.textLines.length - 2; i != -1; --i)
        {
          if (textGr.textLines[i].length > textGr.textLines[longestLineIndex].length) {
            longestLineIndex = i;
          }
        }

        for (var i = textGr.textLines.length - 1; i > longestLineIndex; --i) {
          removeChars += textGr.textLines[i].length;
        }
      }

      if (removeChars > subtract) {
        subtract = removeChars;
      }
    }

    text = text.substring(0, text.length - subtract);
    shortenedText = text + "...";
  } while (resWidth > maxWidth || resHeight > maxHeight);

  return textGr;
};