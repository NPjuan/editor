<template>
  <div class="cropper-container">
    <div v-if="!croppering" class="cropper-preview">
      <img
        ref="imgPreview"
        :style="imageStyle"
        :src="value.url"
        @load="onImageLoad"
        @error="onImageError"
      />
    </div>
    <vue-cropper
      v-else
      class="cropper-content"
      ref="cropper"
      :img="base64"
      @imgLoad="imgLoad"
      @realTime="realTime"
      v-bind="option"
    ></vue-cropper>
    <div class="image-info">
      <span>宽度：</span>
      <a-input-number
        :disabled="!croppering"
        v-model="width"
        :min="0"
        :formatter="value => `${value}px`"
        :parser="value => parseInt(value, 10)"
        @change="widthChange"
      />
      <span>高度：</span>
      <a-input-number
        :disabled="!croppering"
        v-model="height"
        :min="0"
        :formatter="value => `${value}px`"
        :parser="value => parseInt(value, 10)"
        @change="heightChange"
      />
      <span>位置：</span>
      <a-select :value="value.position" @change="positionChange" style="width: 120px">
        <a-select-option v-for="pos in positions" :key="pos.value" :value="pos.value">
          {{ pos.label }}
        </a-select-option>
      </a-select>
    </div>
    <div class="cropper-toolbar" v-if="!croppering">
      <a-button class="toolbar-item" @click="() => startEdit('scale')">缩放</a-button>
      <a-button class="toolbar-item" @click="() => startEdit('cropper')">裁剪</a-button>
    </div>
    <div class="cropper-toolbar" v-else>
      <a-radio-group
        v-if="editingType === 'cropper'"
        class="toolbar-item"
        default-value="move"
        button-style="solid"
        @change="changeCropperStatus"
      >
        <a-radio-button value="move">拖动</a-radio-button>
        <a-radio-button value="cropper">裁剪</a-radio-button>
      </a-radio-group>
      <a-button class="toolbar-item" type="primary" @click="saveEdit">保存</a-button>
      <a-button class="toolbar-item" @click="cancleCropper">取消</a-button>
    </div>
  </div>
</template>

<script>
import { VueCropper } from 'vue-cropper';
import { uploadFile } from '@/components/richTextEditor/api';
import { ERROR_IMAGE } from './data';

export default {
  name: 'imageCropper',
  components: { VueCropper },
  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      editingType: 'scale', // scale(缩放) | cropper(裁剪)
      imgStatus: 0, // 0：未加载；1：首次加载成功；>1：非首次
      cropperStatus: 'move', // 开始裁剪后，也有两个状态 cropper: 裁剪状态；move：拖动状态；
      width: 0,
      height: 0,
      base64: '',
      positions: [
        {
          label: '默认',
          value: 0,
        },
        {
          label: '左浮动',
          value: 1,
        },
        {
          label: '右浮动',
          value: 2,
        },
        {
          label: '左对齐',
          value: 3,
        },
        {
          label: '居中对齐',
          value: 4,
        },
        {
          label: '右对齐',
          value: 5,
        },
      ],
      lastWidthAndHeight: [],
      originalWidth: 0,
      imageRate: 1, // width / height
      imageScale: 1, // currentWidth / originalWidth
      scaleConvertFactor: 1, // scale的转换系数
      croppering: false,
      option: {
        outputSize: 1, // 裁剪生成图片的质量
        outputType: 'png', // 裁剪生成图片的格式
        info: true,	// 裁剪框的大小信息	true	true || false
        canScale: true, //	图片是否允许滚轮缩放	true	true || false
        autoCrop: false, //	是否默认生成截图框	false	true || false
        fixed: false, //	是否开启截图框宽高固定比例	true	true | false
        fixedNumber: [1, 1], //	截图框的宽高比例	[1, 1]	[宽度, 高度]
        full: true, //	是否输出原图比例的截图	false	true | false
        fixedBox: false, //	固定截图框大小 不允许改变	false	true | false
        canMove: true, //	上传图片是否可以移动	true	true | false
        canMoveBox: true, //	截图框能否拖动	true	true | false
        original: true, //	上传图片按照原始比例渲染	false	true | false
        centerBox: false, //	截图框是否被限制在图片里面	false	true | false
        high: true, //	是否按照设备的dpr 输出等比例图片	true	true | false
        infoTrue: false, //	true 为展示真实输出图片宽高 false 展示看到的截图框宽高	false	true | false
        maxImgSize: 2000, //	限制图片最大宽度和高度	2000	0-max
        mode: 'contain', //	图片默认渲染方式
      },
    };
  },
  watch: {
    value: {
      handler(val) {
        this.width = parseInt(val.width, 10);
        this.height = parseInt(val.height, 10);
      },
      immediate: true,
    },
  },
  computed: {
    imageStyle() {
      if (!this.height || !this.width) {
        return '';
      }
      return `height: ${this.height}px; width: ${this.width}px;`;
    },
  },
  methods: {
    onImageLoad() {
      if (this.width === 0) {
        const { width, height } = this.$refs.imgPreview;
        this.width = width;
        this.height = height;
      }
      this.setAvatarBase64(this.value.url, (data) => {
        this.base64 = data;
        console.log('success', data);
      });
    },
    onImageError() {
      this.$refs.imgPreview.src = ERROR_IMAGE;
    },
    startEdit(type) {
      this.editingType = type;
      this.croppering = true;
      this.imgStatus = 0;
      if (type === 'scale') {
        this.lastWidthAndHeight = { width: this.width, height: this.height };
      } else {
        this.cropperStatus = 'move';
      }
    },
    changeCropperStatus(e) {
      const type = e.target.value;
      if (type === 'cropper') {
        this.cropperStatus = 'cropper';
        // 确保cropper渲染后再开始截图
        this.$nextTick(() => {
          this.$refs.cropper.startCrop();
        });
      } else {
        this.cropperStatus = 'move';
        this.$refs.cropper.stopCrop();
      }
    },
    saveEdit() {
      if (this.editingType === 'cropper') {
        // 裁剪保存时需要上传新图片
        this.$refs.cropper.getCropBlob((data) => {
          const imgFile = new File([data], `${new Date().getTime()}.png`, {
            type: 'image/png',
          });
          uploadFile(imgFile, 'image').then((res) => {
            this.$emit('input', {
              ...this.value,
              url: res.data.payload.url,
              width: this.width,
              height: this.height,
            });
            this.croppering = false;
          });
        });
      } else {
        // 缩放保存时需要更新图片的长宽
        this.$emit('input', {
          ...this.value,
          width: this.width,
          height: this.height,
        });
        this.croppering = false;
      }
    },
    cancleCropper() {
      this.croppering = false;
      if (this.editingType === 'cropper') {
        // 裁剪模式下取消编辑，需要清除裁剪框
        this.$refs.cropper.clearCrop();
      } else {
        // 缩放模式下取消编辑，需要还原图片的长宽
        this.width = this.lastWidthAndHeight.width;
        this.height = this.lastWidthAndHeight.height;
      }
    },
    heightChange(value) {
      this.width = Math.round(value * this.imageRate);
      const targetScale = this.originalWidth ? this.width / this.originalWidth : 1;
      this.changeImageScale(targetScale, this.imageScale);
    },
    widthChange(value) {
      this.height = Math.round(value / this.imageRate);
      const targetScale = this.originalWidth ? this.width / this.originalWidth : 1;
      this.changeImageScale(targetScale, this.imageScale);
    },
    positionChange(value) {
      this.$emit('input', {
        ...this.value,
        width: this.width,
        height: this.height,
        position: value,
      });
    },
    imgLoad(status) {
      if (status === 'success') {
        this.imgStatus = 1;
      } else {
        this.imgStatus = 0;
      }
    },
    realTime(data) {
      // 图片未加载完成时不作处理
      if (!this.imgStatus) {
        return;
      }
      const { w, h, img } = data;
      const { width, height, transform } = img;
      const imgWidth = parseInt(width, 10);
      const imgHeight = parseInt(height, 10);
      this.imageScale = parseFloat(transform.substring(6), 10);
      if (this.imgStatus === 1) {
        // 首次加载成功后，需要根据width设置初始的scale
        // 用当前width与图片width计算出scale
        const targetScale = this.width / imgWidth;
        // 根据vue-cropper中关于changeScale的源码，得到scale的转化系数
        this.scaleConvertFactor = Math.max(imgWidth, imgHeight) / 20;
        this.changeImageScale(targetScale, this.imageScale);
        this.imageRate = imgWidth / imgHeight;
        this.originalWidth = imgWidth;
        this.imgStatus += 1;
      } else {
        if (this.editingType === 'scale') {
          // scale场景下能缩放图片，改变width和height
          this.width = Math.round(this.imageScale * imgWidth);
          this.height = Math.round(this.imageScale * imgHeight);
        } else {
          // cropper场景下，width和height只受裁剪框大小影响
          this.width = w || this.width;
          this.height = h || this.height;
        }
      }
    },
    changeImageScale(targetScale, originalScale) {
      // 根据vue-cropper中关于changeScale的源码，得到scale变化的规则
      const changeScaleNum = (targetScale - originalScale) * this.scaleConvertFactor;
      this.$refs.cropper.changeScale(changeScaleNum);
    },
    // 跨越问题导致 vue-cropper 无法操作图片，这里使用 base64 曲线救国
    setAvatarBase64(src, callback) {
      const image = new Image();
      // 处理缓存
      image.src = `${src}?v=${Math.random()}`;
      // 支持跨域图片
      image.crossOrigin = 'Anonymous';
      image.setAttribute('crossOrigin', 'anonymous');
      image.onload = () => {
        const base64 = this.transBase64FromImage(image);
        callback && callback(base64);
      };
    },
    // 将网络图片转换成base64格式
    transBase64FromImage(image) {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, image.width, image.height);
      // 可选其他值 image/jpeg
      return canvas.toDataURL('image/png');
    },
  },
};
</script>

<style lang="less" scoped>
@imgWidth: 400px;

.cropper-container {
  margin: auto;
  text-align: center;

  .cropper-preview {
    min-width: @imgWidth;
    height: @imgWidth;
    overflow: auto;
    display: flex;
  }

  .cropper-content {
    height: @imgWidth;
  }

  img {
    object-fit: contain;
    margin: auto;
  }

  .image-info {
    margin: 10px 0;

    span {
      margin-left: 10px;
    }
  }

  .cropper-toolbar {
    height: 32px;
    margin: 10px 0;
    text-align: right;

    .toolbar-item {
      margin-left: 10px;
    }
  }
}
</style>
