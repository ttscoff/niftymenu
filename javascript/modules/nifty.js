import Util from 'util.js';
import Prefs from 'prefs.js';
import Callout from 'callout.js';
import Handler from 'handler.js';

/**
 * @namespace Nifty
 * @private
 * @description Automation API and event handlers
 */
const Nifty = (function() {
  'use strict';

  let orderedMenuItemTitles;

  /**
   * Setup function, cache menu items and init preferences
   * @memberof   Nifty
   */
  const init = () => {
    getOrderedMenuItemTitles();
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

    $('.helpsearch input').on('keydown', Handler.liveSearch);

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
      Util.clearClicks(true);
    }

    if (!str || /^\s*$/.test(str)) {
      Util.clearClicks(true);
      return;
    }
    let match = find(str);
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
    let match = find(str);
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
    if (orderedMenuItemTitles && orderedMenuItemTitles.length > 0) {
      return orderedMenuItemTitles;
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
    orderedMenuItemTitles = titles;
    return orderedMenuItemTitles;
  };

  return {
    orderedMenuItemTitles: [],
    init,
    click,
    dblClick,
    find
  }
})();

export default Nifty;
