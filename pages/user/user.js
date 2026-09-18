// pages/user/user.js

import { sortStations } from '@/utils/sort';
import store from '@/store/index'

Page({
    data: {
        favoriteStations: [], // 收藏的充电桩列表
        loading: true, // 加载状态
        sortBy: 0, // 排序方式：0-智能排序，1-按距离排序，2-按空位排序
        sortText: ['智能排序', '按距离排序', '按空位排序'],
        // 版本公告
        showAnnouncement: false,
        announcement: {
            version: 'v2.0.0',
            items: [
                {
                    title: '下拉刷新',
                    desc: '首页与收藏页支持下拉刷新，轻轻一拉即可获取最新充电桩状态。'
                },
                {
                    title: '收藏状态实时同步',
                    desc: '收藏列表会随最新数据更新空闲数、距离等信息；站点下线时以收藏快照展示并标注「已下线」。'
                },
                {
                    title: '搜索与筛选不再冲突',
                    desc: '搜索后再切换校区或运营商，搜索条件会被保留，无需重新输入。'
                }
            ]
        },
    },

    onLoad(options) {
        this.loadFavoriteStations();
    },

    onShow() {
        // 每次显示页面时重新加载收藏列表
        this.loadFavoriteStations();
    },

    // 页面相关事件处理函数--监听用户下拉动作
    onPullDownRefresh() {
        this.loadFavoriteStations();
        wx.stopPullDownRefresh();
    },

    // 加载收藏的充电桩
    loadFavoriteStations: function () {
        this.setData({
            loading: true
        });

        // 用 hash_id 关联最新站点状态（数据源里没有的用快照兜底）
        let favoriteStations = store.getFavoriteStations();

        // 对收藏列表进行排序
        let sortedStations = sortStations(favoriteStations, this.data.sortBy);

        this.setData({
            favoriteStations: sortedStations,
            loading: false
        });
    },

    // 更改排序方式
    changeSort() {
        this.setData({
            sortBy: (this.data.sortBy + 1) % 3
        });

        // 使用统一的排序函数
        let sortedStations = sortStations(this.data.favoriteStations, this.data.sortBy);

        this.setData({
            favoriteStations: sortedStations
        });
    },

    // 点击版本号查看版本公告
    onVersionTap() {
        this.setData({ showAnnouncement: true });
    },

    // 关闭版本公告
    closeAnnouncement() {
        this.setData({ showAnnouncement: false });
    },

    // 阻止弹窗内部点击冒泡到遮罩
    noop() {},

    // 跳转到充电桩详情页
    goDetail: function (e) {
        const item = e.currentTarget.dataset.item;
        wx.navigateTo({
            url: '/pages/detail/detail?station=' + JSON.stringify(item)
        });
    }
})
