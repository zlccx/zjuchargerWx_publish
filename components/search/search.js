// components/search/search.js
Component({
    /**
     * 组件的初始数据
     */
    data: {
        searchText: ''
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onInput(e) {
            this.setData({
                searchText: e.detail.value
            });
        },
        onSearch() {
            const searchText = this.data.searchText.trim();
            this.triggerEvent('search', {
                searchText: searchText
            });
        }
    }
})