import Cookies from "./index.js";

class CookiesInstancable extends Cookies {
  constructor(options) {
    if (
      window.TNAFrontendCookies &&
      window.TNAFrontendCookies instanceof CookiesInstancable
    ) {
      /* eslint-disable-next-line no-constructor-return */
      return window.TNAFrontendCookies;
    }
    super(options);
    window.TNAFrontendCookies = this;
  }

  destroyInstance() {
    if (window.TNAFrontendCookies === this) {
      window.TNAFrontendCookies = null;
    }
  }
}

export default new CookiesInstancable();
