/**
 * 支付宝小程序 - 滑动验证组件
 * 基于 vue-monoplasty-slide-verify 改写，使用支付宝 2D Canvas API。
 */
var PI = Math.PI;

function sum(x, y) { return x + y; }
function square(x) { return x * x; }

Component({
  props: {
    l: 42,
    r: 10,
    w: 0,
    h: 0,
    sliderText: '向右滑动',
    accuracy: 5,
    show: true,
    imgs: []
  },

  data: {
    loading: true,
    activeClass: '',
    canvasW: 0,
    canvasH: 0,
    L: 0,
    sliderLeft: 0,
    maskWidth: 0
  },

  /* ===== 生命周期 ===== */

  didMount: function () {
    var sys = my.getSystemInfoSync();
    var sw = sys.windowWidth;
    var cw = this.props.w > 0 ? this.props.w : Math.floor(sw * 0.9);
    var ch = this.props.h > 0 ? this.props.h : Math.floor(cw * 0.44);
    this.setData({
      canvasW: cw,
      canvasH: ch,
      L: this.props.l + this.props.r * 2 + 3
    });
    this._canvasReady = 0;
  },

  didUnmount: function () {
    clearTimeout(this._resetTimer);
    clearTimeout(this._redrawTimer);
    this._mainCtx = this._blockCtx = null;
    this._mainCanvas = this._blockCanvas = null;
    this._cachedImageData = null;
  },

  methods: {

    /* ===== Canvas 就绪 ===== */

    onMainCanvasReady: function () {
      if (++this._canvasReady >= 2) this._initCanvasContexts();
    },

    onBlockCanvasReady: function () {
      if (++this._canvasReady >= 2) this._initCanvasContexts();
    },

    _initCanvasContexts: function () {
      var self = this;
      my.createSelectorQuery()
        .select('#main-canvas').node()
        .select('#block-canvas').node()
        .exec(function (res) {
          if (!res || !res[0] || !res[1]) return;
          self._mainCanvas = res[0].node;
          self._blockCanvas = res[1].node;
          self._mainCtx = self._mainCanvas.getContext('2d');
          self._blockCtx = self._blockCanvas.getContext('2d');
          self.init();
        });
    },

    /* ===== 初始化 ===== */

    init: function () {
      try { this.initImg(); } catch (e) { this.setData({ loading: false }); }
    },

    initImg: function () {
      var self = this;
      var w = this.data.canvasW, h = this.data.canvasH, r = this.props.r, L = this.data.L;
      var mainCtx = this._mainCtx, blockCtx = this._blockCtx;
      var img = this._mainCanvas.createImage();

      img.onload = function () {
        try {
          var blockX = self.getRandomNumberByRange(L + 10, w - (L + 10));
          var blockY = self.getRandomNumberByRange(10 + r * 2, h - (L + 10));
          self._blockX = blockX;
          self._blockY = blockY;

          // 主画布：先画半透明白色缺口形状，再用 destination-over 把图片画到背后
          self.drawShape(mainCtx, blockX, blockY, 'fill');
          mainCtx.globalCompositeOperation = 'destination-over';
          mainCtx.drawImage(img, 0, 0, w, h);
          mainCtx.globalCompositeOperation = 'source-over';

          // 块画布：先用 clip 裁剪区域，再画图片，提取拼图块像素
          blockCtx.save();
          self.drawShape(blockCtx, blockX, blockY, 'clip');
          blockCtx.drawImage(img, 0, 0, w, h);
          var _y = blockY - r * 2 - 1;
          var imageData = blockCtx.getImageData(blockX, _y, L, L);
          blockCtx.restore();

          // 缓存像素数据，清空块画布，在初始位置绘制拼图块
          self._cachedImageData = imageData;
          self._pieceY = _y;
          blockCtx.clearRect(0, 0, w, h);
          blockCtx.putImageData(imageData, 0, _y);

          self.setData({ loading: false });
        } catch (e) {
          self.setData({ loading: false });
        }
      };

      img.onerror = function () { img.src = self.getRandomImg(); };
      img.src = this.getRandomImg();
    },

    drawShape: function (ctx, x, y, operation) {
      var l = this.props.l, r = this.props.r;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x + l / 2, y - r + 2, r, 0.72 * PI, 2.26 * PI);
      ctx.lineTo(x + l, y);
      ctx.arc(x + l + r - 2, y + l / 2, r, 1.21 * PI, 2.78 * PI);
      ctx.lineTo(x + l, y + l);
      ctx.lineTo(x, y + l);
      ctx.arc(x + r - 2, y + l / 2, r + 0.4, 2.76 * PI, 1.24 * PI, true);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();
      ctx[operation]();
    },

    _redrawPiece: function (offsetX) {
      if (!this._cachedImageData || !this._blockCtx) return;
      this._blockCtx.clearRect(0, 0, this.data.canvasW, this.data.canvasH);
      this._blockCtx.putImageData(this._cachedImageData, offsetX, this._pieceY);
    },

    /* ===== 工具 ===== */

    getRandomImg: function () {
      var imgs = this.props.imgs;
      return imgs && imgs.length
        ? imgs[this.getRandomNumberByRange(0, imgs.length - 1)]
        : 'https://xiaojinhe-cdn.iyoudui.cn/upload/common/2026615/slider-bg.png';
    },

    getRandomNumberByRange: function (start, end) {
      return Math.round(Math.random() * (end - start) + start);
    },

    /* ===== 触摸事件 ===== */

    onTouchStart: function (e) {
      if (this._success) return;
      var t = e.changedTouches[0];
      this._ox = t.pageX;
      this._oy = t.pageY;
      this._ts = Date.now();
      this._trail = [];
      this._lastMove = 0;
      this._touching = true;
      this.setData({ activeClass: 'container-active' });
    },

    onTouchMove: function (e) {
      if (!this._touching || this._success) return;
      var now = Date.now();
      if (now - this._lastMove < 50) return;
      this._lastMove = now;

      var w = this.data.canvasW;
      var t = e.changedTouches[0];
      var mx = t.pageX - this._ox;
      if (mx < 0 || mx + 38 >= w) return;

      var bl = ((w - 60) / (w - 40)) * mx;
      this._bl = bl;
      this._trail.push(t.pageY - this._oy);

      this.setData({ sliderLeft: mx, maskWidth: mx });

      var self = this;
      clearTimeout(this._redrawTimer);
      this._redrawTimer = setTimeout(function () { self._redrawPiece(bl); }, 0);
    },

    onTouchEnd: function (e) {
      if (!this._touching) return;
      this._touching = false;
      this.setData({ activeClass: '' });

      if (e.changedTouches[0].pageX === this._ox) return;

      var trail = this._trail || [];
      this._trail = null;

      var result = this.verify(trail);
      if (result.spliced) {
        if (this.props.accuracy === -1) {
          this._success = true;
          this.setData({ activeClass: 'container-success' });
          this._emit('onSuccess', { timestamp: Date.now() - this._ts });
          return;
        }
        if (result.turingTest) {
          this._success = true;
          this.setData({ activeClass: 'container-success' });
          this._emit('onSuccess', { timestamp: Date.now() - this._ts });
        } else {
          this.setData({ activeClass: 'container-fail' });
          this._emit('onAgain');
        }
      } else {
        this.setData({ activeClass: 'container-fail' });
        this._emit('onFail');
        var self = this;
        this._resetTimer = setTimeout(function () { self.reset(); }, 1000);
      }
    },

    _emit: function (name, data) {
      var fn = this.props[name];
      if (typeof fn === 'function') fn(data || {});
    },

    /* ===== 验证 ===== */

    verify: function (trail) {
      var avg = trail.reduce(sum, 0) / trail.length;
      var devs = trail.map(function (x) { return x - avg; });
      var std = Math.sqrt(devs.map(square).reduce(sum, 0) / trail.length);
      var acc = this.props.accuracy;
      acc = acc <= 1 ? 1 : acc > 10 ? 10 : acc;
      return {
        spliced: Math.abs(this._bl - this._blockX) <= acc,
        turingTest: avg !== std
      };
    },

    /* ===== 公共方法 ===== */

    reset: function () {
      clearTimeout(this._resetTimer);
      var w = this.data.canvasW, h = this.data.canvasH;

      this._success = false;
      this._trail = this._cachedImageData = null;
      this._lastMove = 0;

      this.setData({
        activeClass: '',
        sliderLeft: 0, maskWidth: 0, loading: true
      });

      if (this._mainCtx) this._mainCtx.clearRect(0, 0, w, h);
      if (this._blockCtx) this._blockCtx.clearRect(0, 0, w, h);

      try { this.initImg(); } catch (e) { this.setData({ loading: false }); }
      this._emit('onFulfilled');
    },

    onRefreshTap: function () {
      this.reset();
      this._emit('onRefresh');
    }
  }
});