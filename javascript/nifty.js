/**
 * @namespace Prefs
 * @description Utility methods for storing/retrieving preferences
 */
const Prefs = (function() {
  'use strict';

  const CONFIG_KEY = 'niftyPrefs';

  const defaults = {
    'arrowStyle' : 'arrow',
    'bgimage' : 1,
    'expose' : 0,
    'darkmode' : 0
  };

  let config = null;

  const getConfig = () => {
    if (!config) {
      let storedConfig = JSON.parse(localStorage.getItem(CONFIG_KEY));

      if (storedConfig) {
        config = $.extend({}, defaults, storedConfig);
      } else {
        config = defaults;
      }

      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }

    return config;
  };

  /**
   * Retrieve preference key as a boolean value
   * @memberof   Prefs
   *
   * @param      {string}   key     The key
   * @return     {boolean}  True for positive integer or truthy string
   */
  const getBool = (key) => {
    let value = get(key);
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
   * @param      {string}  key     The config item's key
   * @param      {string}  value   Value to set for key
   */
  const set = (key, value) => {
    config = get();
    config[key] = value;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  };

  /**
   * Retrive the raw preference for a key
   * @memberof   Prefs
   *
   * @param      {string}  key     The config item's key
   * @return     {string}  raw string from preferences, not decoded or JSONified
   */
  const get = (key) => {

    let _config = getConfig();

    if (_config && key) {
      if (_config.hasOwnProperty(key)) {
        return config[key];
      } else {
        return null;
      }
      return ;
    } else {
      return _config;
    }

  };

  const Prefs = {
    config,
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

  let config;

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

  const itemForPath = (path) => {
    return $('li').filter(function(i,n) {
      if ($(n).data('path') === path) {
        return true;
      }
      return false;
    }).first();
  };

  /**
   * Case insensitive string match for menu item search. Use / to separate
   * heirarchical menu search items
   * @memberof   Nifty
   * @example  Nifty.fuzzyFind('insert/toc/section')
   *
   * @param      {string}  query   The string to search for
   * @return     {jQuery}  single jQuery element or null
   */
  const fuzzyFind = (query) => {
    if (/^\s*$/.test(query)) {
      return null;
    }

    query = query.replace(/>/g,"/");

    let titles = getOrderedMenuItemTitles();
    let results = fuzzysort.go(query, titles);
    if (results.length) {
      return itemForPath(results[0].target);
    } else {
      return null;
    }
  };

  /**
   * Get an array of all item tiles with hierarchy
   * @private
   *
   * @return     {array}  The menu item titles.
   */
  const getOrderedMenuItemTitles = () => {
    if (Nifty.orderedMenuItemTitles.length > 0) {
      return Nifty.orderedMenuItemTitles;
    }
    let titles = [];

    $('li').each(function(i,n) {
      let thisTitle = n.innerText.split(/\n/)[0].trim();
      $(n).parents('li').each(function(i,n) {
        if (n.innerText.length) {
          thisTitle = n.innerText.split(/\n/)[0].trim() + "/" + thisTitle;
        }
      });
      $(n).data('path',thisTitle);
      titles.push(thisTitle);
    });
    Nifty.orderedMenuItemTitles = titles;
    return Nifty.orderedMenuItemTitles;
  };

  /**
   * @namespace Nifty.callout
   * @memberof  Nifty
   * @description Methods for adding callouts to items
   */

  /**
   * Sets the arrow callout
   * @memberof   Nifty.callout
   *
   * @param      {boolean}  bool    Add or remove arrow
   * @param      {element}   el     DOM element or jQuery object, applies to all .arrow if empty
   * @return     {boolean}  Result
   */
  const setArrow = (bool, el) => {
    if (!el && !bool) {
      $('.arrow').each(function(i,n) {
        setArrow(false,$(n));
      });
      return;
    }

    if (!(el instanceof jQuery)) {
      el = $(el);
    }

    if (el.get(0).tagName !== 'LI') {
      el = el.parents('li').first();
    }

    if (bool) {
      setArrow(false);
      setShortcut(false);
      const style = Prefs.get('arrowStyle') || 'arrow';
      const direction = el.find('ul').length ? 'left' : 'right';
      $('.clicked').removeClass('clicked');
      el.addClass('arrow arrow-'+style+' clicked '+direction).append('<b><i></i></b>');
      el.parents('li').addClass('clicked');
    } else {
      el.removeClass('arrow arrow-arrow arrow-circle').find('b').remove();
    }
  };

  /**
   * Toggles the arrow callout
   * @memberof   Nifty.callout
   *
   * @param      {jquery}   el      jQuery object, all .arrow if empty
   * @return     {boolean}  Result
   */
  const toggleArrow = (el) => {
    if (!el) {
      setArrow(false);
      return;
    }

    if (!(el instanceof jQuery)) {
      el = $(el);
    }

    if (el.hasClass('arrow')) {
      setArrow(false, el);
    } else {
      setArrow(false);
      setShortcut(false);
      setArrow(true, el);
    }
  };

  /**
   * Sets the shortcut callout
   * @memberof   Nifty.callout
   *
   * @param      {boolean}  bool    Add or remove shortcut callout
   * @param      {element}   el     DOM element or jQuery object containing shortcut,
   *                                applies to all .shortcut-callout if empty
   * @return     {boolean}  Result
   */
  const setShortcut = (bool, el) => {
    if (!el && !bool) {
      $('.shortcut-callout').each(function(i,n) {
        setShortcut(false,$(n));
      });
      return;
    }

    if (!(el instanceof jQuery)) {
      el = $(el);
    }

    if (el.get(0).tagName !== 'LI') {
      el = el.parents('li').first();
    }

    if (bool) {
      setShortcut(false);
      setArrow(false);
      $('.clicked').removeClass('clicked');
      el.addClass('clicked').find('.shortcut').addClass('shortcut-callout');
      el.parents('li').addClass('clicked');
    } else {
      el.find('.shortcut').removeClass('shortcut-callout');
    }
  };

  /**
   * Toggles the shortcut callout
   * @memberof   Nifty.callout
   *
   * @param      {jquery}   el      jQuery object, all .arrow if empty
   * @return     {boolean}  Result
   */
  const toggleShortcut = (el) => {
    if (!el) {
      setShortcut(false);
      return;
    }

    if (!(el instanceof jQuery)) {
      el = $(el);
    }

    if (el.has('.shortcut-callout').length) {
      setShortcut(false, el);
    } else {
      setShortcut(false);
      setShortcut(true, el);
    }
  };

  /**
   * Toggles a checkmark on the clicked menu item.
   * @memberof   Nifty.callout
   * @param      {jquery}   el      jQuery object, all .arrow if empty. If el
   *                                is a string it will perform a fuzzy search
   *                                for a matching element
   * @return     {boolean}  Result
   */
  const toggleCheckmark = (el) => {
    if (!(el instanceof jQuery)) {
      if (typeof el === 'string') {
        let match = Nifty.fuzzyFind(el);
        if (match) {
          el = match;
        } else {
          return false;
        }
      } else {
        el = $(el);
      }
    }

    if (el.hasClass('checked')) {
      el.removeClass('checked');
    } else {
      el.addClass('checked');
    }
    return true;
  };

  /**
   * @namespace Nifty.handlers
   * @memberof  Nifty
   * @description Event handlers
   */

  /**
   * live search for the help menu, function ~ macOS
   * @private
   * @memberof   Nifty.handlers
   *
   * @param      {event}    e       Event
   */
  const liveSearch = (e) => {

    let $field = $('.helpsearch input'),
        string = $field.val(),
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

    let $item = fuzzyFind(string);

    if ($item) {
      clearClicks(false);
      $item.parents('li').addClass('clicked');
      $item.addClass('clicked last');

      if (shouldScroll) {
        $field.blur();
        $item.get(0).scrollIntoView({behavior: "smooth", block: "end", inline: "center"});
      }
    } else {
      clearClicks(false);
    }

    return true;
  };

  /**
   * click handler for menu items
   * @private
   * @memberof   Nifty.handlers
   * @param      {event}   e       Event
   * @return     {boolean}  continue handling event
   */
  const itemClick = (e) => {
    e.preventDefault();

    let $this,
        shortcutClicked = false;

    if (e.target.tagName === 'SPAN') {
      $this = $(e.target).closest('li');
      if ($(e.target).hasClass('shortcut')) {
        shortcutClicked = true;
      }
    } else {
      $this = $(e.target);
    }

    if (e.metaKey || e.altKey) {
      if (e.metaKey) {
        toggleCheckmark($this);
      } else if (e.altKey) {
        if (shortcutClicked) {
          toggleShortcut($this);
        } else {
          toggleArrow($this);
        }
      }
      updateStatus();
      return false;
    }


    $('.callout').removeClass('callout');
    $('.persist').removeClass('persist');

    if (e.target.tagName === 'BODY') {
      $('.clicked').removeClass('clicked');
      $('.last').removeClass('last');
      setArrow(false);
      setShortcut(false);
    } else {
      if ($this.hasClass('clicked')) {
        if ($this.find('.last').length) {
          clearClicks();
          $this.parents('li').addClass('clicked');
          $this.addClass('clicked last');
        } else {
          $('.last').removeClass('last');
          if ($this.parents('.clicked').length) {
            $this.removeClass('clicked');
            $this.siblings('.clicked').removeClass('clicked');
            $this.parents('.clicked').first().addClass('last');
          } else {
            $('.clicked').removeClass('clicked');
          }

          setArrow(false);
          setShortcut(false);
          updateStatus();
        }
        return false;
      } else {
        setArrow(false);
        setShortcut(false);
        $('li.clicked').removeClass('clicked');
        $('.last').removeClass('last');
        $this.parents('li').addClass('clicked');
        if (e.altKey) {
          setArrow(true, $this);
        }
        $this.addClass('clicked last');
      }

      if (e.type === 'dblclick') {
        $this.addClass('callout');
        if (e.shiftKey) {
          $this.parents('.clicked').addClass('callout');
        }
      }
    }
    updateStatus();
    return false;
  };
  /**
   * handler for all clicks within the .controls element
   * @private
   * @memberof   Nifty.handlers
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
      case 'arrowStyle':
        toggleArrowStyle();
        break;
      default:
        console.info('Element ID unrecognized');
    }

    return false;
  };

  /**
   * Update the status bar
   * @private
   * @memberof   Nifty.handlers
   * @param      {event}   e       Event
   * @return     {boolean}  continue handling event
   */
  const updateStatus = () => {
    setTimeout(() => {
      if ($('.last').length) {
        $('body').addClass('locked');
      } else {
        $('body').removeClass('locked');
      }
    }, 50);
    return true;
  };

  /**
   * @namespace Nifty.util
   * @memberof  Nifty
   * @description DOM/interface utilities
   */

  /**
  * Sets the style of the callout arrow
  * @memberof   Nifty.callout
  * @param      {string}  style    'circle' or 'arrow'
  */
  const setArrowStyle = (style) => {
    let newStyle = 'arrow';
    if (style && style === 'circle') {
      newStyle = 'circle';
      $('.arrow-arrow').removeClass('arrow-arrow').addClass('arrow-circle');
    } else {
      $('.arrow-circle').removeClass('arrow-circle').addClass('arrow-arrow');
    }
    Prefs.set('arrowStyle', newStyle);
  };

  /**
   * Toggles arrow style between circle and arrow.
   * @memberof   Nifty.callout
   */
  const toggleArrowStyle = () => {
    let newStyle;
    const current = Prefs.get('arrowStyle');
    if (current === 'circle') {
      newStyle = 'arrow';
      $('#arrowStyle','.controls').text('Arrow style: Arrow');
    } else {
      newStyle = 'circle';
      $('#arrowStyle','.controls').text('Arrow style: Circle');
    }
    setArrowStyle(newStyle);
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
   * @memberof   Nifty.handlers
   *
   * @param      {event}    e       Event
   * @return     {boolean}  continue handling event
   */
  const focusSearch = (e) => {
    e.preventDefault();
    $('li.callout').removeClass('callout');
    $('.clicked').removeClass('clicked');
    clearClicks();
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
    $('li.callout').removeClass('callout');
    $('.clicked').removeClass('clicked');
    $('.last').removeClass('last');
    setArrow(false);
    setShortcut(false);
    if (persist) {
      $('.persist').removeClass('persist');
    }
  };

  /**
   * Setup function, cache menu items and init preferences
   * @memberof   Nifty
   */
  const init = () => {
    getOrderedMenuItemTitles();
    config = Prefs.get();
  };

  const Nifty = {
    orderedMenuItemTitles: [],
    init,
    click,
    dblClick,
    fuzzyFind,
    callout: {
      setArrow,
      setArrowStyle,
      toggleArrowStyle,
      toggleArrow,
      toggleCheckmark,
      setShortcut,
      toggleShortcut
    },
    // handlers
    handlers: {
      itemClick,
      controlsClick,
      liveSearch,
      focusSearch,
      updateStatus
      },
    util: {
      setDarkMode,
      toggleDarkMode,
      setExpose,
      toggleExpose,
      setBG,
      toggleBG,
      clearClicks,
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
  Nifty.callout.setArrowStyle(Prefs.get('arrowStyle'));

  // set up handlers


  $('body,li').on('click dblclick', Nifty.handlers.itemClick);
  // $('body,li').on('mouseup', Nifty.handlers.updateStatus);

  $('span','.controls').on('click', Nifty.handlers.controlsClick);

  $('.helpsearch input').on('keydown', Nifty.handlers.liveSearch);

  $('.helpsearch').on('click', Nifty.handlers.focusSearch);

  $('.helpsearch').on('blur', () => {
    $('.persist').removeClass('persist');
  });

  // $('.hidetut').on('click', (e) => {
  //   e.preventDefault();
  //   $('#demotut').hide();
  //   return false;
  // });

  // bind some keys

  Mousetrap.bind('shift+/', Nifty.handlers.focusSearch);
  Mousetrap.bind('shift+d', Nifty.util.toggleDarkMode);
  Mousetrap.bind('shift+e', Nifty.util.toggleExpose);
});
