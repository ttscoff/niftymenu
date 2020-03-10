import Prefs from 'prefs.js'
import Callout from 'callout.js'

/**
 * @namespace Nifty.util
 * @private
 * @memberof  Nifty
 * @description DOM/interface utilities
 */
 const Util = (function() {
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
    Callout.setArrow(false);
    Callout.setShortcut(false);
    if (persist) {
      $('.persist').removeClass('persist');
    }
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

  /**
   * Add a style rule for the defined wallpaper
   * @memberof   Nifty.util
   * @private
   * @param      {string}  url    URL for background image
   */
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

  return {
    setDarkMode,
    toggleDarkMode,
    setExpose,
    toggleExpose,
    setBG,
    setWallpaper,
    loadWallpaper,
    toggleBG,
    clearClicks
  }
})();

export default Util;
