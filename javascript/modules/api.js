import { Callout, Prefs, Search, Util } from 'modules.js';

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
   * Show current configuration options
   *
   * @return     {object}  The configuration.
   */
  getConfig: function() {
    return Prefs.get();
  },

  /**
   * Set multiple display options via a configuration object
   *
   * @param      {Object}  options  object containing settings
   * @example
   *  NiftyAPI.config({
   *   'arrowStyle': 'arrow',
   *   'bgImage': true,
   *   'darkMode': false,
   *   'wallpaper': 'default'
   * });
   */
  config: function(options={}) {
    let defaults = Prefs.config;

    let config = $.extend({}, defaults, options);

    Util.setDarkMode(Prefs.truthy(config.darkMode));
    Util.setBG(Prefs.truthy(config.bgImage));
    Util.setWallpaper(config.wallpaper);
    Callout.setArrowStyle(config.arrowStyle);
    return this;
  },

  /**
   * Case insensitive string match for menu item search. Use / to separate
   * heirarchical menu search items. This function can be chained for use with
   * other functions.
   * @example
   *   NiftyAPI.find('insert/toc/section');
   * NiftyAPI.find('insert/toc/section').arrow();
   *
   * @param      {string}  str     The string to search for
   * @return     {jQuery}  single jQuery element or null
   */
  find: function(str) {
    this.targetEl = Search.find(str);
    return this;
  },

  /**
   * Clear all clicks, callouts, and arrows
   * @example
   *  NiftyAPI.clear();
   */
  clear: function() {
    Util.clearClicks(true);
    return this;
  },

  /**
   * Lock menu item. Removes any existing locks. Equivalent to clicking a menu
   * item.
   * @example
   *  NiftyAPI.find('file/save').lock();
   */
  lock: function() {
    Util.clearClicks(true);
    this.targetEl.click();
    this.targetEl.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});
    return this;
  },

  /**
   * Add callout to menu item. Equivalent to double clicking a menu item.
   *
   * @param      {boolean}  [bool=true]      Callout on or off (default: true)
   * @param      {boolean}  [recurse=false]  Call out parent items (default:
   *                                         false)
   * @example
   *  NiftyAPI.find('file/open').callout();
   *NiftyAPI.find('file/open').callout(true, true); // add callout to item and parents
   *NiftyAPI.find('file/open').callout(false); // remove callout
   */
  callout: function(bool, recurse=false) {
    if (bool === undefined) {
      bool = true;
    }

    Util.clearClicks(true);

    if (bool) {
      this.targetEl.dblclick();
      this.targetEl.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});

      if (recurse) {
        this.targetEl.parents('.clicked').addClass('callout');
      }
    }

    return this;
  },

  /**
   * Set callout arrow for menu item. Equivalent to option-clicking a menu item.
   *
   * @param      {boolean}  [bool=true]  Arrow on or off
   * @example
   *  NiftyAPI.find('view/merge').arrow();
   *NiftyAPI.find('view/merge').arrow(false); // remove arrow
   */
  arrow: function(bool) {
    if (bool === undefined) {
      bool = true;
    }
    Callout.setArrow(bool, this.targetEl);
    return this;
  },

  /**
   * Set shortcut callout for menu item. Equivalent to option-clicking a
   * shortcut on a menu item.
   *
   * @param      {boolean}  [bool=true]  Shortcut callout on or off
   * @example
   *  NiftyAPI.find('file/save').shortcut();
   *NiftyAPI.find('file/save').shortcut(false); // remove arrow
   */
  shortcut: function(bool) {
    if (bool === undefined) {
      bool = true;
    }
    Callout.setShortcut(bool, this.targetEl);
    return this;
  },

  /**
   * Turn Dark Mode on or off
   *
   * @param      {boolean}  [bool=true]  Dark Mode on or off
   * @example
   *  NiftyAPI.darkMode(); // turn dark mode on
   *NiftyAPI.darkMode(false); // turn dark mode off
   */
  darkMode: function(bool) {
    if (bool === undefined) {
      bool = true;
    }
    Util.setDarkMode(bool);
    return this;
  },

  /**
   * Turn Expose on or off
   *
   * @param      {boolean}  [bool=true]  Expose on or off
   * @example
   *  NiftyAPI.expose(); // turn expose on
   *NiftyAPI.expose(false); // turn expose off
   */
  expose: function(bool) {
    if (bool === undefined) {
      bool = true;
    }
    Util.setExpose(bool);
    return this;
  },

  /**
   * Take a screenshot of selected menu item. Currently experimental, **only
   * works in Chrome**.
   *
   * Background images work if they're remote (hosted, with proper CORS
   * headers). Local images seem to taint the canvas, making it impossible to
   * save with Chrome's security restrictions. Thus, background images are
   * disabled during screenshot if using a file: protocol.
   *
   * @param      {string}  [title=null]  The title for downloaded image, no extension
   *
   * @example
   *  NiftyAPI.find('edit/paste as').arrow().shoot('filename');
   *
   */
  shoot: function(title=null) {
    Util.screenshot(false, title);
    return this;
  }
};

export default NiftyAPI;
