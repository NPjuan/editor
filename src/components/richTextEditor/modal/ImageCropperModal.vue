<template>
  <a-modal
    class="image-cropper-modal"
    :visible="value"
    title="图片编辑"
    :centered="true"
    ok-text="确认"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="() => $emit('input', false)"
  >
    <image-cropper v-model="newImage" />
  </a-modal>
</template>

<script>
import imageCropper from '../imageCropper.vue';
import { cloneDeep } from 'lodash';

export default {
  name: 'ImageCropperModal',
  components: {
    imageCropper,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    image: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      newImage: {},
    };
  },
  watch: {
    image: {
      handler(val) {
        this.newImage = cloneDeep(val);
      },
      immediate: true,
    },
  },
  methods: {
    handleOk() {
      this.$emit('input', false);
      this.$emit('handleOk', this.newImage);
    },
  },
};
</script>

<style lang="less" scoped>
.image-cropper-modal {
  span {
    display: block;
    margin: 5px 0;
  }
}
</style>
