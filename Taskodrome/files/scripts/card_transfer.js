function CardTransferEvent(/** @type {Card} */card, /** @type {Position} */pos) {
  this.m_card = card;
  this.m_pos = pos;
};

function CardTransferHandler(/** @type {CardTransferNotifier} */cardTransferNotifier) {
  var m_card = null;

  this.Start = function(/** @type {Card} */card) {
    m_card = card;
  };

  this.Finish = function(/** @type {Position} */pos) {
    cardTransferNotifier.Notify(m_card, pos);
  };
};

function CardTransferNotifier() {
  var m_listeners = [];

  this.RegisterListener = function(obj) {
    m_listeners.push(obj);
  };

  this.Notify = function(/** @type {Card} */card, /** @type {Position} */pos) {
    var event = new CardTransferEvent(card, pos);
    function sendEvent(item) {
      item.transferCard(event);
    };
    m_listeners.forEach(sendEvent);
  };
};