<template>
  <div class="root">
    <div class="control-buttons">
      <button v-on:click="clickShowMoreButton" v-bind:disabled="enableShowMoreButton==false">全部表示</button>
      <button
        v-on:click="changeFilter('all')"
        v-bind:disabled="filterType=='all'"
        v-bind:style="{opacity:(filterType=='all'?1.0:0.3)}"
      >全て表示</button>
      <button
        v-on:click="changeFilter('my')"
        v-bind:disabled="filterType=='my'"
        v-bind:style="{opacity:(filterType=='my'?1.0:0.3)}"
      >自分のみ表示</button>
      <button
        v-on:click="changeFilter('other')"
        v-bind:disabled="filterType=='other'"
        v-bind:style="{opacity:(filterType=='other'?1.0:0.3)}"
      >他人のみ表示</button>
      <span>プレイリスト {{countMemo}}</span>
      <label>
        <input type="checkbox" v-model="enableWrapMode" />横並び表示
      </label>
      <a href="//www.youtube.com/view_all_playlists">プレイリスト一覧</a>
    </div>
    <ul class="list" v-bind:class="[enableWrapMode?'':'no-wrap']">
      <li
        class="item"
        v-for="data in datas"
        v-bind:key="data.playlistId"
        v-bind:class="{myPlayList:data.isMyPlaylist}"
      >
        <a class="link" v-bind:href="'https://www.youtube.com/playlist?list='+data.playlistId">
          <img v-bind:src="'https://i.ytimg.com/vi/'+data.topVideoId+'/mqdefault.jpg'" />
        </a>
        <ul class="data-texts">
          <li class="title">{{data.title}}</li>
          <li>
            <a
              class="link"
              v-bind:href="'https://www.youtube.com/playlist?list='+data.playlistId"
            >プレイリスト詳細</a>
            /
            <a
              class="link"
              v-bind:href="`https://www.youtube.com/playlist?list=${data.playlistId}&advanced_settings=1&disable_polymer=1`"
            >メモ付き詳細</a>
            /
            <a
              v-bind:href="'https://www.youtube.com/watch?v='+data.topVideoId+'&list='+data.playlistId"
            >最初の動画</a>
          </li>
          <li>
            ユーザ:
            <a v-bind:href="data.userUrl">{{data.userName}}</a>
          </li>
          <li>動画数:{{data.count}}</li>
          <li>{{data.isPrivate?"🔒非公開":"🔓公開"}}</li>
          <li>{{data.lastUpdateText}}</li>
        </ul>
      </li>
    </ul>
    <div class="control-buttons">
      <button v-on:click="clickShowMoreButton" v-bind:disabled="enableShowMoreButton==false">全部表示</button>
      <button
        v-on:click="changeFilter('all')"
        v-bind:disabled="filterType=='all'"
        v-bind:style="{opacity:(filterType=='all'?1.0:0.3)}"
      >全て表示</button>
      <button
        v-on:click="changeFilter('my')"
        v-bind:disabled="filterType=='my'"
        v-bind:style="{opacity:(filterType=='my'?1.0:0.3)}"
      >自分のみ表示</button>
      <button
        v-on:click="changeFilter('other')"
        v-bind:disabled="filterType=='other'"
        v-bind:style="{opacity:(filterType=='other'?1.0:0.3)}"
      >他人のみ表示</button>
      <span>プレイリスト {{countMemo}}</span>
      <label>
        <input type="checkbox" v-model="enableWrapMode" />横並び表示
      </label>
      <a href="//www.youtube.com/view_all_playlists">プレイリスト一覧</a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
type Type = {
  title: string,
  playlistId: string,
  thumbnail: string,
  count: number,
  userName: string,
  userUrl: string,
  topVideoId: string,
  lastUpdateText: string,
  isPrivate: boolean,
  isMyPlaylist: boolean
};
const saveKey = `q6q6x4ia`;
const selfYoutuveUrls = ["/FushiharaMovie"];
export default Vue.extend({
  mounted() {
    this.loadConfig();
    this.registerPlayListUpdateEvent();
    this.updatePlayListData();
    this.clickShowMoreButton();
  },
  data() {
    return {
      countMemo: "",
      datas: [] as Type[],
      enableShowMoreButton: true,
      enableWrapMode: false,
      filterType: "all" as ("all" | "my" | "other")
    }
  },
  watch: {
    enableWrapMode() {
      this.saveConfig();
    }
  },
  methods: {
    saveConfig() {
      localStorage[saveKey] = JSON.stringify({
        enableWrapMode: this.enableWrapMode,
        filterType: this.filterType
      });
    },
    loadConfig() {
      const v = JSON.parse(localStorage[saveKey] || "");
      if (v.enableWrapMode && typeof v.enableWrapMode == "boolean") {
        this.enableWrapMode = v.enableWrapMode;
      }
      if (v.filterType && typeof v.filterType == "string") {
        this.filterType = v.filterType;
      }
    },
    changeFilter(filterType: string) {
      this.filterType = filterType as any;
      this.updatePlayListData();
      this.saveConfig();
    },
    clickShowMoreButton() {
      const button = this.$el.parentElement?.querySelector<HTMLButtonElement>("ytd-button-renderer[id=show-more-button] a");
      if (!button) {
        this.enableShowMoreButton = false;
        return;
      }
      button.click();
      this.enableShowMoreButton = false;
    },
    registerPlayListUpdateEvent() {
      const targetDom = this.$el.parentElement?.querySelector<HTMLElement>("[id=contents] [id=items]");
      if (!targetDom) {
        return;
      }
      const observer = new MutationObserver((mutations) => {
        this.updatePlayListData();
        this.clickShowMoreButton();
      });
      observer.observe(targetDom, {
        childList: true,
        subtree: true
      });
      targetDom.style.display = "none";
    },
    updatePlayListData(): void {
      const doms = [...(this.$el.parentElement!.querySelectorAll<HTMLDivElement>("ytd-grid-playlist-renderer") || [])];
      this.datas = [];
      let totalCount = 0;
      let displayCount = 0;
      let hiddenCount = 0;
      for (let dom of doms) {
        let m1, m2;
        // title playlistId thumbnail count userName userUrl isPrivate topVideoId
        const title = dom.querySelector("[id=video-title]")?.getAttribute("title") || "";
        m1 = (dom.querySelector("[id=thumbnail]")?.getAttribute("href") || "").match(/\/watch\?v=(.+?)&list=(.+)/);
        if (!m1) { continue; }
        const topVideoId = String(m1[1]);
        const playListId = String(m1[2]);
        const thumbnail = `https://i.ytimg.com/vi/${topVideoId}/maxresdefault.jpg`;
        const count = Number(dom.querySelector<HTMLElement>("[id=overlays] yt-formatted-string")!.innerText);
        const userName = dom.querySelector<HTMLElement>("ytd-video-meta-block ytd-channel-name yt-formatted-string a")!.innerText;
        const userUrl = dom.querySelector<HTMLAnchorElement>("ytd-video-meta-block ytd-channel-name yt-formatted-string a")!.href;
        let lastUpdateText = "";
        if (m1 = dom.querySelector<HTMLElement>("[id=metadata-line]")) {
          if (m2 = m1.innerText.match(/更新$/)) {
            lastUpdateText = m1.innerText;
          }
        }
        let isPrivate = false;
        if (m1 = dom.querySelector<HTMLElement>("ytd-badge-supported-renderer span")) {
          if (m1.innerText == "非公開") {
            isPrivate = true;
          }
        }
        let isMyPlaylist = selfYoutuveUrls.find(url => userUrl.includes(url)) != null;
        totalCount += 1;
        if (this.filterType == "my" && !isMyPlaylist) {
          hiddenCount += 1;
          continue;
        }
        if (this.filterType == "other" && isMyPlaylist) {
          hiddenCount += 1;
          continue;
        }
        displayCount += 1;
        this.datas.push({
          title: title,
          playlistId: playListId,
          thumbnail: thumbnail,
          count: count,
          userName: userName,
          userUrl: userUrl,
          topVideoId: topVideoId,
          lastUpdateText: lastUpdateText,
          isPrivate: isPrivate,
          isMyPlaylist: isMyPlaylist
        });
      }
      this.countMemo = `表示中:${displayCount}個 全部で:${totalCount}個 非表示中:${hiddenCount}個`;
      this.enableShowMoreButton = true;
    }
  },
});
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
.control-buttons{
  background-color:white;
}
.list {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: 558px;
  overflow-x: scroll;
  width: 100%;
  &.no-wrap {
    flex-wrap: wrap;
    height: auto;
  }
  > li {
    background: #add;
    padding: 0 5px;
    display: flex;
    &.myPlayList {
      background: #ddd;
    }
    > .link {
      font-size: 0;
      display: block;
      > img {
        object-fit: contain;
        width: 160px;
        height: 90px;
      }
    }
    > * {
      font-size: 10px;
    }
    .data-texts {
      display: flex;
      flex-direction: column;
      > li {
        display: block;
      }
      .title {
        font-size: 20px;
      }
    }
  }
  > li:nth-child(odd) {
    background: #aee;
    &.myPlayList {
      background: #eee;
    }
  }
}
</style>