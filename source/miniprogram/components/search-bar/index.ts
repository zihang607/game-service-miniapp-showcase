Component({
    properties: {
        value: String, placeholder: {
            type: String, value: '搜索服务或陪练'
        }, disabled: Boolean
    }, methods: {
        onInput(e: WechatMiniprogram.Input) { this.triggerEvent('change', {
            value: e.detail.value
        }); }, onConfirm(e: WechatMiniprogram.Input) { this.triggerEvent('search', {
            value: e.detail.value.trim()
        }); }, onClear() { if (!this.data.disabled)
            this.triggerEvent('change', {
                value: ''
            }); }
    }
});
