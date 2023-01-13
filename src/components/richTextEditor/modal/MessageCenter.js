class MessageCenter {
  origin = '*';
  events = {};

  constructor() {
    this.init();
  }

  init() {
    window.addEventListener('message', this.listener.bind(this));
  }
  listener(e) {
    // 只处理qq.com和localhost发送的postMessage
    if (e.origin.endsWith('qq.com') || e.origin.startsWith('http://localhost')) {
      this.origin = e.origin;
      const { type, value } = e.data;
      const func = this.events[type];
      if (func) {
        func(value);
      }
    } else {
      return;
    }
  }
  addEventHandler(type, callback) {
    callback instanceof Function
      ? (this.events[type] = callback)
      : console.warn(`args[1] expect Function but get ${typeof callback}`);
  }
  sendMessage(message, win) {
    win.postMessage(message, this.origin);
  }
  removeEventHandler(type) {
    if (this.events[type]) {
      Reflect.deleteProperty(this.events, type);
    }
  }
  destory() {
    window.removeEventListener('message', this.listener);
  }
}

export default MessageCenter;
