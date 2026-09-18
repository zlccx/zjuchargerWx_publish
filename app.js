// app.js
import store from '@/store/index';

App({
    onLaunch() {
        try {
            store.processData();
            // 从本地存储加载收藏数据
            const favoriteStations = wx.getStorageSync('favoriteStations');
            if (favoriteStations) {
                store.setFavoriteStations(favoriteStations);
            }
        } catch (error) {
            console.error('App launch error:', error);
            wx.showToast({
                title: '初始化失败',
                icon: 'none',
                duration: 2000
            });
        }
    },

    // 小程序从前台进入后台时保存数据
    onHide() {
        this.saveDataToStorage();
    },

    // 保存数据到本地存储
    saveDataToStorage() {
        try {
            const state = store.getState();
            wx.setStorageSync('favoriteStations', state.favoriteStations);
            console.log('数据已保存到本地存储');
        } catch (error) {
            console.error('保存数据失败:', error);
        }
    }
})
