<template>
  <a-modal
    class="anything-2-latex"
    :visible="value"
    title="一键转latex"
    :centered="true"
    ok-text="确认"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="() => $emit('input', false)"
  >
    <a-spin :spinning="latexRenderLoading">
      <div class="latex-label">转换后保存的文本</div>
      <a-textarea ref="input" v-model="latexStr" placeholder="请输入公式" allow-clear @change="renderLatex" autoSize />
      <div class="latex-label">转换后显示</div>
      <div class="latex-container" ref="latexContainer"></div>
    </a-spin>
  </a-modal>
</template>

<script>
import { getImageLatex } from '../api/index.js';
import { debounce } from 'lodash';

export default {
  name: 'Anything2LatexModal',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    selection: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      latexStr: '',
      latexRenderLoading: true,
      refreshDocument: () => {
      },
    };
  },
  async mounted() {
    this.latexRenderLoading = true;
    const { selection } = this;
    this.refreshDocument = debounce(() => {
      // eslint-disable-next-line no-undef
      MathJax.startup.document.clear();
      // eslint-disable-next-line no-undef
      MathJax.startup.document.updateDocument();
    }, 400);
    if (selection) {
      // eslint-disable-next-line no-async-promise-executor
      const formulaArr = await Promise.all(selection.map(item => new Promise(async (resolve) => {
        try {
          const insertContent = item.insert;
          if (typeof insertContent === 'string') {
            return resolve(item.insert);
          }
          if (insertContent.image) {
            const res = await getImageLatex(insertContent.image.url);
            return resolve(res?.data?.payload?.latex_txt || '');
          }
          if (insertContent.mathjax) {
            return resolve(insertContent.mathjax);
          }
        } catch (e) {
          this.$message.error('获取latex文本失败');
        }
        return resolve('');
      })));
      this.latexStr = formulaArr.join('');
      this.renderLatex();
    }
    // 渲染完成之后自动聚焦到输入框
    this.$refs.input.focus();
  },
  methods: {
    handleOk() {
      this.$emit('input', false);
      this.$emit('handleOk', this.latexStr);
    },
    renderLatex() {
      const displayNode = this.$refs.latexContainer;
      displayNode.innerHTML = '';
      const options = window.MathJax.getMetricsFor(displayNode);
      options.display = true;
      // eslint-disable-next-line no-undef
      MathJax.tex2chtmlPromise(this.latexStr, options).then((node) => {
        displayNode.appendChild(node);
        this.refreshDocument();
      })
        .catch((e) => {
          this.$message.error('公式渲染出错');
          console.error('公式渲染出错', e);
        })
        .finally(() => {
          this.latexRenderLoading = false;
        });
    },
  },
};
</script>

<style lang="less">
// 取消scoped，防止样式不作用于随后插入的dom元素
.anything-2-latex {
  .latex-label {
    margin: 5px 0;
  }

  .latex-label::after {
    content: ':';
    position: relative;
    top: -.5px;
    margin: 0 8px 0 2px;
  }

  .latex-container {
    overflow-x: auto;

    .MJX-TEX {
      // 一键转latex中公式不自动换行，通过滚动条查看长公式
      white-space: nowrap;
    }

    // 回复块级公式渲染的样式，一键转latex中按块级效果展示
    .MathJax[jax='CHTML'][display='true'] {
      display: block;
      margin: 1em 0;
    }
  }
}
</style>
