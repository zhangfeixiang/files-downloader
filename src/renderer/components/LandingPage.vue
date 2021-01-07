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
          <el-badge :value="taskNum">
            <el-button
              size="mini"
              type="primary"
              :disabled="taskNum < 1"
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
    <el-dialog
      fullscreen
      :title="downloadInfo"
      :visible.sync="showDownloadList"
    >
      <file-item
        v-for="(it, index) in list"
        :key="index"
        :name="it.name"
        :path="it.path"
        :progress="it.progress"
        :status="it.status"
        :size="it.size"
        :surplus="it.surplus"
        :error="it.error"
        @retry="handleDownloadOne(it, index)"
        @copy="handleCopys([it])"
        @replace="handleReplaces([it])"
      />
    </el-dialog>
  </div>
</template>

<script>
import FileItem from "./FileItem.vue";
import SystemInformation from "./LandingPage/SystemInformation";
import { Queue, createFolders, downloader, getFilename } from "./../utils";
const { remote } = require("electron");
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
      urls: `http://mwx.sanguosha.com/gamellk/res/ui/Game_atlas0_1.png
http://mwx.sanguosha.com/gamellk/res/ui/Level_atlas0.png
http://mwx.sanguosha.com/gamellk/res/ui/Common.json
http://mwx.sanguosha.com/gamellk/res/ui/Common_atlas0.png
http://mwx.sanguosha.com/gamellk/res/ui/Common_lu8n2d.mp3
https://dss0.bdstatic.com/6Ox1bjeh1BF3odCf/it/u=209243573,2643790266&fm=218&app=92&f=PNG?w=121&h=75&s=49D1A3465BF09E4B124C2C030300B0C2`,
      outputDir: "C:\\Users\\Administrator\\Desktop\\test",
    };
  },
  computed: {
    taskNum() {
      return this.list.length;
    },
    downloadInfo() {
      return `正在下载：2/${this.taskNum}`;
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
      const res = await downloader(
        { img: it.url, basePath: this.outputDir, path: temp },
        (data) => this.$set(this.list, index, { ...this.list[index], ...data })
      ).catch((error) => (this.$set(this.list, index, { ...it, error }), null));
      if (!res) return;
      this.$set(this.list, index, {
        ...this.list[index],
        surplus: res.output.size,
      });
    },
    handleCopys(list) {},
    handleReplaces(list) {},
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
