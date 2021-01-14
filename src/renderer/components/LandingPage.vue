<template>
  <div id="wrapper">
    <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue" /> -->
    <main>
      <el-input
        v-loading="downloading"
        type="textarea"
        :rows="200"
        :autosize="{ minRows: 23, maxRows: 200 }"
        @blur="checkUrls"
        class="textarea-urls"
        placeholder="请输入url，一行一个，最多200个"
        v-model="urls"
      >
      </el-input>
    </main>
    <footer>
      <div class="btn-group">
        <div class="flex">
          <el-button size="mini" @click="handleChooseDir">输出目录</el-button>
          <div class="dir-text">{{ outputDir }}</div>
        </div>
        <div class="flex">
          <el-badge :value="info.sum">
            <el-button
              size="mini"
              type="primary"
              :disabled="info.sum < 1"
              @click="showDownloadList = true"
              >下载列表</el-button
            >
          </el-badge>
          <div class="sizebox"></div>
          <el-button
            class="down-btn"
            size="mini"
            :icon="downloading ? 'el-icon-loading' : 'el-icon-download'"
            type="primary"
            :disabled="downloading"
            @click="download"
            >{{ downloading ? "正在下载" : "开始下载" }}</el-button
          >
        </div>
      </div>
    </footer>
    <el-dialog fullscreen title="下载列表" :visible.sync="showDownloadList">
      <div>
        总计{{ info.sum }} 成功 {{ info.success }} 失败 {{ info.error }}
      </div>
      <el-scrollbar wrap-class="scrollbar-wrapper">
        <file-item
          v-for="(it, index) in list"
          :key="it.url"
          :name="it.name"
          :path="it.url"
          :progress="it.progress"
          :status="it.status"
          :size="it.size"
          :surplus="it.surplus"
          :error="it.error"
          @retry="handleDownloadOne(it, index)"
          @file="handleOpenFile(it)"
          @dir="handleOpenResource(it)"
        />
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<script>
import FileItem from "./FileItem.vue";
import SystemInformation from "./LandingPage/SystemInformation";
import {
  Queue,
  createFolders,
  downloader,
  throttle,
  getFilename,
} from "./../utils";
const { remote, shell } = require("electron");
const { dialog } = remote;
const currentWindow = remote.getCurrentWindow();
export default {
  name: "landing-page",
  components: { SystemInformation, FileItem },
  provide() {
    return {
      main: this,
    };
  },
  data() {
    return {
      downloading: false,
      showDownloadList: false,
      list: [],
      urls: ``,
      outputDir: "C:\\Users\\zfx\\Desktop\\test",
    };
  },
  computed: {
    info() {
      const sum = this.list.length;
      const success = this.list.filter((it) => it.progress === 1);
      const error = this.list.filter((it) => it.error);
      return {
        sum,
        complate: (success.length / sum) * 100 || 0,
        success: success.length,
        error: error.length,
      };
    },
  },
  mounted() {
    this.queue = new Queue(3);
  },
  methods: {
    download() {
      if (!this.outputDir) {
        this.handleChooseDir();
        return;
      }
      this.startDownload();
    },

    // 开始下载
    startDownload() {
      this.downloading = true;
      this.showDownloadList = true;
      const list = this.checkUrls();
      this.list = list.map((it) => ({
        name: getFilename(it),
        url: it,
        size: 0,
      }));
      this.handleDownloadList([...this.list]);
    },
    async handleDownloadList(list) {
      for (const [index, linkUrl] of Object.entries(list)) {
        await this.queue.push(this.handleDownloadOne(linkUrl, Number(index)));
      }
      await this.queue.finish();
      this.downloading = false;
    },
    // it: string
    async handleDownloadOne(it, index) {
      this.$set(this.list, index, {
        ...this.list[index],
        error: undefined,
      });
      // 根据网址生成文件夹
      createFolders(this.outputDir, it.url);
      const temp = it.url.split("/").slice(3).join("/");
      // img 是图片网址，basePath输出根目录，path是下载目录
      function updateProgress(data, that) {
        that.$set(that.list, index, { ...that.list[index], ...data });
      }
      const res = await downloader(
        { img: it.url, basePath: this.outputDir, path: temp },
        (data) => throttle(updateProgress, 1000)(data, this)
      ).catch((error) => (this.$set(this.list, index, { ...it, error }), null));
      if (!res) return;
      this.$set(this.list, index, {
        ...this.list[index],
        surplus: res.output.size,
      });
    },
    handleOpenFile(it) {
      shell.openItem(it.filePath)
    },
    handleOpenResource(it) {
      shell.showItemInFolder(it.filePath)
    },
    handleChooseDir() {
      var paths = dialog.showOpenDialog(currentWindow, {
        title: "选择目录",
        filters: [],
        properties: ["openDirectory"],
      });
      this.outputDir = paths[0];
    },
    checkUrls() {
      let { urls } = this;
      if (!(urls || "").trim()) {
        return [];
      }
      urls = urls.split(/\n/).filter((url) => {
        url = url.trim();
        return url.startsWith("http");
      });
      this.urls = urls.join("\n");
      return urls;
    },
    open(link) {
      require("electron").shell.openExternal(link);
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Source Sans Pro", sans-serif;
}

.sizebox {
  width: 30px;
}
.flex {
  display: flex;
  align-items: center;
}

.dir-text {
  margin-left: 20px;
}

#wrapper {
  background: radial-gradient(
    ellipse at top left,
    rgba(255, 255, 255, 1) 40%,
    rgba(229, 229, 229, 0.9) 100%
  );
  width: 100%;
  padding: 10px;
  height: calc(100vh - 50px);
}
footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 10px 20px;
}

#logo {
  height: auto;
  margin-bottom: 20px;
  width: 420px;
}

.textarea-urls {
  width: 100%;
  height: calc(100vh - 70px);
  outline: none;
  border: 0;
  font-size: 16px;
  overflow-y: auto;
}

.btn-group {
  display: flex;
  justify-content: space-between;
}
</style>
