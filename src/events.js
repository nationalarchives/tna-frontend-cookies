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

  constructor() {
    if (
      window.TNAFrontendCookieEvents &&
      window.TNAFrontendCookieEvents instanceof CookieEventHandler
    ) {
      /* eslint-disable-next-line no-constructor-return */
      return window.TNAFrontendCookieEvents;
    }
    window.TNAFrontendCookieEvents = this;
  }

  /**
   * Clear all event listeners.
   */
  clearAll() {
    this.events = {};
    this.oneTimeEvents = {};
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

  /**
   * Add a one-time event listener.
   * @param {String} event - The event to add a listener for.
   * @param {Function} callback - The callback function to call when the event is triggered.
   */
  once(event, callback) {
    if (!Object.hasOwn(this.oneTimeEvents, event)) {
      this.oneTimeEvents[event] = [];
    }
    this.oneTimeEvents[event] = [...this.oneTimeEvents[event], callback];
  }

  /** @protected */
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
