// Decides whether a URL is a checkout/order-review page worth pausing on.
// Deliberately conservative: matching a product page or cart too eagerly
// would make the overlay feel naggy and get the extension uninstalled —
// the moment we want is "about to place the order," nothing earlier.

const CHECKOUT_PATTERNS = [
  // Amazon: checkout flow lives under /gp/buy/ (spc = order review) or /checkout/
  { host: /(^|\.)amazon\.(com|ca|co\.uk|de|fr|it|es|com\.mx)$/, path: /\/(gp\/buy|checkout)\// },
  { host: /(^|\.)bestbuy\.(com|ca)$/, path: /\/checkout\// },
  { host: /(^|\.)nike\.com$/, path: /\/checkout/ },
  { host: /(^|\.)apple\.com$/, path: /\/shop\/checkout/ },
  { host: /(^|\.)walmart\.(com|ca)$/, path: /\/checkout/ },
  { host: /(^|\.)ebay\.(com|ca)$/, path: /\/rxo|\/checkout/ },
  { host: /(^|\.)etsy\.com$/, path: /\/checkout/ },

  // The next 15, by general retail traffic — same conservative host+path
  // approach, but these paths are reasoned from common e-commerce
  // conventions rather than individually verified against a live checkout,
  // the way the seven above effectively were through actual testing. Treat
  // these as a starting point that may need a real run-through per site.
  { host: /(^|\.)target\.com$/, path: /\/(co|checkout)(\/|$)/ },
  { host: /(^|\.)costco\.com$/, path: /checkout/i },
  { host: /(^|\.)homedepot\.com$/, path: /\/checkout/ },
  { host: /(^|\.)lowes\.com$/, path: /\/checkout/ },
  { host: /(^|\.)wayfair\.(com|ca)$/, path: /\/checkout/ },
  { host: /(^|\.)ikea\.com$/, path: /\/checkout/ },
  { host: /(^|\.)macys\.com$/, path: /\/checkout/ },
  { host: /(^|\.)kohls\.com$/, path: /\/checkout/ },
  { host: /(^|\.)sephora\.com$/, path: /\/checkout/ },
  { host: /(^|\.)ulta\.com$/, path: /\/checkout/ },
  { host: /(^|\.)nordstrom\.com$/, path: /\/checkout/ },
  { host: /(^|\.)gamestop\.com$/, path: /\/checkout/ },
  { host: /(^|\.)temu\.com$/, path: /\/checkout/ },
  { host: /(^|\.)shein\.com$/, path: /\/(cart\/checkout|checkout)/ },
  { host: /(^|\.)aliexpress\.(com|us)$/, path: /\/(trade\/confirm|checkout)/ },
];

function isCheckoutUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return CHECKOUT_PATTERNS.some((p) => p.host.test(url.hostname) && p.path.test(url.pathname));
}

// Plain script for the content-script context; CommonJS export only for the
// node test runner.
if (typeof module !== "undefined") {
  module.exports = { isCheckoutUrl };
}
