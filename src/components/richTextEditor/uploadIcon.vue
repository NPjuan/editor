<template>
  <div class="cms-rich-text-toolbar-icon">
    <a-tooltip>
      <template slot="title">{{ title }}</template>
      <img
        :src="src"
        @click="() => $refs.fileUploader.click()"
      />
      <input
        ref="fileUploader"
        type="file"
        :accept="accept"
        style="display: none"
        @change="(e) => $emit('onFileChange', e)"
      />
    </a-tooltip>
  </div>
</template>

<script>
export default {
  name: 'UploadIcon',
  props: {
    src: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    accept: {
      type: String,
      default: '',
    },
  },
};
</script>
