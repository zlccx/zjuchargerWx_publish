// index.js
import { sortStations } from '@/utils/sort';
import { initFilterStations } from '@/utils/common';
import store from '@/store/index.js';

Page({
    data: {
        pageCount: null,
        sortBy: 0,
        sortText: ['智能排序', '按距离排序', '按空位排序'],
        selectedCampusIndex: 0, // 默认选中全部
        selectedCampus: '全部', // 选中的校区名称
        selectedProviderIndex: 0, // 默认选中全部
        selectedProvider: '全部', // 选中的运营商名称
        searchText: '', // 搜索文本
    },
    
    // 根据校区、运营商和搜索文本筛选充电桩
    filterStations() {
        initFilterStations(
            store.getState().stations,
            this.data.selectedCampus,
            this.data.selectedProvider,
            this.data.searchText
        );
        store.update('stations');
    },
    
    // 校区筛选
    onCampusChange(e) {
        const index = e.detail.value;
        const campus = this.data.campusList[index];
        this.setData({
            selectedCampusIndex: index,
            selectedCampus: campus
        });
        this.filterStations();
    },
    
    // 运营商筛选
    onProviderChange(e) {
        const index = e.detail.value;
        const provider = this.data.providerList[index];
        this.setData({
            selectedProviderIndex: index,
            selectedProvider: provider
        });
        this.filterStations();
    },
    
    changeSort() { // 更改排序方式 
        this.setData({ sortBy: (this.data.sortBy + 1) % 3 });
        // 使用统一的排序函数
        store.getState().stations = sortStations(store.getState().stations, this.data.sortBy);
        store.update('stations');
    },

    goDetail(e) {
        const index = e.currentTarget.dataset.index;
        const station = this.data.stations[index];
        console.log("index.js - 点击了充电桩\n", station);
        wx.navigateTo({
            url: '/pages/detail/detail?station=' + JSON.stringify(station)
        });
    },
    
    // 将campus和provider抽象为一个函数
    setFilterOption(type, value) {
        const listName = `${type}List`;
        const selectedIndexName = `selected${type.charAt(0).toUpperCase() + type.slice(1)}Index`;
        const selectedName = `selected${type.charAt(0).toUpperCase() + type.slice(1)}`;
        
        let list = this.data[listName];
        let index = list.indexOf(value);
        
        // 更新选中的值并筛选
        this.setData({
            [selectedIndexName]: index,
            [selectedName]: value
        });
        
        this.filterStations();
    },
    
    // 从详情页返回时设置校区
    setCampus(campus) {
        this.setFilterOption('campus', campus);
    },
    
    // 从详情页返回时设置运营商
    setProvider(provider) {
        this.setFilterOption('provider', provider);
    },

    // 搜索事件处理
    onSearch(e) {
        this.setData({ searchText: e.detail.searchText });
        this.filterStations();
    },

    onLoad() {
        const cnt = this.data.pageCount = store.currentPageCount();
        store.addUpdatePage("stations", cnt, this);
        store.addUpdatePage("campusList", cnt, this);
        store.addUpdatePage("providerList", cnt, this);
        store.addUpdatePage("userLocation", cnt, this);
    },
    
    onUnload() {
        const cnt = this.data.pageCount;
        store.delUpdatePage("stations", cnt, this);
        store.delUpdatePage("campusList", cnt, this);
        store.delUpdatePage("providerList", cnt, this);
        store.delUpdatePage("userLocation", cnt, this);
    },

    onShow() {
        console.log('index.js - onShow');
        const state = store.getState();
        
        // 检查是否需要设置校区筛选
        if (state.filter.campus) {
            this.setCampus(state.filter.campus);
            // 清空筛选条件，避免重复应用
            store.setFilter({ campus: null });
        }
        
        // 检查是否需要设置运营商筛选
        if (state.filter.provider) {
            this.setProvider(state.filter.provider);
            // 清空筛选条件，避免重复应用
            store.setFilter({ provider: null });
        }
    },

    async onPullDownRefresh() {
        await store.processData();
        wx.stopPullDownRefresh();
    }
})
