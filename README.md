## 使用指南

```

### import

在 vue 项目的 index.html 中引入 MathJax.js 文件，并完成配置：

```html
<!-- <!-- <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script> -->
<script src="https://polyfill.alicdn.com/polyfill.min.js"></script> -->
<script src="https://polyfill.alicdn.com/polyfill.min.js"></script>
<script>
  MathJax = {
    options: {
      // 禁用MathJax自带的公式右键菜单
      enableMenu: false,
    },
    tex: {
      // 配置行内和块级公式的匹配规则
      inlineMath: [
        ["$", "$"],
        ["\\(", "\\)"],
      ],
      displayMath: [
        ["$$", "$$"],
        ["\\[", "\\]"],
      ],
    },
    chtml: {
      // 设置公式的渲染缩放比
      scale: 1.2,
    },
    startup: {
      // 禁用自动渲染，避免MathJax加载完成之后的首次自动渲染
      typeset: false,
    },
  };
</script>
<script
  id="MathJax-script"
  async
  src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"
></script>
```

### use

在使用组件处写入

```vue
<template>
  <rich-text-editor
    v-model="value"
    :resource="resource"
    @resourceChange="(value) => (resource = value)"
  />
</template>
```

```js
import RichTextEditor from "@tencent/yunxiaowei-rich-text-editor";

export default {
  components: {
    RichTextEditor,
  },
  data() {
    return {
      value:
        "编辑器的内容：\n图片：$[img:0]\n音频：$[audio:0]\n表格：$[table:0]\n公式：$1 + 1 = 2$\n",
      resource: { imgs: [], tables: [], audios: [] },
    };
  },
};
```

## 参数说明

题目预览组件有 4 个参数和 1 个事件：

### 参数

- value: 必选，编辑器内容数据，其中：
  - $[img:x]: 代表 id 为 x 的图片
  - $[audio:x]: 代表 id 为 x 的音频
  - $[table:x]: 代表 id 为 x 的表格
  - $XXX$: 代表内容为 XXX 的公式
    注：

1. value 值建议使用 v-model 方式绑定；value 改变有其他逻辑要处理可以使用 v-bind + @input 事件的形式，在@input 事件中处理；
2. 公式中值得注意，若$前方有转义符——'\'，即形式为'\$'，则此'\$'不会被认为是公式的结尾，直到下一个不带转义符的$为止，才算一个公式的结尾。

- resource: 可选，如果是纯文本类型的内容，可以不传：
  - imgs: Array，图片资源数组
  - audios: Array，音频资源数组
  - tables: Array，表格资源数组

### 事件

- resourceChange: 必选，资源数据变化后的处理。

注：
此组件为响应式组件，即外部传入数据改变时组件渲染效果会变，组件内部值改变时，会向外部传出改变后的值。
因此参数 value 建议使用 v-model 方式绑定；resourceChange 的处理函数中建议包含更新传入组件的 resource 值的逻辑。
具体实现可以参考上方示例。
