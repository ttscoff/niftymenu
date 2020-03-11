import Util from 'util.js'
import Callout from 'callout.js';
import Prefs from 'prefs.js';

/**
 * @namespace Nifty.handlers
 * @private
 * @memberof  Nifty
 * @description Event handlers
 */

const Handler = (function() {
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
      Util.clearClicks(true);
      return true;
    }

    if (e.code === 'Enter' || e.code === 'Return') {
      e.preventDefault();
      $('.persist').removeClass('persist');
      shouldScroll = true;
      // return true;
    }

    if (string.length < 2) {
      Util.clearClicks(false);
      return true;
    }

    let $item = find(string);

    if ($item) {
      Util.clearClicks(false);
      $item.parents('li').addClass('clicked');
      $item.addClass('clicked last');

      if (shouldScroll) {
        $field.blur();
        $item.get(0).scrollIntoView({behavior: "smooth", block: "end", inline: "center"});
      }
    } else {
      Util.clearClicks(false);
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
        Callout.toggleCheckmark($this);
      } else if (e.altKey) {
        if (shortcutClicked) {
          Callout.toggleShortcut($this);
        } else {
          Callout.toggleArrow($this);
        }
      }
      return false;
    }


    $('.callout').removeClass('callout');
    $('.persist').removeClass('persist');

    if (e.target.tagName === 'BODY') {
      $('.clicked').removeClass('clicked');
      $('.last').removeClass('last');
      Callout.setArrow(false);
      Callout.setShortcut(false);
    } else {
      if ($this.hasClass('clicked')) {
        if ($this.find('.last').length) {
          Util.clearClicks();
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

          Callout.setArrow(false);
          Callout.setShortcut(false);
        }
        return false;
      } else {
        Callout.setArrow(false);
        Callout.setShortcut(false);
        $('li.clicked').removeClass('clicked');
        $('.last').removeClass('last');
        $this.parents('li').addClass('clicked');
        if (e.altKey) {
          Callout.setArrow(true, $this);
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
        Util.toggleDarkMode();
        break;
      case 'exposeToggle':
        Util.toggleExpose();
        break;
      case 'backgroundToggle':
        Util.toggleBG();
        break;
      case 'chooseWallpaper':
        chooseWallpaper();
        break;
      case 'randomWallpaper':
        randomWallpaper();
        break;
      case 'resetWallpaper':
        Util.setWallpaper(false);
        break;
      case 'arrowStyle':
        Callout.toggleArrowStyle();
        break;
      case 'screenshot':
        Util.screenshot(e);
        break;
      default:
        throw('Element ID unrecognized');
    }

    return false;
  };

  /**
   * Allow entry of a url to load as wallpaper
   * @memberof Handlers
   * @private
   */
  const chooseWallpaper = () => {
    let url = prompt("Enter URL for background image");
    Prefs.set('wallpaper', url);
    Util.loadWallpaper();
  };

  /**
   * Choose random unsplash wallpaper
   * @memberof Handlers
   * @private
   */
  const randomWallpaper = () => {
    let keywords = prompt("Enter optional keywords (comma separated words)"),
        url = 'https://source.unsplash.com/random/1900x1200?' + encodeURIComponent(keywords);

    Prefs.set('wallpaper', url);
    Util.loadWallpaper();
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
    Util.clearClicks();
    let $search = $('.helpsearch').first();
    $search.parents('li').addClass('clicked persist');
    $search.get(0).scrollIntoView({behavior: "smooth", block: "end", inline: "end"});
    $('input',$search).focus();
    return false;
  };

  return {
    itemClick,
    controlsClick,
    liveSearch,
    focusSearch
  }
}());

export default Handler;
