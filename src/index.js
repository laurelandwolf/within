module.exports = function within (element, parentNode) {

  if (typeof element === 'string') {
    element = document.querySelector(element);
  }

  if (typeof parentNode === 'string') {
    parentNode = document.querySelector(parentNode);
  }

  var parent = parentNode || element.parentNode;
  var sticky = element

  // Using a cloned node to track the position relative
  // to the parent
  var clonedStickyAppended = false;
  var clonedSticky = sticky.cloneNode(true);
  clonedSticky.classList.add('clone');
  clonedSticky.style.visibility = 'hidden';

  var originalRect = sticky.getBoundingClientRect();
  var originalParentRect = parent.getBoundingClientRect();
  var originalFromTopOfParent = originalParentRect.top - originalRect.top;

  var stickyStyles = window.getComputedStyle(sticky);
  var parentStyles = window.getComputedStyle(parent);

  var originalPosition = sticky.style.position;
  var originalTop = sticky.style.top;
  var originalBottom = sticky.style.bottom;
  var originalParentPosition = parent.style.position;

  var fixedToBottom = false;

  function layoutChanged() {

    var rect = sticky.getBoundingClientRect();
    var parentRect = parent.getBoundingClientRect();

    // Calculate these here each time so values change according to parent's layout
    var parentPaddingBottom = parseInt(parentStyles.getPropertyValue('padding-bottom'), 10);
    var stickyMarginBottom = parseInt(stickyStyles.getPropertyValue('margin-bottom'), 10);
    var parentPaddingTop = parseInt(parentStyles.getPropertyValue('padding-top'), 10);
    var stickyMarginTop = parseInt(stickyStyles.getPropertyValue('margin-top'), 10);

    var fromTopOfParent = parentPaddingTop + stickyMarginTop;
    var fromBottomOfParent = parentPaddingBottom + stickyMarginBottom;

    if (parentRect.bottom <= rect.bottom + fromBottomOfParent && rect.top - fromTopOfParent <= 0) {
      fixToBottom(fromBottomOfParent);
    }
    else if (parentRect.top - originalFromTopOfParent - fromTopOfParent > 0) {
      setStatic();
    }
    else {
      setFixed(fromTopOfParent);
    }
  }

  function fixToBottom(fromBottom) {

    parent.style.position = 'relative';
    sticky.style.position = 'absolute';
    sticky.style.bottom = fromBottom + 'px';
    sticky.style.top = 'auto';

    // Set left relative to parent while it's not fixed
    sticky.style.left = clonedSticky.offsetLeft + 'px';

    fixedToBottom = true;
  }

  function resetFixedToBottom() {

    if (!fixedToBottom) {
      return;
    }

    parent.style.position = originalParentPosition;
    sticky.style.position = originalPosition;
    sticky.style.bottom = originalBottom;

    fixedToBottom = false;

    setPosition();
  }

  function setFixed(fromTop) {

    resetFixedToBottom();

    sticky.style.position = 'fixed';
    sticky.style.top = fromTop + 'px';

    if (!clonedStickyAppended) {
      sticky.parentNode.appendChild(clonedSticky);
      clonedStickyAppended = true;
    }

    setPosition();
  }

  function setStatic() {

    sticky.style.position = originalPosition;
    sticky.style.top = originalTop;

    if (clonedStickyAppended) {
      sticky.parentNode.removeChild(clonedSticky);
      clonedStickyAppended = false;
    }
  }

  function setPosition () {

    if (clonedStickyAppended) {
      sticky.style.left = clonedSticky.getBoundingClientRect().left + 'px';
    }
  }

  var EVENT_TYPES = ['load', 'scroll', 'resize', 'touchmove', 'touchend'];

  EVENT_TYPES.forEach(function (eventName) {

    window.addEventListener(eventName, layoutChanged);
  });

  return function removeEventListeners () {

    EVENT_TYPES.forEach(function (eventName) {

      window.removeEventListener(eventName, layoutChanged);
    });

    // Ensure that this goes away
    if (clonedSticky.parentNode) {
      clonedSticky.parentNode.removeChild(clonedSticky);
    }
  };
};
