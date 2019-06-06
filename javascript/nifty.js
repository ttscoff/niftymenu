/**
 * @namespace Prefs
 * @description Utility methods for storing/retrieving preferences
 */
const Prefs = (function() {
  'use strict';

  /**
   * Retrieve preference key as a boolean value
   * @memberof   Prefs
   *
   * @param      {string}   key     The key
   * @return     {boolean}  True for positive integer or truthy string
   */
  const getBool = (key) => {
    let value = Prefs.get(key);
    if (Number(value)) {
      return Boolean(Number(value));
    } else {
      if (/(y(es)?|true)/i.test(value)) {
        return true;
      }
      return false;
    }
  };

  /**
   * Set a preference value
   * @memberof   Prefs
   *
   * @param      {string}  key     The localStorage key
   * @param      {string}  value   Value to set for key
   */
  const set = (key, value) => {
    localStorage.setItem(key, value);
  };

  /**
   * Retrive the raw preference for a key
   * @memberof   Prefs
   *
   * @param      {string}  key     The localStorage key
   * @return     {string}  raw string from preferences, not decoded or JSONified
   */
  const get = (key) => {
    return localStorage.getItem(key);
  };

  const Prefs = {
    set,
    get,
    getBool
  };

  return Prefs;
}());

/**
 * @namespace Nifty
 * @description Automation API and event handlers
 */
const Nifty = (function() {
  'use strict';

  const init = () => {
    getMenuItemTitles();
  };

  /**
   * @namespace Nifty.util
   * @memberof  Nifty
   * @description DOM/interface utilities
   */

  /**
   * search for a menu item by string and click
   * @memberof   Nifty
   *
   * @param      {string}   str     The string to search and click
   * @param      {boolean}  force   If false/undefined, clicking a focused item
   *                                will hide it. Pass true to always open the
   *                                item.
   * @return     {null}     Nothing
   */
  const click = (str, force=false) => {
    if (force) {
      Nifty.util.clearClicks(true);
    }

    if (!str || /^\s*$/.test(str)) {
      Nifty.util.clearClicks(true);
      return;
    }
    let match = Nifty.fuzzyFind(str);
    if (match) {
      match.click();
      match.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});
    }
  };

  /**
   * search for a menu item by string and double-click
   * @memberof   Nifty
   *
   * @param      {string}   str     The string to search and double click
   * @param      {boolean}  force   If false/undefined, clicking a focused item
   *                                will hide it. Pass true to always open the
   *                                item.
   * @return     {null}     Nothing
   */
  const dblClick = (str, force=false) => {

    if (force) {
      Nifty.util.clearClicks(true);
    }

    if (!str || /^\s*$/.test(str)) {
      Nifty.util.clearClicks(true);
      return;
    }
    let match = Nifty.fuzzyFind(str);
    if (match) {
      match.dblclick();
      match.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});
    }
  };

  /**
   * Case insensitive string match for menu item search. Tries: 1. Match from
   * the first word in a menu item 2. Match the beginning of any word in a menu
   * item 3. Match the full string anywhere in a menu item
   * @memberof   Nifty
   *
   * @param      {string}  str     The string to search for
   * @return     {jQuery}  single jQuery element or null
   */
  const fuzzyFind = (str) => {
    if (/^\s*$/.test(str)) {
      return null;
    }

    let menuItems = $('ul ul li'),
        rxs = [
          new RegExp('^'+str,'i'),
          new RegExp('\\b'+str,'i'),
          new RegExp(str,'i')
          ],
        test;


    for (let rx in rxs) {
      test = menuItems.filter(function(i,n) {
        let comp = n.innerText.split("\n")[0].toLowerCase();

        if (rxs[rx].test(comp)) {
          return true;
        } else {
          return false;
        }
      });

      if (test.length > 0) {
        return test.first();
      }
    }

    return null;
  };


  /**
   * Get an array of all submenu item titles
   * @private
   *
   * @return     {array}  The menu item titles.
   */
  const getMenuItemTitles = () => {
    if (Nifty.menuItemTitles.length > 0) {
      return Nifty.menuItemTitles;
    }
    Nifty.menuItemTitles = [];
    $('ul ul li').each(function(i,n) {
      Nifty.menuItemTitles.push($(n).text().split(/\n/)[0]);
    });
    return Nifty.menuItemTitles;
  };

  /**
   * click handler for menu items
   * @private
   * @param      {event}   e       Event
   * @return     {boolean}  continue handling event
   */
  const itemClick = (e) => {
    e.preventDefault();

    let $this = $(e.target);

    $('li.lastclicked').removeClass('lastclicked');
    $('.persist').removeClass('persist');

    if (e.target.tagName === 'BODY') {
      $('.clicked').removeClass('clicked');
    } else {
      if ($this.hasClass('clicked')) {
        $('.clicked').removeClass('clicked');
        return false;
      } else {
        $('li.clicked').removeClass('clicked');
        $this.parents('li').addClass('clicked');
        $this.addClass('clicked');
      }

      if (e.type === 'dblclick') {
        $this.addClass('lastclicked');
      }
    }

    return false;
  };
  /**
   * handler for all clicks within the .controls element
   * @private
   * @param      {event}   e       Event
   * @return     {boolean}  continue handling event
   */
  const controlsClick = (e) => {
    e.preventDefault();
    let $this = e.target;

    switch($this.id) {
      case 'darkModeToggle':
        toggleDarkMode();
        break;
      case 'exposeToggle':
        toggleExpose();
        break;
      case 'backgroundToggle':
        toggleBG();
        break;
      default:
        console.info('Element ID unrecognized');
    }

    return false;
  };

  /**
   * Sets the background image on or off. Use the boolean paramater to
   * determine which.
   * @memberof   Nifty.util
   * @param      {boolean}  bool    true turns background image on,
   *                                false for off
   */
  const setBG = (bool) => {
    let $body = $('body');
    if (bool) {
      $body.addClass('bgimage');
    } else {
      $body.removeClass('bgimage');
    }
  };

  /**
   * Toggle background image
   * @memberof   Nifty.util
   *
   * @return     {null}  Nothing
   */
  const toggleBG = () => {
    let $body = $('body');
    if ($body.hasClass('bgimage')) {
      $body.removeClass('bgimage');
      Prefs.set('bgimage',0);
    } else {
      $body.addClass('bgimage');
      Prefs.set('bgimage',1);
    }
  };

  /**
   * Sets Dark Mode on or off. Use the boolean paramater to determine which.
   * @memberof   Nifty.util
   *
   * @param      {boolean}  bool    true turns Dark Mode on, false for off
   */
  const setDarkMode = (bool) => {
    let $body = $('body');
    if (bool) {
      $body.addClass('dark');
    } else {
      $body.removeClass('dark');
    }
  };

  /**
   * Toggle Dark Mode
   * @memberof   Nifty.util
   *
   * @return     {null}  Nothing
   */
  const toggleDarkMode = () => {
    let $body = $('body');
    let test = $('body').hasClass('dark');

    if (test) {
      $body.removeClass('dark');
      Prefs.set('darkmode',0);
    } else {
      $body.addClass('dark');
      Prefs.set('darkmode',1);
    }
  };

  /**
   * Force Expose on or off. Use the boolean paramater to
   * determine which.
   * @memberof   Nifty.util
   * @param      {boolean}  bool    true turns Expose on,
   *                                false for off
   */
  const setExpose = (bool) => {
    let $body = $('body');
    if (bool) {
      $body.addClass('expose');
    } else {
      $body.removeClass('expose');
    }
  };

  /**
   * Toggle Expose
   * @memberof   Nifty.util
   *
   * @return     {null}  Nothing
   */
  const toggleExpose = () => {
    let $body = $('body');
    if ($body.hasClass('expose')) {
      $body.removeClass('expose');
      Prefs.set('expose',0);
    } else {
      $body.addClass('expose');
      Prefs.set('expose',1);
    }
  };

  /**
   * reveal and focus the help search field
   * @memberof   Nifty.util
   *
   * @param      {event}    e       Event
   * @return     {boolean}  continue handling event
   */
  const focusSearch = (e) => {
    e.preventDefault();
    $('li.lastclicked').removeClass('lastclicked');
    $('.clicked').removeClass('clicked');
    let $search = $('.helpsearch').first();
    $search.parents('li').addClass('clicked persist');
    $search.get(0).scrollIntoView({behavior: "smooth", block: "end", inline: "end"});
    $('input',$search).focus();
    return false;
  };

  /**
   * Clear all active clicks (menu items held in place)
   * @memberof   Nifty.util
   *
   * @param      {boolean}  persist  The help menu gets a special class to keep
   *                                 it open while other menus are active, even
   *                                 when it's not hovered. Setting this to true
   *                                 removes that class as well.
   */
  const clearClicks = (persist) => {
    $('li.lastclicked').removeClass('lastclicked');
    $('.clicked').removeClass('clicked');
    if (persist) {
      $('.persist').removeClass('persist');
    }
  };

  /**
   * live search for the help menu, function ~ macOS
   * @private
   *
   * @param      {event}    e       Event
   */
  const liveSearch = (e) => {

    let $field = $('.helpsearch input'),
        string = $field.val(),
        titles, results, title,
        shouldScroll = false;

    if (e.code === 'Escape') {
      e.preventDefault();
      $field.val('').blur();
      clearClicks(true);
      return true;
    }

    if (e.code === 'Enter' || e.code === 'Return') {
      e.preventDefault();
      $('.persist').removeClass('persist');
      shouldScroll = true;
      // return true;
    }

    if (string.length < 2) {
      clearClicks(false);
      return true;
    }

    titles = getMenuItemTitles();
    results = fuzzysort.go(string, titles);

    if (results.length) {
      title = results[0].target;
    } else {
      title = string;
    }

    let $item = fuzzyFind(title);

    if ($item) {
      clearClicks(false);
      $item.parents('li').addClass('clicked');
      $item.addClass('clicked');

      if (shouldScroll) {
        $field.blur();
        $item.get(0).scrollIntoView({behavior: "smooth", block: "end", inline: "center"});
      }
    } else {
      clearClicks(false);
    }

    return true;
  };

  const Nifty = {
    menuItemTitles: [],
    init,
    click,
    dblClick,
    fuzzyFind,
    // handlers
    handlers: {
      itemClick,
      controlsClick,
      liveSearch
      },
    util: {
      setDarkMode,
      toggleDarkMode,
      setExpose,
      toggleExpose,
      setBG,
      toggleBG,
      focusSearch,
      clearClicks
      }
  };

  return Nifty;
}());

$(function() {
  Nifty.init();

  // restore preferences

  if (Prefs.getBool('darkmode')) {
    Nifty.util.toggleDarkMode();
  }
  if (Prefs.getBool('expose')) {
    Nifty.util.toggleExpose();
  }
  if (Prefs.getBool('bgimage')) {
    Nifty.util.toggleBG();
  }

  // set up handlers

  $('body,li').on('click dblclick', Nifty.handlers.itemClick);

  $('span','.controls').on('click', Nifty.handlers.controlsClick);

  $('.helpsearch input').on('keydown', Nifty.handlers.liveSearch);

  $('.helpsearch').on('click', Nifty.util.focusSearch);

  $('.helpsearch').on('blur', function() {
    $('.persist').removeClass('persist');
  });

  // bind some keys

  Mousetrap.bind('shift+/', Nifty.util.focusSearch);
  Mousetrap.bind('shift+d', Nifty.util.toggleDarkMode);
  Mousetrap.bind('shift+e', Nifty.util.toggleExpose);
});
