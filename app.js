App({
  onLaunch: function (options) {
    console.log('[App] 启动', options);
  },

  onShow: function (options) {
    console.log('[App] 显示', options);
  },

  onHide: function () {
    console.log('[App] 隐藏');
  },

  onError: function (msg) {
    console.error('[App] 错误', msg);
  },

  // 全局数据
  globalData: {
    userInfo: null
  }
});