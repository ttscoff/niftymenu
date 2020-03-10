/**
 * @namespace Prefs
 * @private
 * @description Utility methods for storing/retrieving preferences
 */
const Prefs = (function() {
  'use strict';

  const CONFIG_KEY = 'niftyPrefs';

  const defaults = {
    'arrowStyle' : 'arrow',
    'bgImage' : 1,
    'expose' : 0,
    'darkMode' : 0,
    'wallpaper' : 'default'
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
    return truthy(value);
  };


  /**
   * Determine truthiness of value
   *
   * @param      {any}      value   The value: boolean, integer, or string
   * @return     {boolean}  determined value
   */
  const truthy = (value) => {
    if (typeof value === 'boolean') {
      return value;
    }
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
    getBool,
    truthy
  };

  return Prefs;
}());

/**
 * @namespace Nifty
 * @private
 * @description Automation API and event handlers
 */
const Nifty = (function() {
  'use strict';

  let config;

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
   * @example  Nifty.find('insert/toc/section')
   *
   * @param      {string}  query   The string to search for
   * @return     {jQuery}  single jQuery element or null
   */
  const find = (query) => {
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
    let match = Nifty.find(str);
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
    let match = Nifty.find(str);
    if (match) {
      match.dblclick();
      match.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});
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
   * @private
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
        let match = Nifty.find(el);
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
   * @private
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

    let $item = find(string);

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
      case 'chooseWallpaper':
        chooseWallpaper();
        break;
      case 'resetWallpaper':
        setWallpaper(false);
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
   * @private
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
   * Allow entry of a url to load as wallpaper
   * @private
   */
  const chooseWallpaper = () => {
    var url = prompt("Enter URL for background image");
    Prefs.set('wallpaper', url);
    loadWallpaper();
  };

  /**
   * Sets the wallpaper image to use when bgImage is enabled
   * @memberof   Nifty.util
   * @param      {string}  url    URL for background image
   */
  const setWallpaper = (url) => {
    Prefs.set('wallpaper', url);
    loadWallpaper();
  };

  const loadWallpaper = () => {
    let url = Prefs.get('wallpaper');
    if (!url || url === 'default') {
      if (Prefs.getBool('darkMode')) {
        url = 'images/darkbackground.jpg';
      } else {
        url = 'images/background.jpg';
      }
    }
    addStyleRule('body.bgimage {background-image: url('+url+')}');
  };

  /**
   * Add a style rule to main stylesheet
   * @private
   * @memberof Nifty.util
   */
  const addStyleRule = (rule) => {
    var sheet = (function() {
      var style = document.createElement("style");
      style.appendChild(document.createTextNode(""));
      document.head.appendChild(style);
      return style.sheet;
    })();
    sheet.insertRule(rule);
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
      Prefs.set('bgImage',1);
      loadWallpaper();
    } else {
      $body.removeClass('bgimage');
      Prefs.set('bgImage',0);
    }
  };

  /**
   * Toggle background image
   * @memberof   Nifty.util
   */
  const toggleBG = () => {
    let $body = $('body');
    if ($body.hasClass('bgimage')) {
      setBG(false);
    } else {
      setBG(true);
    }
  };

  /**
   * Toggle Dark Mode
   * @memberof   Nifty.util
   */
  const toggleDarkMode = () => {
    let $body = $('body');
    let test = $('body').hasClass('dark');

    if (test) {
      setDarkMode(false);
    } else {
      setDarkMode(true);
    }
  };

  /**
   * Set Dark Mode
   * @memberof   Nifty.util
   * @param {boolean} [bool=true] Dark Mode on or off
   */
  const setDarkMode = (bool=true) => {
    let $body = $('body');
    if (!bool) {
      $body.removeClass('dark');
      Prefs.set('darkMode',0);
    } else {
      $body.addClass('dark');
      Prefs.set('darkMode',1);
    }
  };

  /**
   * Force Expose on or off. Use the boolean paramater to determine which.
   * @memberof   Nifty.util
   * @param      {boolean}  [bool=true]    true turns Expose on, false for off
   */
  const setExpose = (bool) => {
    let $body = $('body');
    if (bool) {
      $body.addClass('expose');
      Prefs.set('expose',1);
    } else {
      $body.removeClass('expose');
      Prefs.set('expose',0);
    }
  };

  /**
   * Toggle Expose
   * @memberof   Nifty.util
   */
  const toggleExpose = () => {
    let $body = $('body');
    if ($body.hasClass('expose')) {
      setExpose(false);
    } else {
      setExpose(true);
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
    find,
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
      setWallpaper,
      loadWallpaper,
      toggleBG,
      clearClicks,
      }
  };

  return Nifty;
}());

/**
 * @namespace NiftyAPI
 * @description Chainable automation API. All chains that affect a menu item
 * should start with a .find('search string') call.
 *
 * @example NiftyAPI.find('file/save').arrow(); // locate File->Save menu item and add an arrow callout
 */
const NiftyAPI = {
  targetEl: null,

  /**
   * Set multiple display options via a configuration object
   * @param      {Object}  options  object containing settings
   * @example NiftyAPI.config({
   *   'arrowStyle': 'arrow',
   *   'bgImage': true,
   *   'expose': false,
   *   'darkMode': false,
   *   'wallpaper': 'default'
   * })
   */
  config: function(options={}) {
    let defaults = Prefs.config;

    let config = $.extend({}, defaults, options);

    Nifty.util.setDarkMode(Prefs.truthy(config.darkMode));
    Nifty.util.setExpose(Prefs.truthy(config.expose));
    Nifty.util.setBG(Prefs.truthy(config.bgImage));
    Nifty.util.setWallpaper(config.wallpaper);
    Nifty.callout.setArrowStyle(config.arrowStyle);
    return this;
  },

  /**
   * Case insensitive string match for menu item search. Use / to separate
   * heirarchical menu search items. This function can be chained for use with
   * other functions.
   * @memberof   NiftyAPI
   * @example
   *   NiftyAPI.find('insert/toc/section')
   * @example
   *   NiftyAPI.find('insert/toc/section').arrow()
   *
   * @param      {string}  str     The string to search for
   * @return     {jQuery}  single jQuery element or null
   */
  find: function(str) {
    this.targetEl = Nifty.find(str);
    return this;
  },

  /**
   * Clear all clicks, callouts, and arrows
   * @memberof   NiftyAPI
   * @example
   *  NiftyAPI.clear();
   */
  clear: function() {
    Nifty.util.clearClicks(true);
    return this;
  },

  /**
   * Lock menu item. Removes any existing locks.
   * @memberof   NiftyAPI
   * @example
   *  NiftyAPI.find('file/save').lock();
   */
  lock: function() {
    Nifty.util.clearClicks(true);
    this.targetEl.click();
    this.targetEl.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});
    return this;
  },

  /**
   * Add callout to menu item
   * @memberof   NiftyAPI
   *
   * @param      {boolean}  [bool=true]      Callout on or off (default: true)
   * @param      {boolean}  [recurse=false]  Call out parent items (default:
   *                                         false)
   * @example
   *  NiftyAPI.find('file/open').callout();
   * @example
   *  NiftyAPI.find('file/open').callout(false); // remove callout
   */
  callout: function(bool, recurse=false) {
    if (bool === undefined) {
      bool = true;
    }

    Nifty.util.clearClicks(true);
    this.targetEl.dblclick();
    this.targetEl.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});

    if (recurse) {
      this.targetEl.parents('.clicked').addClass('callout');
    }
    return this;
  },

  /**
   * Set callout arrow for menu item
   * @memberof   NiftyAPI
   *
   * @param      {boolean}  [bool=true]  Arrow on or off
   * @example
   *  NiftyAPI.find('view/merge').arrow();
   * @example
   *  NiftyAPI.find('view/merge').arrow(false); // remove arrow
   */
  arrow: function(bool) {
    if (bool === undefined) {
      bool = true;
    }
    Nifty.callout.setArrow(bool, this.targetEl);
    return this;
  },

  /**
   * Set shortcut callout for menu item
   * @memberof   NiftyAPI
   *
   * @param      {boolean}  [bool=true]  Shortcut callout on or off
   * @example
   *  NiftyAPI.find('file/save').shortcut();
   * @example
   *  NiftyAPI.find('file/save').shortcut(false); // remove arrow
   */
  shortcut: function(bool) {
    if (bool === undefined) {
      bool = true;
    }
    Nifty.callout.setShortcut(bool, this.targetEl);
    return this;
  },

  /**
   * Turn Dark Mode on or off
   * @memberof   NiftyAPI
   *
   * @param      {boolean}  [bool=true]  Dark Mode on or off
   * @example
   *  NiftyAPI.darkMode() // turn dark mode on
   * @example
   *  NiftyAPI.darkMode(false) // turn dark mode off
   */
  darkMode: function(bool) {
    if (bool === undefined) {
      bool = true;
    }
    Nifty.util.setDarkMode(bool);
    return this;
  },

  /**
   * Turn Expose on or off
   * @memberof   NiftyAPI
   *
   * @param      {boolean}  [bool=true]  Expose on or off
   * @example
   *  NiftyAPI.expose(); // turn expose on
   * @example
   *  NiftyAPI.expose(false); // turn expose off
   */
  expose: function(bool) {
    if (bool === undefined) {
      bool = true;
    }
    Nifty.util.setExpose(bool);
    return this;
  }
};

$(function() {
  Nifty.init();

  // restore preferences

  if (Prefs.getBool('darkMode')) {
    Nifty.util.setDarkMode(true);
  }
  if (Prefs.getBool('expose')) {
    Nifty.util.setExpose(true);
  }
  Nifty.util.loadWallpaper();
  if (Prefs.getBool('bgImage')) {
    Nifty.util.setBG(true);
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
