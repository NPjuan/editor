<template>
  <a-modal
    :visible="value"
    title="音频设置"
    :centered="true"
    ok-text="确认"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="() => $emit('input', false)"
  >
    <span class="audio-setting-label">播放次数</span>
    <a-input-number v-model="playCount" :min="1" />
  </a-modal>
</template>

<script>
export default {
  name: 'AudioModal',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      playCount: 1,
    };
  },
  methods: {
    handleOk() {
      this.$emit('input', false);
      this.$emit('handleOk', { play_count: this.playCount });
    },
  },
};
</script>

<style lang="less" scoped>
.audio-setting-label::after {
  content: ':';
  position: relative;
  top: -.5px;
  margin: 0 8px 0 2px;
}
</style>
