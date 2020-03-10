import Nifty from './modules/nifty.js';
import NiftyAPI from './modules/api.js';

$(function() {
  Nifty.init();
  window.NiftyAPI = NiftyAPI;
});
