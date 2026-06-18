Page({
  data: {
    show: true,
    msg: '',
    sliderText: '向右滑动',
    accuracy: 3,
    imgs: []
  },

  onSuccess: function (e) {
    var times = (e && e.timestamp) || 0;
    this.setData({ msg: '验证通过，耗时 ' + (times / 1000).toFixed(1) + 's' });
  },

  onFail: function () {
    this.setData({ msg: '' });
  },

  onRefresh: function () {
    this.setData({ msg: '' });
  },

  onAgain: function () {
    this.setData({ msg: '检测到非人为操作，请重试' });
    var comp = this.$selectComponent('#slideVerify');
    if (comp) comp.reset();
  },

  handleReset: function () {
    var comp = this.$selectComponent('#slideVerify');
    if (comp) comp.reset();
    this.setData({ msg: '' });
  },

  handleToggleAccuracy: function () {
    var accuracies = [1, 3, 5, 10];
    var idx = accuracies.indexOf(this.data.accuracy);
    this.setData({ accuracy: accuracies[(idx + 1) % accuracies.length],show:!this.data.show });
  }
});