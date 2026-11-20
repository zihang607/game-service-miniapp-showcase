import type { MoneyString } from '../../types/common';
Component({
    properties: {
        itemId: String, title: String, description: String, image: String, price: {
            type: null, value: null as MoneyString | null
        }, completedOrders: {
            type: Number, value: 0
        }
    }, methods: {
        onPress() { this.triggerEvent('select', {
            id: this.data.itemId
        }); }
    }
});
