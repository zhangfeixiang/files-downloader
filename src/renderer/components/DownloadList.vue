<template>
  <div>
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
      @retry="$emit('retry', it, index)"
      @copy="$emit('copy', [it])"
      @replace="$emit('replace', [it])"
    />
  </div>
</template>

<script>
import FileItem from "./FileItem.vue";
export default {
  components: { FileItem },
  inject: ["main"],
  props: {
    list: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped>
</style>