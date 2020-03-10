import Nifty from 'nifty.js';
import Prefs from 'prefs.js';
import Util from 'util.js';
import Callout from 'callout.js';

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

    Util.setDarkMode(Prefs.truthy(config.darkMode));
    Util.setExpose(Prefs.truthy(config.expose));
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
   * @example
   *  NiftyAPI.clear();
   */
  clear: function() {
    Util.clearClicks(true);
    return this;
  },

  /**
   * Lock menu item. Removes any existing locks.
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
   * Add callout to menu item
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

    Util.clearClicks(true);
    this.targetEl.dblclick();
    this.targetEl.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});

    if (recurse) {
      this.targetEl.parents('.clicked').addClass('callout');
    }
    return this;
  },

  /**
   * Set callout arrow for menu item
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
    Callout.setArrow(bool, this.targetEl);
    return this;
  },

  /**
   * Set shortcut callout for menu item
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
    Callout.setShortcut(bool, this.targetEl);
    return this;
  },

  /**
   * Turn Dark Mode on or off
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
    Util.setDarkMode(bool);
    return this;
  },

  /**
   * Turn Expose on or off
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
    Util.setExpose(bool);
    return this;
  }
};

export default NiftyAPI;
