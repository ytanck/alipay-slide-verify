Component({
    data: {
        // 拼图块当前 X 位置（rpx）
        currentX: 0,
        // 滑块按钮 left 位置（rpx）
        thumbLeft: 0,
        // 触摸起始 X（px）
        startTouchX: 0,
        // 触摸起始时滑块 left（rpx）
        startThumbLeft: 0,
        sliderText: "向右滑动",
        // 是否验证通过
        isVerified: false,
        // 是否验证失败
        isFailed: false,
    },
    props: {
        // 背景图 URL
        imageUrl: "",
        // 图片区域宽度（rpx）
        imageWidth: 690,
        // 图片区域高度（rpx）
        imageHeight: 300,
        // 缺口/拼图块 top 位置（rpx）
        pieceTop: 100,
        // 拼图块宽度（rpx）
        pieceWidth: 80,
        // 拼图块高度（rpx）
        pieceHeight: 80,
        // 缺口正确 X 位置（rpx）
        targetX: 300,
        // 允许误差（rpx）
        tolerance: 5,
        // 验证成功回调
        onSuccess: undefined,
        // 验证失败回调
        onFail: undefined,
    },

    methods: {
        onTouchStart(e) {
            if (this.data.isVerified) return;
            const touch = e.touches[0];
            this.setData({
                startTouchX: touch.pageX,
                startThumbLeft: this.data.thumbLeft,
                isFailed: false,
            });
        },

        onTouchMove(e) {
            if (this.data.isVerified || this.data.startTouchX === undefined) return;
            // 计算拼图块当前位置（按比例映射到图片宽度 - 拼图块宽度）
            const deltaPx = e.touches[0].pageX - this.data.startTouchX;
            const deltaRpx = deltaPx / this._rpxRatio;
            const maxTravel = this.props.imageWidth - 80; // 80 = thumb 宽度
            const thumbLeft = Math.max(
                0,
                Math.min(this.data.startThumbLeft + deltaRpx, maxTravel)
            );
            const pieceMaxX = this.props.imageWidth - this.props.pieceWidth;
            const currentX = Math.round((thumbLeft / maxTravel) * pieceMaxX);

            this.setData({ thumbLeft, currentX });
        },

        onTouchEnd() {
            if (this.data.isVerified || this.data.startTouchX === undefined) return;
            this.data.startTouchX = undefined;

            const diff = Math.abs(this.data.currentX - this.props.targetX);

            if (diff <= this.props.tolerance) {
                this.setData({
                    isVerified: true,
                    thumbLeft: this.props.imageWidth - 80,
                    currentX: this.props.targetX,
                    sliderText: "验证通过",
                });
                this.props.onSuccess && this.props.onSuccess();
            } else {
                this.setData({
                    isFailed: true,
                    sliderText: "验证失败，请重试",
                });
                this.props.onFail && this.props.onFail();
                this._resetTimer && clearTimeout(this._resetTimer);
                this._resetTimer = setTimeout(() => this.reset(), 800);
            }
        },

        reset() {
            clearTimeout(this._resetTimer);
            this.setData({
                thumbLeft: 0,
                currentX: 0,
                isVerified: false,
                isFailed: false,
                sliderText: "向右滑动",
            });
        },
    },

    didMount() {
        this._rpxRatio = my.getSystemInfoSync().windowWidth / 750;
    },

    didUnmount() {
        clearTimeout(this._resetTimer);
    },
});
