<template>
  <div id="app">
    <landing-page></landing-page>
  </div>
</template>

<script>
import LandingPage from './components/LandingPage.vue'
  export default {
  components: { LandingPage },
    name: 'files-downloader'
  }
</script>

<style>
  /* CSS */
  body{
    font-family: Helvetica Neue,Helvetica,PingFang SC,Hiragino Sans GB,Microsoft YaHei,SimSun,sans-serif;
  }
  input, textarea, select, button{
    font-family: inherit;
  }
</style>
