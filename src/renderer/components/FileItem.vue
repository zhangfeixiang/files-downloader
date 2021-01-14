
<template>
  <li class="item" :style="{ '--width': `${progress * 100}%` }">
    <div class="item__left">
      <div class="item__left-img"><img :src="cover" /></div>
      <div class="item__left-name">
        <div class="item__left-name-title">{{ name }}</div>
        <div class="item__left-name-error" v-if="error">
          <i class="iconfont icon-shuaxin" @click="$emit('retry')"></i>
          <p>{{ error.type }}: {{ error.error }}</p>
        </div>
      </div>
    </div>

    <p class="item__tag">
      <span v-for="(it, index) in status" :key="index">{{ it }}</span>
      <span v-if="!error && progress === 1" @click="$emit('file')">打开文件</span>
      <span v-if="!error && progress === 1" @click="$emit('dir')">打开文件夹</span>
    </p>
  </li>
</template>

<script>
const imageReg = /\.(png|jpeg|jpg)$/i;
export default {
  computed: {
    cover() {
      return imageReg.test(this.path)
        ? this.path
        : require("./../assets/file-icon.png");
    },
  },
  props: {
    path: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    surplus: {
      type: Number,
      default: 0,
    },
    size: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
    },
    status: {
      type: Array,
      default: () => [],
    },
    error: Object,
  },
};
</script>

<style>
.item__tag{
  cursor: pointer;
}
</style>


<style lang="stylus">
.item {
  display: flex;
  padding: 10px;
  align-items: center;
  position: relative;
  justify-content: space-between;

  &:nth-child(2n) {
    background: #f7f8f9;
  }

  &:before {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: var(--width);
    height: 4px;
    background: #60a7ff;
    border-radius: @height * 0.5;
    transition: width 0.5s;
  }

  &__left {
    display: flex;
    align-items: center;
    flex: 1;

    &-img {
      width: 50px;
      height: 50px;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    &-name {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 0 10px;

      &-title {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &-error {
        width: 100%;
        height: 100%;
        color: red;
        display: flex;
        justify-content: flex-start;
        align-items: center;

        i {
          cursor: pointer;
          font-size: 25px;
        }
      }
    }
  }

  &__tag {
    font-size: 12px;

    span {
      background: rgba(176, 224, 230, 0.8);
      display: inline-block;
      line-height: 18px;
      height: 18px;
      border-radius: 9px;
      padding: 0 6px;
      margin-right: 5px;
      color: #333;
    }
  }
}
</style>
