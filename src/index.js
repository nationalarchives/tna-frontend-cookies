/* eslint-disable max-lines, no-ternary */

import CookieEventHandler from "./events.js";

// Symbol.for uses a global registry shared across script contexts (e.g. separate bundles/iframes), unlike instanceof which relies on the class reference matching.
export const BRAND = Symbol.for("TNAFrontendCookies");

/**
 * Class to handle cookies.
 * @class Cookies
 * @constructor
 * @public
 */
export default class Cookies {
  /** @protected */
  [BRAND] = true;

  /** @protected */
  defaultDomain = "";
  /** @protected */
  defaultPath = "";
  /** @protected */
  preferencesSetKey = "";
  /** @protected */
  secure = true;
  /** @protected */
  preferencesKey = "";
  /** @protected */
  events = null;
  /** @protected */
  defaultAge = null;
  /** @protected */
  preferencesCorrectOnInit = false;

  /** @protected */
  tnaCookiePreferences = ["usage", "settings", "marketing", "essential"];

  /**
   * Resolve the default cookie domain to use for a given hostname.
   * @param {String} hostname - The hostname to resolve a domain for.
   * @returns {String}
   * @protected
   */
  static getDefaultDomainForHostname(hostname) {
    return hostname.endsWith(".nationalarchives.gov.uk")
      ? ".nationalarchives.gov.uk"
      : hostname;
  }

  /**
   * Create a cookie handler.
   * @param {Object} [options={}] - Configuration options.
   * @param {String} [options.defaultDomain] - The domain to register the cookie with.
   * @param {String} [options.defaultPath] - The path to register the cookie with.
   * @param {Boolean} [options.secure] - Only set cookie in HTTPS environments.
   * @param {String} [options.preferencesKey] - The name of the cookie that stores the user's preferences.
   * @param {String} [options.preferencesSetKey] - The name of the cookie that dictates whether the user's preferences have been set.
   * @param {Number} [options.defaultAge] - The default age of non-session cookies.
   * @param {Boolean} [options.noInit=false] - Don't initialise a blank cookie preference.
   */
  /* eslint-disable-next-line max-statements, */
  constructor(options = {}) {
    const {
      defaultDomain,
      defaultPath,
      secure,
      preferencesKey,
      preferencesSetKey,
      defaultAge,
      noInit = false,
    } = options;
    const docDataset = document.documentElement.dataset;
    this.defaultDomain = defaultDomain
      ? defaultDomain
      : docDataset.tnaCookiesDomain ||
        Cookies.getDefaultDomainForHostname(window.location.hostname);
    this.defaultPath = defaultPath
      ? defaultPath
      : docDataset.tnaCookiesPath || "/";
    this.secure = secure ? secure : docDataset.tnaCookiesInsecure !== "true";
    this.preferencesKey = preferencesKey
      ? preferencesKey
      : docDataset.tnaCookiesPreferencesKey || "cookie_preferences";
    this.preferencesSetKey = preferencesSetKey
      ? preferencesSetKey
      : docDataset.tnaCookiesPreferencesSetKey || "cookie_preferences_set";
    this.defaultAge = defaultAge
      ? defaultAge
      : parseInt(docDataset.tnaCookiesDefaultAge, 10) ||
        /* eslint-disable-next-line no-magic-numbers */
        365 * 24 * 60 * 60;
    this.events = new CookieEventHandler();
    this.preferencesCorrectOnInit = this.validatePreferences(this.preferences);
    if (!this.preferencesCorrectOnInit) {
      this.preferencesSet = false;
      if (!noInit) {
        this.init();
      }
    }
  }

  /**
   * Initialise the cookie preferences with existing valid values.
   * @returns {void}
   * @protected
   */
  init() {
    const existingPreferences = this.preferences;
    const filteredExistingPreferences = Object.fromEntries(
      Object.keys(existingPreferences)
        .filter((preference) => this.tnaCookiePreferences.includes(preference))
        .map((preference) => [preference, existingPreferences[preference]]),
    );
    this.savePreferences({
      usage: false,
      settings: false,
      marketing: false,
      ...filteredExistingPreferences,
      essential: true,
    });
  }

  /**
   * Check whether a preferences object contains all supported preferences.
   * @param {Object} preferences - The preferences to validate.
   * @returns {Boolean} Whether the preferences are valid.
   * @protected
   */
  validatePreferences(preferences) {
    return (
      Object.keys(preferences).length === this.tnaCookiePreferences.length &&
      this.tnaCookiePreferences.every(
        (preference) =>
          Object.keys(preferences).includes(preference) &&
          typeof preferences[preference] === "boolean",
      )
    );
  }

  /**
   * Get all cookies as an object keyed by cookie name.
   * @returns {Object} The deserialised cookies.
   * @protected
   */
  /* eslint-disable-next-line class-methods-use-this */
  get all() {
    const deserialised = {};
    document.cookie
      .split("; ")
      .filter((cookie) => cookie.trim() !== "")
      .filter((cookie) => cookie.includes("="))
      .forEach((cookie) => {
        const parts = cookie.trim().split("=");
        const [key, value = ""] = parts;
        deserialised[key] = decodeURIComponent(value);
      });
    return deserialised;
  }

  /**
   * Get the stored cookie preferences.
   * @returns {Object} The stored preferences, or an empty object when none are stored.
   * @protected
   */
  get preferences() {
    try {
      return JSON.parse(this.get(this.preferencesKey) || "{}");
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return {};
    }
  }

  /**
   * Check to see whether a cookie exists or not.
   * @param {String} key - The cookie name.
   * @returns {Boolean}
   */
  exists(key) {
    return Object.hasOwn(this.all, key);
  }

  /**
   * Check to see whether a cookie has a particular value.
   * @param {String} key - The cookie name.
   * @param {String|Number|Boolean} value - The value to check against.
   * @returns {Boolean} Whether the cookie has the specified value.
   */
  hasValue(key, value) {
    return this.get(key) === value;
  }

  /**
   * Get a cookie.
   * @param {String} key - The cookie name.
   * @returns {String|Number|Boolean|null}
   */
  get(key) {
    if (this.exists(key)) {
      return decodeURIComponent(this.all[key]);
    }
    /* eslint-disable-next-line no-undefined */
    return undefined;
  }

  /**
   * Set a cookie.
   * @param {String} key - The cookie name.
   * @param {String|Number|Boolean} value - The cookie value.
   * @param {Object} options
   * @param {Number} [options.maxAge=this.defaultAge] - The maximum age of the cookie in seconds.
   * @param {String} [options.path=/] - The path to register the cookie for.
   * @param {String} [options.sameSite=Lax] - The sameSite attribute.
   * @param {String} [options.domain=this.defaultDomain] - The domain to register the cookie with.
   * @param {String} [options.path=this.defaultPath] - The path to register the cookie with.
   * @param {String} [options.secure=this.secure] - Only set cookie in HTTPS environments.
   * @param {String} [options.session=false] - Set a session cookie.
   */
  set(key, value, options = {}) {
    const {
      maxAge = this.defaultAge,
      sameSite = "Lax",
      domain = this.defaultDomain,
      path = this.defaultPath,
      secure = this.secure,
      session = false,
    } = options;
    if (!key) {
      return;
    }
    const secureString = secure ? "; secure" : "";
    const sessionString = session ? "" : `; max-age=${maxAge}`;
    const cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; domain=${domain}; samesite=${sameSite}; path=${path}${sessionString}${secureString}`;
    document.cookie = cookie;
    const cookieDetails = {
      key,
      value,
      maxAge,
      path,
      sameSite,
      domain,
      secure,
      session,
      cookie,
    };
    this.events.trigger("setCookie", cookieDetails);
  }

  /**
   * Delete a cookie.
   * @param {String} key - The cookie name.
   * @param {String} [path=/] - The path to the cookie is registered on.
   * @param {String} [domain=this.defaultDomain] - The domain the cookie is registered on.
   * @returns {void}
   */
  delete(key, path = "/", domain = this.defaultDomain) {
    const options = { maxAge: -1, path, domain };
    this.set(key, "", options);
    this.events.trigger("deleteCookie", { key, ...options });
  }

  /**
   * Delete all cookies.
   * @param {String} [path=/] - The path to the cookies are registered on.
   * @param {String} [domain=this.defaultDomain] - The domain the cookies are registered on.
   * @returns {void}
   */
  deleteAll(path = "/", domain = this.defaultDomain) {
    Object.keys(this.all).forEach((cookie) => {
      this.delete(cookie, path, domain);
    });
    const details = { path, domain };
    this.events.trigger("deleteAllCookies", details);
  }

  /**
   * Accept a preference.
   * @param {String} preference - The name of the preference.
   * @returns {void}
   */
  enablePreference(preference) {
    if (!Object.hasOwn(this.preferences, preference)) {
      throw new Error(`Preference '${preference}' does not exist`);
    }
    this.setPreference(preference, true);
    this.events.trigger("enablePreference", preference);
    this.events.trigger("changePreference", { [preference]: true });
  }

  /**
   * Reject a preference.
   * @param {String} preference - The name of the preference.
   * @returns {void}
   */
  disablePreference(preference) {
    if (!Object.hasOwn(this.preferences, preference)) {
      throw new Error(`Preference '${preference}' does not exist`);
    }
    this.setPreference(preference, false);
    this.events.trigger("disablePreference", preference);
    this.events.trigger("changePreference", { [preference]: false });
  }

  /**
   * Set a preference.
   * @param {String} preference - The name of the preference.
   * @param {Boolean} accepted - Whether the preference is accepted or not.
   * @returns {void}
   */
  setPreference(preference, accepted) {
    if (!Object.hasOwn(this.preferences, preference)) {
      throw new Error(`Preference '${preference}' does not exist`);
    }
    if (preference === "essential") {
      return;
    }
    this.savePreferences({
      ...this.preferences,
      [preference]: accepted,
      essential: true,
    });
    this.events.trigger("changePreference", { [preference]: accepted });
  }

  /**
   * Accept all the cookie preferences.
   * @returns {void}
   */
  enableAllPreferences() {
    const allPreferences = Object.fromEntries(
      Object.keys(this.preferences).map((key) => [key.toLowerCase(), true]),
    );
    this.savePreferences(allPreferences);
    this.preferencesSet = true;
    this.events.trigger("enableAllPreferences");
    this.events.trigger("changePreference", allPreferences);
  }

  /**
   * Reject all the cookie preferences.
   * @returns {void}
   */
  disableAllPreferences() {
    const allPreferences = {
      ...Object.fromEntries(
        Object.keys(this.preferences).map((key) => [key.toLowerCase(), false]),
      ),
      essential: true,
    };
    this.savePreferences(allPreferences);
    this.preferencesSet = true;
    this.events.trigger("disableAllPreferences");
    this.events.trigger("changePreference", allPreferences);
  }

  /**
   * Save the cookie preferences.
   * @param {Object} preferences - The preferences to save.
   * @returns {void}
   * @protected
   */
  savePreferences(preferences) {
    this.set(this.preferencesKey, JSON.stringify(preferences));
  }

  /**
   * Get the status of whether the preferences have been set.
   * @returns {Boolean}
   */
  get preferencesSet() {
    return this.hasValue(this.preferencesSetKey, "true");
  }

  /**
   * Set the status of whether the preferences have been set.
   * @param {Boolean} value - Whether the preferences have been set.
   * @returns {void}
   */
  set preferencesSet(value) {
    if (
      value === true &&
      this.validatePreferences(JSON.parse(this.get(this.preferencesKey)))
    ) {
      this.set(this.preferencesSetKey, "true");
    } else {
      this.delete(this.preferencesSetKey);
    }
    this.events.trigger("preferencesSet");
  }

  /**
   * Get the acceptance status of a preference.
   * @param {String} preference - The name of the preference.
   * @returns {Boolean} Whether the preference is accepted.
   */
  preference(preference) {
    if (Object.hasOwn(this.preferences, preference)) {
      return this.preferences[preference] === true;
    }
    throw new Error(`Preference '${preference}' does not exist`);
  }

  /**
   * Add an event listener.
   * @param {String} event - The event to add a listener for.
   * @param {Function} callback - The callback function to call when the event is triggered.
   * @returns {void}
   */
  on(event, callback) {
    this.events.on(event, callback);
  }

  /**
   * Add a one-time event listener.
   * @param {String} event - The event to add a listener for.
   * @param {Function} callback - The callback function to call when the event is triggered.
   * @returns {void}
   */
  once(event, callback) {
    this.events.once(event, callback);
  }
}
