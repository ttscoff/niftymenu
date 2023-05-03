import Prefs from 'prefs.js';
import Callout from 'callout.js';

/**
 * @namespace Util
 * @private
 * @description DOM/interface utilities
 */
 const Util = (function() {
  /**
   * Clear all active clicks (menu items held in place)
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
   * @param      {string}  url    URL for background image
   */
  const setWallpaper = (url) => {
    Prefs.set('wallpaper', url);
    loadWallpaper();
  };

  /**
   * Add a style rule for the defined wallpaper
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
    addStyleRule('body.bgimage, body.dark.bgimage {background-image: url('+url+')}');
  };

  /**
   * Add a style rule to main stylesheet
   * @private
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
    loadWallpaper();
  };

  /**
   * Force Expose on or off. Use the boolean paramater to determine which.
   * @param      {boolean}  [bool=true]    true turns Expose on, false for off
   */
  const setExpose = (bool) => {
    let $body = $('body');
    if (bool) {
      $body.addClass('expose');
      $('html,body').width($('body>ul').width());
      Prefs.set('expose',1);
    } else {
      Prefs.set('expose',0);
      window.location.reload();
    }
  };

  /**
   * Toggle Expose
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
   * Take a screenshot of selected menu item. Experimental, currently only works
   * in Chrome. If called via NiftyAPI.shoot(), downloads immediately to
   * Downloads folder, names file based on menu path.
   *
   * Background images work if they're remote. Local images seem to taint the
   * canvas, making it impossible to save with Chrome's security restrictions.
   *
   * @param      {event}  e       If e is undefined, download immediately
   */
  const screenshot = (e, filename) => {
    $('body').addClass('screenshot');
    let clicks = $('li.clicked');
    if (!clicks.length) {
      throw("No menu items selected");
    }

    let title;

    if (filename) {
      title = filename;
    } else {
      title = [];
      clicks.each((i,n) => {
        title.push($(n).find('>strong').text());
      });

      let last = clicks.last();
      if (last.children('.shortcut').length > 0) {
        title.push(last.find('.menuitem').text());
      } else {
        title.push(last.text());
      }

      title = title.join('-').replace(/-+/g,'-').replace(/ +/g,'_');
    }

    let menus = clicks.parents('ul').not('body>ul'),
      left = Math.floor(clicks.first().offset().left - 70),
      width = 150,
      height = 0;

    menus.each((i,n) => {
      width += $(n).width();
      let ulTop = $(n).offset().top;
      let ulHeight = $(n).height();
      if (ulTop + ulHeight > height) {
        height = ulTop + ulHeight;
      }
    });

    // if the last item clicked has an open submenu,
    // include it in screenshot
    if (clicks.last().find('ul').length) {
      width += clicks.last().find('ul').width();
    }

    let useCors = false;
    let hadBG = Prefs.getBool('bgImage');

    if ((/url\("http/).test($('body').css('background-image'))) {
      useCors = true;
    } else if ((/url\("file/).test($('body').css('background-image'))) {
      setBG(false);
    }

    html2canvas(document.querySelector("body"), {
      x: left,
      y: 0,
      width: width,
      height: height + 50,
      useCORS: useCors,
      imageTimeout: 60000
    }).then(canvas => {
      $('#screenshotHolder').empty();
      $('#screenshotHolder').append(canvas);
      clearClicks(true);
      $('body').removeClass('screenshot');
      setBG(hadBG);

      // if called from a handler, display screenshot for download
      if (e) {
        let $controls = $('<div class=screenshot-controls>');
        $('<button>Cancel</button>')
          .addClass('screenshot-close')
          .on('click', () => {
            $('#screenshotHolder').empty();
          })
          .appendTo($controls);
        $('<button>Save</button>')
          .addClass('screenshot-dl')
          .data('title', title)
          .on('click', () => {
            downloadScreenshot(title);
          })
          .appendTo($controls);
        $controls.appendTo('#screenshotHolder');
      // if called from API, download immediately
      } else {
        downloadScreenshot(title);
      }

    });
  }

  /**
   * Download a screenshot (handler)
   *
   * @param      {string}  title   Filename to use
   */
  const downloadScreenshot = (title) => {
    if (!title)
      title = 'NiftyMenu_Screenshot';

    let canvas = document.querySelector('#screenshotHolder canvas'),
        link = document.createElement('a');

    link.download = `${title}.png`;
    link.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    link.click();
    $('#screenshotHolder').empty();
  }

  /**
   * Launch a shell for running automations
   */
  const terminal = (e) => {
    e.preventDefault();
    if ($('#terminal').length > 0) {
      $('#terminal').toggle();
      if ($('#terminal').is(':visible')) {
        $('#terminal>textarea').focus();
      }
    } else {
      $('<form id=terminal><textarea></textarea><input type=submit value=Run>').appendTo('body');
      $('#terminal>input').on('click', (e) => {
        e.preventDefault();
        let code = $('#terminal textarea').val();
        $('#terminal').hide();
        code.trim().split(/;/).forEach((line) => {
          let exec = line.trim();
          if (exec.length > 0) {
            return Function(`"use strict";return (${exec})`)();
          }
        });
      });
      $('#terminal>textarea').focus();
    }
    return false;
  }

  return {
    setDarkMode,
    toggleDarkMode,
    setExpose,
    toggleExpose,
    setBG,
    setWallpaper,
    loadWallpaper,
    toggleBG,
    clearClicks,
    screenshot,
    downloadScreenshot,
    terminal
  }
})();

export default Util;
