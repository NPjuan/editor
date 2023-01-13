<template>
  <a-modal
      class="anything-2-tts"
      :visible="value"
      title="人工转写"
      :centered="true"
      ok-text="确认"
      cancel-text="取消"
      @ok="handleOk"
      @cancel="() => $emit('input', false)"
  >
    <div class="tts-label">转写为</div>
    <a-textarea ref="input" v-model="ttsNormalizedData" placeholder="多个用##隔开" allow-clear @change="renderTTS" autoSize/>
    <div class="tts-label">转写后显示</div>
    <div class="tts-container" ref="ttsContainer"></div>
  </a-modal>
</template>

<script>

export default {
  name: 'Anything2TTSModal',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    selection: {
      type: Array,
      default: () => [],
    },
    range: {
      type: Object,
      default: () => {
      },
    },
  },
  data() {
    return {
      ttsNormalizedData: '',
      ttsStr: '',
      ttsRenderLoading: true,
      currentTTSData: null,
    };
  },
  mounted() {
    const { selection, range } = this;
    this.currentTTSData = null;
    this.ttsNormalizedData = '';
    this.ttsStr = '';
    if (selection.length) {
      // eslint-disable-next-line no-async-promise-executor
      const ttsResult = selection.map((item) => {
        const insertContent = item.insert;
        if (typeof insertContent === 'string') {
          return insertContent;
        }
        if (insertContent.image) {
          return '';
        }
        if (insertContent.mathjax) {
          return '';
        }
        if (insertContent.tts) {
          return insertContent.tts;
        }
        return '';
      });
      const inputString = ttsResult.join('');
      const ttsData = this.checkIfAlreadyTTSFormattedData(inputString);
      if (ttsData) {
        this.currentTTSData = ttsData;
        this.ttsNormalizedData = ttsData.normalized_texts.join('##');
      } else {
        const newTTSData = {
          normalized_texts: [],
          origin_text: inputString || '',
          from: range.index,
          to: range.index + range.length,
        };
        this.currentTTSData = newTTSData;
        this.ttsNormalizedData = '';
      }
    }
    setTimeout(() => {
      this.renderTTS();
      this.$refs.input?.focus();
    }, 0);
  },
  methods: {
    handleOk() {
      this.$emit('input', false);
      this.$emit('handleOk', this.ttsStr);
    },
    renderTTS() {
      const regexp = /(?:\n*\s*##\s*\n*)+/g;
      const normalizedDataArray = this.ttsNormalizedData.split(regexp);
      const displayNode = this.$refs.ttsContainer;
      if (this.currentTTSData) {
        this.currentTTSData.normalized_texts = normalizedDataArray;
        this.ttsStr = `$[tts:${JSON.stringify(this.currentTTSData)}]`;
        if (displayNode && this.currentTTSData.origin_text.trim()) {
          displayNode.innerHTML = `${this.currentTTSData.origin_text} {${normalizedDataArray.join('##')}}`;
        }
      } else {
        if (displayNode) displayNode.innerHTML = '';
      }
    },
    checkIfAlreadyTTSFormattedData(str) {
      const regexp = /(?<=\$\[tts:)(\{.*\})/g;
      const matchedArray = str.match(regexp) || [];
      if (matchedArray.length) {
        let ttsData;
        try {
          ttsData = JSON.parse(matchedArray[0]);
        } catch (e) {
          ttsData = {};
          console.error(`解析转写数据格式错误!,${matchedArray[0]}`);
        }
        return ttsData;
      }
      return false;
    },
  },
};
</script>

<style lang="less">
// 取消scoped，防止样式不作用于随后插入的dom元素
.anything-2-tts {
  .tts-label {
    margin: 5px 0;
  }

  .tts-label::after {
    content: ':';
    position: relative;
    top: -.5px;
    margin: 0 8px 0 2px;
  }

  .tts-container {
    overflow-x: auto;
    color: #0088fb;
  }
}
</style>
