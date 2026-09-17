import Cookies, { BRAND } from "./index.js";

class CookiesInstancable extends Cookies {
  /**
   * Create or reuse the global cookie handler instance.
   * @param {Window} [windowObject=window] - The window object to attach the instance to.
   */
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

  /**
   * Remove this instance from the global window object.
   * @returns {void}
   */
  destroyInstance() {
    this.windowObject.TNAFrontendCookies = null;
  }
}

export default new CookiesInstancable();
