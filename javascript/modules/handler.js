import Util from "util.js";
import Callout from "callout.js";
import Prefs from "prefs.js";
import Search from "search.js";

/**
 * @namespace Nifty.handlers
 * @private
 * @memberof  Nifty
 * @description Event handlers
 */

const Handler = (function () {
  /**
   * live search for the help menu, function ~ macOS
   * @private
   * @memberof   Nifty.handlers
   *
   * @param      {event}    e       Event
   */
  const liveSearch = (e) => {
    let $field = $(".helpsearch input"),
      string = $field.val(),
      shouldScroll = false;

    if (e.code === "Escape") {
      e.preventDefault();
      $field.val("").blur();
      Util.clearClicks(true);
      return true;
    }

    if (e.code === "Enter" || e.code === "Return") {
      e.preventDefault();
      $(".persist").removeClass("persist");
      shouldScroll = true;
      // return true;
    }

    if (string.length < 2) {
      Util.clearClicks(false);
      return true;
    }

    let $item = Search.find(string);

    if ($item) {
      Util.clearClicks(false);
      if ($item.parents("li")) {
        $item.parents("li").addClass("clicked");
      }
      $item.addClass("clicked last");

      if (shouldScroll) {
        $field.blur();
        $item
          .get(0)
          .scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "center"
          });
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

    if ($(e.target).hasClass("divider")) {
      return false;
    }

    let $this,
      shortcutClicked = false;

    if (e.target.tagName === "SPAN") {
      $this = $(e.target).closest("li");
      // Option-click on shortcut or any child (e.g. .globe-icon) → shortcut callout
      if (
        $(e.target).hasClass("shortcut") ||
        $(e.target).closest(".shortcut").length
      ) {
        shortcutClicked = true;
      }
    } else {
      $this = $(e.target);
    }

    if (
      $this.length &&
      $this.children().length === 1 &&
      $this.find(".divider").length
    ) {
      return false;
    }

    if (e.altKey) {
      if (shortcutClicked) {
        Callout.toggleShortcut($this);
      } else {
        Callout.toggleArrow($this);
      }
      return false;
    }
    if (e.metaKey) {
      Callout.toggleCheckmark($this);
      return false;
    }

    $(".callout").removeClass("callout");
    $(".persist").removeClass("persist");

    if (e.target.tagName === "BODY") {
      $(".clicked").removeClass("clicked");
      $(".last").removeClass("last");
      Callout.setArrow(false);
      Callout.setShortcut(false);
    } else {
      if ($this.hasClass("clicked")) {
        if ($this.find(".last").length) {
          Util.clearClicks();
          $this.parents("li").addClass("clicked");
          $this.addClass("clicked last");
        } else {
          $(".last").removeClass("last");
          if ($this.parents(".clicked").length) {
            $this.removeClass("clicked");
            $this.siblings(".clicked").removeClass("clicked");
            $this.parents(".clicked").first().addClass("last");
          } else {
            $(".clicked").removeClass("clicked");
          }

          Callout.setArrow(false);
          Callout.setShortcut(false);
        }
        return false;
      } else {
        Callout.setArrow(false);
        Callout.setShortcut(false);
        $("li.clicked").removeClass("clicked");
        $(".last").removeClass("last");
        $this.parents("li").addClass("clicked");
        if (e.altKey) {
          Callout.setArrow(true, $this);
        }
        $this.addClass("clicked last");
      }

      if (e.type === "dblclick") {
        $this.addClass("callout");
        if (e.shiftKey) {
          $this.parents(".clicked").addClass("callout");
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

    switch ($this.id) {
      case "darkModeToggle":
        Util.toggleDarkMode();
        break;
      case "exposeToggle":
        Util.toggleExpose();
        break;
      case "backgroundToggle":
        Util.toggleBG();
        break;
      case "chooseWallpaper":
        chooseWallpaper();
        break;
      case "randomWallpaper":
        randomWallpaper();
        break;
      case "resetWallpaper":
        Util.setWallpaper(false);
        break;
      case "arrowStyle":
        Callout.toggleArrowStyle();
        break;
      case "screenshot":
        Util.screenshot(e);
        break;
      case "commandshell":
        Util.terminal(e);
        break;
      default:
        throw "Element ID unrecognized";
    }

    return false;
  };

  const PICSUM_STORAGE_KEY = "niftyPicsumSeed";
  const PICSUM_BASE = "https://picsum.photos/";
  const PICSUM_WIDTH = 2400;
  const PICSUM_HEIGHT = 1350; // 16:9 desktop aspect ratio

  /**
   * Allow entry of a url to load as wallpaper
   * @memberof Handlers
   * @private
   */
  const chooseWallpaper = () => {
    let url = prompt("Enter URL for background image");
    Prefs.set("wallpaper", url);
    Util.loadWallpaper();
  };

  /**
   * Build Picsum URL: width x height (16:9), optional seed, blur (0-10), grayscale.
   * @see https://picsum.photos/
   */
  const buildPicsumUrl = (seed, blurAmount, grayscale) => {
    const size = PICSUM_WIDTH + "/" + PICSUM_HEIGHT;
    let path = seed ? "seed/" + encodeURIComponent(seed) + "/" + size : size;
    let params = [];
    if (grayscale) params.push("grayscale");
    if (blurAmount > 0) params.push("blur" + (blurAmount > 1 ? "=" + blurAmount : ""));
    let qs = params.length ? "?" + params.join("&") : "";
    return PICSUM_BASE + path + qs;
  };

  /**
   * Show dialog for Picsum options (seed, blur, grayscale), then set wallpaper from Lorem Picsum.
   * Seed is stored in localStorage and autofilled on next open.
   * @memberof Handlers
   * @private
   */
  const picsumWallpaper = () => {
    const storedSeed = localStorage.getItem(PICSUM_STORAGE_KEY) || "";
    const overlay = document.createElement("div");
    overlay.id = "picsumDialogOverlay";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;";
    const form = document.createElement("form");
    form.style.cssText =
      "background:#fff;color:#111;padding:1.25rem;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);min-width:280px;position:relative;z-index:1;pointer-events:auto;";
    form.innerHTML = [
      '<p style="margin:0 0 0.75rem;font-weight:600;color:#111;">Picsum background (' + PICSUM_WIDTH + '×' + PICSUM_HEIGHT + ' 16:9)</p>',
      '<label style="display:block;margin-bottom:0.5rem;color:#111;"><span style="display:block;font-size:0.85em;color:#666;">Seed (optional, keeps image static)</span><input type="text" id="picsumSeed" name="seed" placeholder="e.g. picsum" style="width:100%;box-sizing:border-box;padding:6px 8px;margin-top:2px;background:#f5f5f5;color:#111;border:1px solid #ddd;"></label>',
      '<div style="margin-bottom:0.75rem;"><label for="picsumBlur" style="display:block;margin-bottom:4px;cursor:pointer;color:#111;">Blur <span id="picsumBlurVal">0</span></label><input type="range" id="picsumBlur" name="blur" min="0" max="10" value="0" style="width:100%;cursor:pointer;"></div>',
      '<label for="picsumGrayscale" style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;cursor:pointer;color:#111;"><input type="checkbox" id="picsumGrayscale" name="grayscale" style="cursor:pointer;"> Grayscale</label>',
      '<div style="display:flex;gap:8px;justify-content:flex-end;"><button type="button" id="picsumCancel">Cancel</button><button type="submit" id="picsumOk">OK</button></div>'
    ].join("");
    form.querySelector("#picsumSeed").value = storedSeed;
    const blurInput = form.querySelector("#picsumBlur");
    const blurVal = form.querySelector("#picsumBlurVal");
    blurInput.addEventListener("input", () => { blurVal.textContent = blurInput.value; });
    overlay.appendChild(form);
    document.body.appendChild(overlay);

    const remove = () => {
      document.body.removeChild(overlay);
    };

    form.addEventListener("click", (e) => e.stopPropagation());
    form.querySelector("#picsumCancel").addEventListener("click", remove);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const seed =
        (form.seed && form.seed.value ? form.seed.value.trim() : "") || null;
      const blurAmount = parseInt(form.blur.value, 10) || 0;
      const grayscale = form.grayscale && form.grayscale.checked;
      if (seed) localStorage.setItem(PICSUM_STORAGE_KEY, seed);
      const url = buildPicsumUrl(seed, blurAmount, grayscale);
      Prefs.set("wallpaper", url);
      Util.loadWallpaper();
      remove();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) remove();
    });
  };

  /**
   * Choose random Picsum wallpaper (dialog: seed, blur, grayscale)
   * @memberof Handlers
   * @private
   */
  const randomWallpaper = () => {
    picsumWallpaper();
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
    $("li.callout").removeClass("callout");
    $(".clicked").removeClass("clicked");
    Util.clearClicks();
    let $search = $(".helpsearch").first();
    $search.parents("li").addClass("clicked persist");
    $search
      .get(0)
      .scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
    $("input", $search).focus();
    return false;
  };

  return {
    itemClick,
    controlsClick,
    liveSearch,
    focusSearch
  };
})();

export default Handler;
