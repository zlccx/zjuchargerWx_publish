// app.js
import store from '@/store/index';

App({
    onLaunch() {
        store.processData().catch((error) => {
            console.error('App launch error:', error);
            wx.showToast({
                title: '初始化失败',
                icon: 'none',
                duration: 2000
            });
        });

        // 从本地存储加载收藏数据
        try {
            const saved = wx.getStorageSync('favorites');
            if (saved && Array.isArray(saved.ids)) {
                store.setFavorites(saved.ids, saved.snapshots);
            } else {
                // 兼容旧版本：之前缓存的是完整 station 数组
                const legacy = wx.getStorageSync('favoriteStations');
                if (Array.isArray(legacy)) {
                    store.setFavorites(legacy);
                    // 迁移完成后清理旧缓存
                    wx.removeStorageSync('favoriteStations');
                }
            }
        } catch (error) {
            console.error('加载收藏数据失败:', error);
        }
    },

    // 小程序从前台进入后台时保存数据
    onHide() {
        this.saveDataToStorage();
    },

    // 保存数据到本地存储
    saveDataToStorage() {
        try {
            const { ids, snapshots } = store.getFavorites();
            wx.setStorageSync('favorites', { ids, snapshots });
            console.log('数据已保存到本地存储');
        } catch (error) {
            console.error('保存数据失败:', error);
        }
    }
})
