import { Util, Prefs, Callout, Handler, Search } from 'modules.js';

/**
 * @namespace Nifty
 * @private
 * @description Automation API and event handlers
 */
const Nifty = (function() {
  'use strict';

  /**
   * Setup function, cache menu items and init preferences
   * @memberof   Nifty
   */
  const init = () => {
    Search.getOrderedMenuItemTitles();
    if (Prefs.getBool('darkMode')) {
      Util.setDarkMode(true);
    }
    if (Prefs.getBool('expose')) {
      Util.setExpose(true);
    }
    Util.loadWallpaper();
    if (Prefs.getBool('bgImage')) {
      Util.setBG(true);
    }
    Callout.setArrowStyle(Prefs.get('arrowStyle'));

    // set up handlers


    $('body,li').on('click dblclick', Handler.itemClick);

    $('span','.controls').on('click', Handler.controlsClick);

    $('.helpsearch input').on('keyup', Handler.liveSearch);

    $('.helpsearch').on('click', Handler.focusSearch);

    $('.helpsearch').on('blur', () => {
      $('.persist').removeClass('persist');
    });

    // $('body').on('click', () => {
    //   $('#screenshotHolder').empty();
    // });

    // Load demo overlay if viewed on GitHub
    if (window.location.host === 'ttscoff.github.io') { $('body').addClass('demo'); }

    // bind some keys

    Mousetrap.bind('shift+/', Handler.focusSearch);
    Mousetrap.bind('shift+d', Util.toggleDarkMode);
    Mousetrap.bind('shift+e', Util.toggleExpose);
    Mousetrap.bind('shift+s', Util.screenshot);
    Mousetrap.bind('$', Util.terminal);
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
      Util.clearClicks(true);
    }

    if (!str || /^\s*$/.test(str)) {
      Util.clearClicks(true);
      return;
    }
    let match = Search.find(str);
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
      Util.clearClicks(true);
    }

    if (!str || /^\s*$/.test(str)) {
      Util.clearClicks(true);
      return;
    }
    let match = Search.find(str);
    if (match) {
      match.dblclick();
      match.get(0).scrollIntoView({behavior: "auto", block: "end", inline: "center"});
    }
  };

  return {
    orderedMenuItemTitles: [],
    init,
    click,
    dblClick
  }
})();

export default Nifty;
