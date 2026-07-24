/**
 * Class to handle cookies.
 * @class CookieEventHandler
 * @constructor
 * @public
 */
export default class CookieEventHandler {
  /** @protected */
  events = {};
  /** @protected */
  oneTimeEvents = {};
  /** @protected */
  debug = false;

  constructor(debug = false) {
    if (window.TNAFrontendCookieEvents) {
      this.log("Using existing TNAFrontendCookieEvents instance");
      window.TNAFrontendCookieEvents.debug = debug;
      /* eslint-disable-next-line no-constructor-return */
      return window.TNAFrontendCookieEvents;
    }
    this.debug = debug;
    window.TNAFrontendCookieEvents = this;
  }

  log(...args) {
    if (this.debug) {
      /* eslint-disable-next-line no-console */
      console.log("[TNA Frontend Cookie Events]", ...args);
    }
  }

  destroyInstance() {
    this.log("Destroying TNAFrontendCookieEvents instance");
    this.events = {};
    this.oneTimeEvents = {};
    window.TNAFrontendCookieEvents = null;
  }

  /**
   * Add an event listener.
   * @param {String} event - The event to add a listener for.
   * @param {Function} callback - The callback function to call when the event is triggered.
   */
  on(event, callback) {
    if (!Object.hasOwn(this.events, event)) {
      this.events[event] = [];
    }
    this.events[event] = [...this.events[event], callback];
  }

  once(event, callback) {
    if (!Object.hasOwn(this.oneTimeEvents, event)) {
      this.oneTimeEvents[event] = [];
    }
    this.oneTimeEvents[event] = [...this.oneTimeEvents[event], callback];
  }

  /** @protected */
  trigger(event, data = {}) {
    if (Object.hasOwn(this.events, event)) {
      this.log(`Triggering event: ${event}`, data);
      this.events[event].forEach((eventToTrigger) =>
        eventToTrigger.call(this, data),
      );
    }
    if (Object.hasOwn(this.oneTimeEvents, event)) {
      this.log(`Triggering one-time event: ${event}`, data);
      this.oneTimeEvents[event].forEach((eachEvent) =>
        eachEvent.call(this, data),
      );
      this.oneTimeEvents[event] = [];
    }
  }
}
