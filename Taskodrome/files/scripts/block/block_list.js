function BlockList(/** @type {Page} */page, scroller, getCardBlockName) {
  var m_list = [];
  var m_prev = null;
  var m_header = null;
  var m_footer = null;
  var m_scroller = scroller;
  var m_extra_v_offset = 0;

  this.pushCard = function(/** @type {Card} */card) {
    return m_list[m_list.length - 1].pushCard(card);
  };

  this.pushBlock = function(/** @type {Block} */block) {
    block.setOnMouseUp(this.onMouseUpBlock);
    m_list.push(block);
  };

  this.setExtraVOffset = function(extra_v_offset) {
    function setExtraVOffset(item) {
      item.setExtraVOffset(extra_v_offset);
    };
    m_list.forEach(setExtraVOffset);
    m_extra_v_offset = extra_v_offset;
  };

  this.draw = function() {
    var top = m_extra_v_offset;
    function drawItem(item) {
      if (item.toBeDrawn()) {
        item.draw();
      } else {
        item.undraw();
      }
      item.setTop(top);
      item.show();
      top = item.m_bounds.bottom;
    };
    m_list.forEach(drawItem);
  };

  this.scrollV = function(v) {
    if (m_list.length == 0) {
      return 0;
    }

    v = limitScrollTop(v);
    v = limitScrollBottom(v);

    function moveItem(item) {
      item.scroll(0, v);
    };
    m_list.forEach(moveItem);

    this.setPHF();

    return v;
  };

  function limitScrollTop(v) {
    if (v > 0 && m_list[0].m_bounds.top + v > m_extra_v_offset) {
      v = m_extra_v_offset - m_list[0].m_bounds.top;
    }
    return v;
  };

  function limitScrollBottom(v) {
    if (v < 0 && m_list[m_list.length - 1].m_bounds.bottom - page.getCanvas().getHeight() + v < 0) {
      v = Math.min(page.getCanvas().getHeight() - m_list[m_list.length - 1].m_bounds.bottom, 0);
    }
    return v;
  };

  this.scrollH = function(h) {
    function moveBlock(item) {
      item.scroll(h, 0);
    };
    m_list.forEach(moveBlock);
  };

  this.setPHF = function() {
    var header_i = -1;
    var footer_i = -1;
    for (var i = 0; i != m_list.length; ++i) {
      if (m_list[i].canBeHeader()) {
        header_i = i;
      }

      if (footer_i == -1 && m_list[i].canBeFooter()) {
        footer_i = i;
      }
    }

    if (header_i != -1) {
      updateHeader(m_list[header_i]);
      while (--header_i != -1 && !m_list[header_i].canBePrev()) { ; }
      if (header_i != -1) {
        updatePrev(m_list[header_i]);
      } else {
        updatePrev(null);
      }
    } else {
      updateHeader(null);
    }

    if (footer_i != -1) {
      updateFooter(m_list[footer_i]);
    } else {
      updateFooter(null);
    }
  };

  this.getHeight = function() {
    return ((m_list.length != 0) ? m_list[m_list.length - 1].m_bounds.bottom - m_list[0].m_bounds.top : 0);
  };

  this.getWidth = function() {
    return ((m_list.length != 0) ? m_list[0].m_bounds.right : page.getCanvas().getWidth());
  };

  this.getScrolledTop = function() {
    return m_list[0].m_bounds.top - m_extra_v_offset;
  };

  this.onMouseUpBlock = function(name) {
    for (var i = 0; i != m_list.length; ++i) {
      if (m_list[i].m_name == name) {
        m_scroller.run(-m_list[i].m_bounds.top + m_extra_v_offset);
        return;
      }
    }
  };

  this.getCoords_byCard = function(/** @type {Card} */card) {
    var block_i = -1;
    for (var i = 0; block_i == -1 && i != m_list.length; ++i) {
      if (m_list[i].m_name == getCardBlockName(card)) {
        block_i = i;
      }
    }

    if (block_i == -1) {
      return new CardCoords();
    }

    var res = m_list[block_i].getCoords_byCard(card);
    res.m_block = block_i;
    return res;
  };

  this.getCoords_byPos = function(/** @type {Position} */pos) {
    var block_i = -1;
    for (var i = 0; i != m_list.length; ++i) {
      if (m_list[i].toBeDrawn() && m_list[i].isPosLower(pos)) {
        block_i = i;
      }
    }

    if (block_i == -1) {
      return new CardCoords();
    }

    var res = m_list[block_i].getCoords_byPos(pos);
    res.m_block = block_i;
    return res;
  };

  this.getCoords = function(blockName, columnIndex, cardId) {
    var block_i = -1;
    for (var i = 0; block_i == -1 && i != m_list.length; ++i) {
      if (m_list[i].m_name == blockName) {
        block_i = i;
      }
    }

    if (block_i == -1) {
      return new CardCoords();
    }

    var res = m_list[block_i].getCoords(columnIndex, cardId);
    res.m_block = block_i;
    return res;
  };

  this.removeCard = function(/** @type {CardCoords} */coords, fixedBlockIndex) {
    var oldBottom = m_list[coords.m_block].m_bounds.bottom;
    var res = m_list[coords.m_block].removeCard(coords);
    var newBottom = m_list[coords.m_block].m_bounds.bottom;

    function liftup(v) {
      for (var i = coords.m_block + 1; i != m_list.length; ++i) {
        m_list[i].scroll(0, -v);
      }
    };

    function putdown(v) {
      for (var i = coords.m_block; i != -1; --i) {
        m_list[i].scroll(0, v);
      }
    };

    var v = oldBottom - newBottom;
    if (v > 0) {
      if (fixedBlockIndex <= coords.m_block && limitScrollBottom(-v) == -v) {
        liftup(v);
      } else {
        if (limitScrollTop(v) == v) {
          putdown(v);
        } else {
          liftup(v);
        }
      }

      this.setPHF();
    }

    return res;
  };

  this.addCard = function(/** @type {Card} */card, /** @type {CardCoords} */coords) {
    var oldBottom = m_list[coords.m_block].m_bounds.bottom;
    m_list[coords.m_block].addCard(card, coords);
    var newBottom = m_list[coords.m_block].m_bounds.bottom;

    function putdown(v) {
      for (var i = coords.m_block + 1; i != m_list.length; ++i) {
        m_list[i].scroll(0, v);
      }
    };

    var v = newBottom - oldBottom;
    if (v > 0) {
      putdown(v);
      this.setPHF();
    }
  };

  this.restoreCard = function(/** @type {Card} */card) {
    var block_i = -1;
    for (var i = 0; block_i == -1 && i != m_list.length; ++i) {
      if (m_list[i].m_name == getCardBlockName(card)) {
        block_i = i;
        m_list[block_i].setTop(m_list[block_i].m_bounds.top);
      }
    }
  };

  this.updateCard = function(/** @type {CardCoords} */coords, /** @type {Card} */card) {
    var c = this.removeCard(coords, coords.m_block);
    c.update(card);
    this.addCard(c, coords);
  };

  this.setEmptyBlockVisibility = function(status) {
    var anchor_i = 0;
    var anchor_top = m_extra_v_offset;
    var anchor_found = false;
    function showIfEmpty(item, i) {
      item.setShowIfEmpty(status);
      if (!anchor_found && item.toBeDrawn() && item.m_bounds.bottom > m_extra_v_offset) {
        anchor_i = i;
        anchor_top = item.m_bounds.top;
        anchor_found = true;
      }
    };
    m_list.forEach(showIfEmpty);

    this.draw();

    if (this.getHeight() <= page.getCanvas().getHeight() - m_extra_v_offset) {
      anchor_top = m_extra_v_offset;
    }

    this.scrollV(anchor_top - m_list[anchor_i].m_bounds.top);
  };

  function updatePrev(newPrev) {
    if (m_prev == newPrev) {
      return;
    }
  
    if (m_prev != null) {
      m_prev.setPrev(false);
    }
    m_prev = newPrev;
    if (m_prev != null) {
      m_prev.setPrev(true);
    }
  };

  function updateHeader(newHeader) {
    if (m_header == newHeader) {
      return;
    }
  
    if (m_header != null) {
      m_header.setHeader(false);
    }
    m_header = newHeader;
    if (m_header != null) {
      m_header.setHeader(true);
    }
  };

  function updateFooter(newFooter) {
    if (m_footer == newFooter) {
      return;
    }
  
    if (m_footer != null) {
      m_footer.setFooter(false);
    }
    m_footer = newFooter;
    if (m_footer != null) {
      m_footer.setFooter(true);
    }
  };
};