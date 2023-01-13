<template>
  <a-modal
    :width="1000"
    :visible="value"
    title="公式编辑"
    :centered="true"
    ok-text="确认"
    cancel-text="取消"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="() => $emit('input', false)"
  >
    <iframe class="editor-container" ref="editor" src="https://educms.k12.qq.com/yatexeditor/editor.html"></iframe>
  </a-modal>
</template>

<script>
import MessageCenter from './MessageCenter.js';
const timeout = 2000;

export default {
  name: 'YatexModal',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    latexStr: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      iframeWindow: undefined,
      messageCenter: null,
      confirmLoading: false,
    };
  },
  mounted() {
    this.$nextTick(() => {
      console.log(this.$refs);
      this.iframeWindow = this.$refs.editor.contentWindow;
      this.$nextTick(this.initPostMessage);
    })
  },
  methods: {
    initPostMessage() {
      this.iframeWindow = this.$refs.editor.contentWindow;
      this.messageCenter = new MessageCenter(this.iframeWindow);
      this.messageCenter.addEventHandler('editorReady', (value) => {
        // 公式编辑器加载完成，开始发送初始化数据
        if (value) {
          const mathml = window.MathJax.tex2mml(this.latexStr)
            .replace(/>\n( )*</g, '><');
          const message = {
            type: 'renderMathML',
            value: mathml,
          };
          this.messageCenter.sendMessage(message, this.iframeWindow);
        }
      });
    },
    getLatex() {
      return Promise.race([
        new Promise((resolve) => {
          this.messageCenter.addEventHandler('latexChanged', (value) => {
            resolve(value);
          });
          const message = {
            type: 'getLatex',
          };
          this.messageCenter.sendMessage(message, this.iframeWindow);
        }),
        new Promise(resolve => setTimeout(resolve, timeout)),
      ]);
    },
    async handleOk() {
      this.confirmLoading = true;
      const latex = await this.getLatex();
      if (latex === undefined) {
        this.$message.error('获取latex超时');
        this.confirmLoading = false;
        return;
      }
      // 清除postMessage的监听
      this.messageCenter.destory();
      this.$emit('input', false);
      this.$emit('handleOk', latex);
      this.confirmLoading = false;
    },
  },
};
</script>

<style lang="less" scoped>
.editor-container {
  width: 952px;
  height: 600px;
}
</style>
