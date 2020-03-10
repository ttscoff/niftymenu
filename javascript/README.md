### The NiftyMenu API

The primary namespace is `NiftyAPI`, which is a chainable set of functions covering searching, clicking, and callouts.

### Configuration functions

Methods that adjust the display do not require an element to be passed, but can still be chained in with other functions. The primary display command is `config()`, which accepts an object containing keys for any/all of the display options. Example:

    NiftyAPI.config({
      'arrowStyle': 'arrow',
      'bgImage': true,
      'expose': false,
      'darkMode': false,
      'wallpaper': 'default'
    });

There are shorcuts for Dark Mode (`NiftyAPI.darkMode()`) and Exposé (`NiftyAPI.expose()`).

### Chainable functions

All chainable functions should start with `find` (or a variable containing the result of a `find`). The found element can then have one or more callout functions applied: 
    
- `lock()` (equivalent to a click)
- `callout()` (equivalent to a double click)
- `arrow()` (equivalent to an Option-click)
- `shortcut()` (equivalent to Option-clicking a keyboard shortcut)

Example:

    // Find the File->Save menu item and apply a callout ring to it 
    // and all parent elements up the chain
    NiftyAPI.find('file/save').callout(true, true);

All callout functions can be passed a boolean parameter to enable/disable the callout. Running `NiftyAPI.clear()` will disable all callouts and clicks.

In the case of `callout()` a second boolean parameter determines whether parent items of the selected menu item will also receive callouts. This defaults to `false`.
