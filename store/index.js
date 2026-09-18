import { bd09ToGcj02, calculateDistance } from '@/utils/geo';
import { extractCampusList, extractProviderList } from '@/utils/common';
import { sortStations } from '@/utils/sort';

// 初始状态
const initialState = {
    // setData 更新页面
    updatePages: {},
    pageCount: 0,

    userLocation: null,
    stations: null,
    originalStations: null,

    // 收藏：只记录 hash_id，展示时与最新站点数据关联
    favoriteIds: [],
    favoriteSnapshots: {},

    // 筛选条件
    filter: {
        campus: null,
        provider: null,
    },
};

// 状态存储
let state = JSON.parse(JSON.stringify(initialState));

// 收藏时保留的最小快照，用于站点从数据源消失后的兜底展示
function toSnapshot(station) {
    return {
        hash_id: station.hash_id,
        name: station.name,
        provider: station.provider,
        campus_name: station.campus_name,
        lat: station.lat,
        lon: station.lon,
        dist: station.dist,
        free: station.free,
        total: station.total,
        used: station.used,
    };
}

// 状态管理API
export const store = {
    getStatus() {  // request 不支持 Promise 风格，需要手动封装
        return new Promise((resolve, reject) => wx.request({
            url: 'https://charger.philfan.cn/api/status',
            success: (res) => {
                console.log('app.js - 成功获得充电桩状态');
                resolve(res.data);
            },
            fail: (err) => {
                console.log('app.js - 获得充电桩状态失败');
                reject(err);
            }
        }));
    },

    async processData() {
        let [userLocation, { stations }] = await Promise.all([wx.getLocation({ 'type': 'gcj02' }), this.getStatus()]);
        if (!stations) throw new Error('非法data');
        for (let i = 0; i < stations.length; i++) {
            let u = stations[i];
            if (!u.fixed) {
                [u.lat, u.lon] = bd09ToGcj02(u.lat, u.lon);
                u.fixed = true;
            }
            stations[i].dist = calculateDistance(u.lat, u.lon, userLocation.latitude, userLocation.longitude);
            stations[i].view = true;
            stations[i].like = false;
        }
        state.userLocation = userLocation;
        state.stations = stations;
        state.originalStations = JSON.parse(JSON.stringify(stations));

        // 提取校区列表
        state.campusList = extractCampusList(stations);
        // 提取运营商列表
        state.providerList = extractProviderList(stations);

        // 智能排序
        state.stations = sortStations(stations, 0);

        this.update("stations");
        this.update("campusList");
        this.update("providerList");
        this.update("userLocation");
    },

    delUpdatePage(dataName, pageName) {
        if (state.updatePages[dataName]) {
            delete state.updatePages[dataName][pageName];
        }
    },

    addUpdatePage(dataName, pageName, pageObj) {
        if (state.updatePages[dataName] === undefined) {
            state.updatePages[dataName] = { [pageName]: pageObj };
        } else {
            state.updatePages[dataName][pageName] = pageObj;
        }
    },

    update(dataName) {
        if (state.updatePages[dataName]) {
            for (const page of Object.values(state.updatePages[dataName])) {
                page.setData({ [dataName]: state[dataName] });
            }
        }
    },

    currentPageCount() {
        return state.pageCount ++ ;
    },

    // 获取当前状态
    getState() {
        return state;
    },

    // 更新状态
    setState(newState) {
        state = { ...state, ...newState };
    },

    // 重置状态
    resetState() {
        state = JSON.parse(JSON.stringify(initialState));
    },

    // 用户位置相关方法
    setUserLocation(location) {
        this.setState({ userLocation: location });
    },

    // 充电桩数据相关方法
    setStations(stations) {
        this.setState({ stations });
    },

    setOriginalStations(stations) {
        this.setState({ originalStations: stations });
    },


    // 收藏列表相关方法
    // favorites 可以是 hash_id 数组，也可以是旧版的完整 station 数组
    setFavorites(favorites, snapshots = {}) {
        const ids = [];
        const snapshotMap = { ...snapshots };
        for (const item of favorites || []) {
            const hashId = typeof item === 'string' ? item : item && item.hash_id;
            if (!hashId || ids.includes(hashId)) {
                continue;
            }
            ids.push(hashId);
            if (typeof item !== 'string' && !snapshotMap[hashId]) {
                snapshotMap[hashId] = toSnapshot(item);
            }
        }
        this.setState({ favoriteIds: ids, favoriteSnapshots: snapshotMap });
    },

    // 添加收藏
    addFavorite(station) {
        const hashId = station && station.hash_id;
        if (!hashId || state.favoriteIds.includes(hashId)) {
            return false;
        }
        this.setState({
            favoriteIds: [...state.favoriteIds, hashId],
            favoriteSnapshots: { ...state.favoriteSnapshots, [hashId]: toSnapshot(station) },
        });
        return true;
    },

    // 移除收藏
    removeFavorite(hashId) {
        if (!state.favoriteIds.includes(hashId)) {
            return false;
        }
        const snapshotMap = { ...state.favoriteSnapshots };
        delete snapshotMap[hashId];
        this.setState({
            favoriteIds: state.favoriteIds.filter((id) => id !== hashId),
            favoriteSnapshots: snapshotMap,
        });
        return true;
    },

    // 检查是否已收藏
    isFavorite(hashId) {
        return state.favoriteIds.includes(hashId);
    },

    // 收藏列表：用 hash_id 关联最新站点状态，数据源里没有的用快照兜底并标记 offline
    getFavoriteStations() {
        const source = state.originalStations || state.stations;
        const hasData = Array.isArray(source) && source.length > 0;
        const latestMap = new Map();
        if (hasData) {
            for (const station of source) {
                latestMap.set(station.hash_id, station);
            }
        }
        return state.favoriteIds.map((hashId) => {
            const latest = latestMap.get(hashId);
            if (latest) {
                return { ...latest, offline: false };
            }
            const snapshot = state.favoriteSnapshots[hashId] || {};
            // 只有在确实拿到全量数据、却没找到该站点时才判定为下线
            const offline = hasData;
            return {
                ...snapshot,
                hash_id: hashId,
                name: snapshot.name || '未知充电桩',
                // 已下线时状态未知，置 0 以便排在列表末尾
                free: offline ? 0 : snapshot.free,
                total: offline ? 0 : snapshot.total,
                used: offline ? 0 : snapshot.used,
                error: offline ? 0 : snapshot.error,
                view: true,
                like: true,
                offline,
            };
        });
    },

    // 筛选条件相关方法
    setFilter(filter) {
        this.setState({ filter: { ...state.filter, ...filter } });
    },

    resetFilter() {
        this.setState({ filter: { campus: null, provider: null } });
    },
};

// 导出store实例
export default store;
