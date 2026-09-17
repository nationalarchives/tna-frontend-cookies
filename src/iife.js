import Cookies, { BRAND } from "./index.js";

class CookiesInstancable extends Cookies {
  constructor(windowObject = window) {
    super();
    this.windowObject = windowObject;
    if (this.windowObject.TNAFrontendCookies?.[BRAND]) {
      this.windowObject.TNAFrontendCookies.destroyInstance =
        this.destroyInstance.bind(this);
      /* eslint-disable-next-line no-constructor-return */
      return this.windowObject.TNAFrontendCookies;
    }
    this.windowObject.TNAFrontendCookies = this;
  }

  destroyInstance() {
    this.windowObject.TNAFrontendCookies = null;
  }
}

export default new CookiesInstancable();
