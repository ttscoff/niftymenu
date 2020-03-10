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
})();

export default Prefs;
