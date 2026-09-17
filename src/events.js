// Symbol.for uses a global registry shared across script contexts (e.g. separate bundles/iframes), unlike instanceof which relies on the class reference matching.
const BRAND = Symbol.for("TNAFrontendCookieEventHandler");

/**
 * Class to handle cookie events.
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
  [BRAND] = true;

  /**
   * If an instance already exists, return it instead of creating a new one.
   * @returns {CookieEventHandler} The existing or newly created instance.
   */
  constructor() {
    if (window.TNAFrontendCookieEvents?.[BRAND]) {
      /* eslint-disable-next-line no-constructor-return */
      return window.TNAFrontendCookieEvents;
    }
    window.TNAFrontendCookieEvents = this;
  }

  /**
   * Clear all event listeners.
   * @returns {void}
   */
  clearAll() {
    this.events = {};
    this.oneTimeEvents = {};
  }

  /**
   * Add an event listener.
   * @param {String} event - The event to add a listener for.
   * @param {Function} callback - The callback function to call when the event is triggered.
   * @returns {void}
   */
  on(event, callback) {
    this.events[event] = [...(this.events[event] || []), callback];
  }

  /**
   * Add a one-time event listener.
   * @param {String} event - The event to add a listener for.
   * @param {Function} callback - The callback function to call when the event is triggered.
   * @returns {void}
   */
  once(event, callback) {
    this.oneTimeEvents[event] = [
      ...(this.oneTimeEvents[event] || []),
      callback,
    ];
  }

  /**
   * Trigger all listeners registered for an event.
   * @param {String} event - The event to trigger.
   * @param {*} [data={}] - Data to pass to each listener.
   * @returns {void}
   * @protected
   */
  trigger(event, data = {}) {
    if (Object.hasOwn(this.events, event)) {
      this.events[event].forEach((eventToTrigger) =>
        eventToTrigger.call(this, data),
      );
    }
    if (Object.hasOwn(this.oneTimeEvents, event)) {
      this.oneTimeEvents[event].forEach((eachEvent) =>
        eachEvent.call(this, data),
      );
      this.oneTimeEvents[event] = [];
    }
  }
}
