/**
 * @namespace Search
 * @private
 * @description Automation API and event handlers
 */
const Search = (function() {
  'use strict';
  let orderedMenuItemTitles;

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
   * @example  Search.find('insert/toc/section')
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
    getOrderedMenuItemTitles,
    find
  }
})();

export default Search;
