<template>
  <div class="cms-rich-text-root" ref="quill" :key="updatedKey">
    <div class="cms-rich-text-toolbar" ref="quill-toolbar">
      <click-icon
        src="https://dingdangcdn.qq.com/edu/file/20210203/d5dd0e914560ef43a66ae580afb3db68/1612322389748.png"
        title="一键转latex"
        @click="on2LatexClick"
      />
      <click-icon
        src="https://dingdangcdn.qq.com/edu/file/20210119/ea58baa0b45476b04fbf26aa29701a9a/1611046636480.png"
        title="编辑公式"
        @click="formulaEditHandler"
      />
      <upload-icon
        src="https://dingdangcdn.qq.com/edu/file/20210201/9c08310883670284a14eed20e6899179/1612171572158.png"
        title="插入图片"
        :accept="acceptImageType.join()"
        @onFileChange="(e) => onFileChange(e, 'image')"
      />
      <upload-icon
        v-if="showInnerAudioUpload"
        src="https://dingdangcdn.qq.com/edu/file/20210427/ec36fc7bfd1c6bc7d300125f6cffe090/audio.svg"
        title="插入音频"
        :accept="acceptAudioType.join()"
        @onFileChange="(e) => onFileChange(e, 'audio')"
      />
      <click-icon
        src="https://dingdangcdn.qq.com/edu/file/20210312/3eadcd893b4f6b36443bc03a702fb616/1615536823564.png"
        title="插入表格"
        @click="() => showTableModal = true"
      />
      <click-icon
        :src="underlineTag.iconSrc"
        title="下划线"
        @click="() => wrapperContentWithHtmlTag(underlineTag.blotName)"
      />
      <click-icon
        :src="waveTag.iconSrc"
        title="波浪线"
        @click="() => wrapperContentWithHtmlTag(waveTag.blotName)"
      />
      <click-icon
        :src="emphasisTag.iconSrc"
        title="着重号"
        @click="() => wrapperContentWithHtmlTag(emphasisTag.blotName)"
      />
      <click-icon
        :src="boldTag.iconSrc"
        title="加粗"
        @click="() => wrapperContentWithHtmlTag(boldTag.blotName)"
      />
      <click-icon
        :src="italicTag.iconSrc"
        title="斜体"
        @click="() => wrapperContentWithHtmlTag(italicTag.blotName)"
      />
      <click-icon
        :src="removeDollarItalicTag.iconSrc"
        title="悬浮：展现富文本编辑器的原始值； 点击：去除原始值里 \$ 前面的 \"
        placement="top"
        @click="() => removeDollarItalicClick()"
        @mouseenter="showEscapeText"
        @mouseleave="hideEscapeText"
      />
      <!-- FIXME: 临时方案，解决jest报错问题 -->
      <template v-if="!isTestEnv">
        <button class="ql-align" value=""></button>
        <button class="ql-align" value="center"></button>
        <button class="ql-align" value="right"></button>
      </template>
      <click-icon
        :src="clearTag.iconSrc"
        title="清除样式"
        @click="() => wrapperContentWithHtmlTag(clearTag.blotName)"
      />
      <click-icon
        v-if="showTTS"
        src="https://dingdangcdn.qq.com/edu/file/20211116/b5dfa12ed40e7d26dd65b446779d8047/image.png"
        title="人工转写"
        @click="on2TTSClick"
      />
      <click-icon
        v-if="showEnumeration"
         src="https://dingdangcdn.qq.com/edu/file/20220217/c005547a6104fcf72696e054acbda571/image.png"
        title="枚举转换"
        @click="enumerationClick"
      />
    </div>
    <div class="cms-rich-text-content">
      <a-spin :spinning="insertTableLoading || uploadImageLoading">
        <div ref="quill-editor">
          <div v-html="htmlStr"></div>
        </div>
      </a-spin>
    </div>
    <anything-2-latex-modal
      v-if="showLatexModal"
      v-model="showLatexModal"
      :selection="selection"
      @handleOk="anything2LatexEnd"
    />
    <anything2-t-t-s-modal
      v-if="showTTSModal"
      v-model="showTTSModal"
      :selection="selection"
      :range="range"
      @handleOk="anything2TTSEnd"
    />
    <enumeration-modal
      v-if="showEnumerationModal"
      v-model="showEnumerationModal"
      :selection="selection"
      :range="range"
      @handleOk="handleEnumertion"
    />
    <image-cropper-modal
      v-if="showImageModal"
      v-model="showImageModal"
      :image="curImage"
      @handleOk="onImageUpdate"
    />
    <table-modal
      v-if="showTableModal"
      v-model="showTableModal"
      @handleOk="insertTable"
    />
    <yatex-modal
      v-if="showlatexEditorModal"
      v-model="showlatexEditorModal"
      :latexStr="selectedLatexStr"
      @handleOk="editorFormula"
    />
    <audio-modal
      v-if="showAudioModal"
      v-model="showAudioModal"
      @handleOk="(val) => uploadAudio(uploadingFile, val)"
    />
  </div>
</template>

<script>
import { cloneDeep } from 'lodash';
import {
  Quill,
  CustomTableTitle,
  CustomImage,
  CustomMathjax,
  CustomUnderline,
  CustomWave,
  CustomEmphasis,
  CustomBold,
  CustomItalic,
  CustomQuillBetterTable,
  CustomTableCol,
  CustomText,
  CustomAudio,
  CustomTextToSpeech,
  CustomRemoveDollarItalic,
} from './utils/customQuill';
import { ERROR_IMAGE } from './data';
import ImageForUpload from './utils/ImageForUpload';
import { uploadFile } from '@/components/richTextEditor/api';
import { getHtmlStrForRowData } from '@/utils/processRowData';
import { getEditorStrAndNewTables, handleSpecialChar, transformContentDataForTextDetection } from '@/utils/transformTableData';
import { getImgInsertSource } from './utils/index';
import Anything2LatexModal from './modal/Anything2LatexModal.vue';
import ImageCropperModal from './modal/ImageCropperModal.vue';
import TableModal from './modal/TableModal.vue';
import YatexModal from './modal/YatexModal.vue';
import AudioModal from './modal/AudioModal.vue';
import UploadIcon from './uploadIcon.vue';
import ClickIcon from './clickIcon.vue';
import 'quill/dist/quill.snow.css';
import 'quill-better-table/dist/quill-better-table.css';
import './less/index.less';

import underlineIcon from '@/assets/editorIcon/underline.png';
import waveIcon from '@/assets/editorIcon/wave.png';
import emphasisIcon from '@/assets/editorIcon/emphasis.png';
import clearIcon from '@/assets/editorIcon/clear.svg';
import boldIcon from '@/assets/editorIcon/bold.png';
import italicIcon from '@/assets/editorIcon/italic.png';
import removeDollarItalicIcon from '@/assets/editorIcon/dollar.svg';

import Anything2TTSModal from '@/components/richTextEditor/modal/Anything2TTSModal';
import EnumerationModal from '@/components/richTextEditor/modal/EnumerationModal';

const LATEX_CLASS_NAME = 'MJX-TEX';
const LATEX_ACTIVE_CLASS_NAME = 'MJX-TEX-active';

export default {
  name: 'RichTextEditor',
  components: {
    Anything2TTSModal,
    Anything2LatexModal,
    ImageCropperModal,
    TableModal,
    YatexModal,
    AudioModal,
    UploadIcon,
    ClickIcon,
    EnumerationModal,
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    resource: {
      type: Object,
      default: () => ({ imgs: [], tables: [], audios: [] }),
    },
    authInfo: {
      type: Object,
      default: () => ({}),
    },
    envInfo: {
      type: Object,
      default: () => ({}),
    },
    showTTS: {
      type: Boolean,
      default: false,
    },
    showEnumeration: {
      type: Boolean,
      default: false,
    },
    showInnerAudioUpload: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      placeholder: '请输入',
      quill: undefined,
      selection: [],
      range: { index: 0, length: 0 },
      curRes: { imgs: [], tables: [], audios: [] },
      htmlStr: '',
      curQuillStr: '',
      showLatexModal: false,
      showImageModal: false,
      showTableModal: false,
      showlatexEditorModal: false,
      showAudioModal: false,
      showTTSModal: false,
      showEnumerationModal: false,
      insertTableLoading: false,
      uploadImageLoading: false,
      curImage: {},
      selectedLatexStr: '',
      skipTableProcess: true, // 是否跳过表格的处理过程，如果编辑器未改动表格，则跳过
      updatedKey: 0, // 用于强制重新渲染富文本编辑器
      uploadingFile: null,
      underlineTag: {
        iconSrc: underlineIcon,
        blotName: CustomUnderline.blotName,
      },
      waveTag: {
        iconSrc: waveIcon,
        blotName: CustomWave.blotName,
      },
      emphasisTag: {
        iconSrc: emphasisIcon,
        blotName: CustomEmphasis.blotName,
      },
      boldTag: {
        iconSrc: boldIcon,
        blotName: CustomBold.blotName,
      },
      italicTag: {
        iconSrc: italicIcon,
        blotName: CustomItalic.blotName,
      },
      removeDollarItalicTag: {
        iconSrc: removeDollarItalicIcon,
        blotName: CustomRemoveDollarItalic.blotName,
      },
      clearTag: {
        iconSrc: clearIcon,
        blotName: 'clear',
      },
      isTestEnv: process.env.NODE_ENV === 'test',
      acceptImageType: ['image/png', 'image/jpg', 'image/jpeg'],
      acceptAudioType: ['audio/mpeg', 'audio/mp3'],
      oldImgsId: [],
    };
  },
  watch: {
    value: {
      handler(newVal) {
        if (newVal && newVal === this.curQuillStr) {
          return;
        }
        const formatVal = handleSpecialChar(newVal);
        // 如果数据更新了要同步到上层
        if (newVal !== formatVal) {
          this.$emit('input', formatVal);
        } else {
          const htmlStr = getHtmlStrForRowData(formatVal, this.resource);
          this.htmlStr = htmlStr;
          this.curQuillStr = formatVal;
          // 改变quill容器的key，强制重新初始化quill
          this.updatedKey += 1;
          this.$nextTick(() => {
            this.initQuill();
          });
        }
      },
      immediate: true,
      deep: true,
    },
    resource: {
      handler(val, oldVal) {
        this.curRes = cloneDeep(val);
        this.oldImgsId = (oldVal || val).imgs.map(({ id }) => id);
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    // 初始化富文本编辑框
    initQuill() {
      // 配置编辑框
      const quill = new Quill(this.$refs['quill-editor'], {
        modules: {
          toolbar: {
            container: this.$refs['quill-toolbar'],
          },
          table: false,
          'better-table': CustomQuillBetterTable.config,
          keyboard: {
            bindings: CustomQuillBetterTable.keyboardBindings,
          },
          clipboard: {
            matchers: [
              [CustomImage.tagName, (node, delta) => CustomImage.pasteHandler(node, delta, this.updateImage)],
              [`.${CustomQuillBetterTable.containerClassName}`, (node, delta) => {
                const tableId = this.addTable();
                // 插入table-title元素，用于注入表格id
                delta.ops.splice(0, 0, { insert: '\n', attributes: { 'table-title': `${tableId}` } });
                this.skipTableProcess = false;
                return delta;
              }],
            ],
          },
          uploader: { // 处理base64的图片的粘贴
            mimetypes: this.acceptImageType,
            handler: (range, files) => {
              const uploadBase64Image = (url) => {
                this.uploadAndInsertImage(this.base64Image2File(url, 'image.png', 'image/png'));
              };
              CustomImage.fileUploadHandler(files, uploadBase64Image);
            },
          },
        },
        placeholder: this.placeholder,
        theme: 'snow',
        bounds: this.$refs['quill-editor'], // 将富文本编辑框内的tooltip（如点击超链接弹出）限定在给定的DOM元素内
      });
      this.quill = quill;
      this.initEventListener();
      // 初始化表格，给表格加上对应的id
      this.initTable();
    },
    initEventListener() {
      // 监听相关事件
      // 富文本编辑器内容的双击事件
      this.$refs['quill-editor'].ondblclick = (e) => {
        if (e.target.tagName === CustomImage.tagName) {
          this.curImage = this.resource.imgs.find(item => item.id === parseInt(e.target.dataset.id, 10));
          this.showImageModal = true;
          const imgBlot = Quill.find(e.target);
          this.range.index = this.quill.getIndex(imgBlot);
        } else {
          // 判断是否双击公式，如果双击公式，弹出公式编辑器
          const path = e.path || [];
          path.some((item) => {
            if (item.className?.includes(LATEX_CLASS_NAME)) {
              this.on2LatexClick();
              return true;
            }
            return false;
          });
        }
      };
      // 处理公式单机选中事件
      this.$refs.quill.onclick = (e) => {
        const path = e.path || [];
        // 先去除上一个latex的选中效果
        if (window.targetLatex) {
          window.targetLatex.className = LATEX_CLASS_NAME;
        }
        path.some((item) => {
          if (item.className === LATEX_CLASS_NAME) {
            window.targetLatex = item;
            // eslint-disable-next-line no-param-reassign
            item.className = `${LATEX_CLASS_NAME} ${LATEX_ACTIVE_CLASS_NAME}`;
            const range = this.quill.getSelection();
            this.quill.setSelection(range?.index || 0, 1);
            return true;
          }
          return false;
        });
      };
      // quill编辑器内容变化的事件
      this.quill.on('text-change', this.contentChange);
      this.quill.root.addEventListener('paste', this.pasteHandler);
    },
    showEscapeText(event) {
      try {
        const oldShowExcapeTextEl = document.querySelector('#showEscapeTextEl');
        if (oldShowExcapeTextEl) {
          oldShowExcapeTextEl.remove();
        }
        const { path } = event;
        const editorEl = path.find(item => /cms-rich-text-root/.test(item.className));
        const editorToolbalEl = editorEl.firstChild;
        // const editorContentEl = editorToolbalEl.nextSibling;
        const showEscapeTextEl = document.createElement('div');
        showEscapeTextEl.setAttribute('id', 'showEscapeTextEl');
        editorEl.appendChild(showEscapeTextEl);

        const top = editorToolbalEl.offsetHeight;
        // const height = editorContentEl.offsetHeight;
        const width = editorEl.offsetWidth;
        showEscapeTextEl.style.top = `${top - 1}px`;
        // showEscapeTextEl.style.height = `${height}px`;
        showEscapeTextEl.style.width = `${width}px`;

        showEscapeTextEl.textContent = `${this.value}`;
      } catch (error) {
        console.log('showEscapeText Error:', error);
      }
    },
    hideEscapeText() {
      try {
        const showEscapeTextEl = document.querySelector('#showEscapeTextEl');
        showEscapeTextEl.remove();
      } catch (error) {
        console.log('hideEscapeText Error:', error);
      }
    },
    pasteHandler() {
      this.uploadImageLoading = true;
      const range = this.quill.getSelection();
      const contentDelta = this.quill.getContents();
      const images = contentDelta.ops.filter(op => op?.insert?.image);
      const needUploadImages = images.filter(op => !op.insert.image.url.startsWith('https://dingdangcdn.qq.com/'));
      if (!needUploadImages.length) return this.uploadImageLoading = false;
      const promises = needUploadImages.map(async (op) => {
        const { url, id } = op.insert.image;
        const img = await new ImageForUpload({ url, id: parseInt(id, 10) }, this.acceptImageType);
        // case1: 是base64，并且type有效的图片，上传到dingdangcdn
        if (img.isBase64Url && img.isValidType) {
          return this.uploadImage(this.base64Image2File(img.newUrl, `image.${img.type.split('/')[1]}`, img.type));
        }

        // case2: 不是base64或type无效的老图片（paste之前就存在的），返回原url
        if (img.isOldImg(this.oldImgsId)) {
          return { data: { payload: { url } } };
        }

        // case3: 不是base64或type无效的图片paste的图片，返回默认错误图片url
        if (img.isBase64Url) {
          this.$message.error('只支持jpeg、jpg、png格式的图片');
        } else {
          this.$message.error('图片复制失败，请尝试将其下载到本地后再点击“上传图标”上传');
        }
        return { data: { payload: { url: ERROR_IMAGE } } };
      });

      Promise.all(promises).then((res) => {
        needUploadImages.forEach((op, index) => {
          const { image } = op.insert;
          const oldImage = this.curRes.imgs.find(({ id }) => id === parseInt(image.id, 10));
          const newUrl = res[index].data.payload.url;
          oldImage.url = newUrl;
          image.url = newUrl;
        });
        this.$emit('resourceChange', this.curRes);
        this.quill.setContents(contentDelta);
        this.quill.setSelection(range.index);
      })
        .catch((err) => {
          console.error('上传图片错误', err);
        })
        .finally(() => {
          this.uploadImageLoading = false;
        });
    },
    formulaEditHandler() {
      const { selection } = this.getQuillSelectionInfo();
      const latexStr = selection.reduce((total, current) => total + (current.insert.mathjax || ''), '');
      this.selectedLatexStr = latexStr;
      this.showlatexEditorModal = true;
    },
    editorFormula(newLatex) {
      const { range } = this;
      this.quill.deleteText(range.index, range.length);
      // 延时执行，避免删除和添加同时执行时添加失败的情况
      setTimeout(() => {
        this.quill.insertEmbed(range.index, CustomMathjax.blotName, CustomText.handleSpecCharForText(newLatex));
        this.quill.setSelection(range.index + 1);
      }, 0);
    },
    onFileChange(e, type) {
      const [file] = e.target.files;
      // 每次上传后清空file，避免上传相同资源时无法触发change事件
      e.target.value = '';
      if (type === 'image') {
        this.uploadAndInsertImage(file);
      } else if (type === 'audio') {
        this.uploadingFile = file;
        this.showAudioModal = true;
      }
    },
    uploadImage(file) {
      if (file.size >= 1000000) { // 1MB
        this.$message.error('文件大小不能超过1MB');
        return;
      }
      if (!this.acceptImageType.includes(file.type)) {
        this.$message.error('只支持jpeg、jpg、png格式的图片');
        return;
      }
      return uploadFile(file, 'image');
    },
    uploadAndInsertImage(file) {
      const uploadRes = this.uploadImage(file);
      if (!uploadRes) return;
      uploadRes.then((res) => {
        const { url } = res.data.payload;
        const image = this.addImage({ url });
        const { range: addImageRange } = this.getQuillSelectionInfo();
        const idx = addImageRange?.index || 0;
        this.quill.insertEmbed(idx, CustomImage.blotName, getImgInsertSource(image));
        this.$message.success('文件上传成功');
      })
        .catch((e) => {
          this.$message.error('文件上传失败');
          console.error('文件上传失败', e);
        });
    },
    uploadAudio(file, setting) {
      if (file.size >= 5000000) { // 5MB
        this.$message.error('文件大小不能超过5MB');
        return;
      }
      if (!this.acceptAudioType.includes(file.type)) {
        this.$message.error('只支持mp3格式的音频');
        return;
      }
      uploadFile(file, 'audio').then((res) => {
        const { url } = res.data.payload;
        const audio = this.addAudio({ ...setting, url });
        const { range: addAudioRange } = this.getQuillSelectionInfo();
        this.quill.insertEmbed(addAudioRange?.index || 0, CustomAudio.blotName, { url, title: `$[audio:${audio.id}]` });
        this.$message.success('文件上传成功');
      })
        .catch((e) => {
          this.$message.error('文件上传失败');
          console.error('文件上传失败', e);
        });
    },
    on2LatexClick() {
      this.getQuillSelectionInfo();
      this.showLatexModal = true;
    },
    on2TTSClick() {
      this.getQuillSelectionInfo();
      this.showTTSModal = true;
    },
    enumerationClick() {
      this.getQuillSelectionInfo();
      const { selection } = this;
      if (selection.length === 0) {
        this.$message.info('请选择要枚举的内容');
      } else {
        const currentCon = selection[0].insert;
        if (currentCon.includes('//') && currentCon.split('###').length >= 3) {
          this.showEnumerationModal = true;
        } else {
          this.$message.error('该文本不符合规则，无法进行操作');
        }
      }
    },
    removeDollarItalicClick() {
      const text = this.quill.getText();
      const removeTailEnterText = text.slice(0, text.length - 1);
      this.$emit('input', removeTailEnterText);
    },
    wrapperContentWithHtmlTag(blotName) {
      const { selection, range } = this.getQuillSelectionInfo();
      // 未选中元素时，不做处理
      if (!selection.length && !range.length) {
        this.$message.warn('未选中元素，不做处理');
        return;
      }

      // 删除选中的文本
      this.quill.deleteText(range.index, range.length);
      // 插入内容
      // 延时执行，避免删除和添加同时执行时添加失败的情况
      setTimeout(() => {
        let text = '';
        selection.forEach((block) => {
          if (typeof block.insert === 'string') {
            // 正常情况，选中的是纯文本
            text += block.insert;
          } else if (typeof block === 'object') {
            // 选中的含有文本和其他块如加粗、下划线等
            text += Object.keys(block.insert).map(key => block.insert[key]);
          }
        });
        // 插入
        if (blotName === 'clear') {
          this.quill.insertText(range.index, text.replace(/&nbsp;/g, ' '));
        } else {
          this.quill.insertEmbed(range.index, blotName, text);
        }

        // 移动光标
        this.quill.setSelection(range.index + 1);
      }, 0);
    },
    anything2LatexEnd(latexStr) {
      if (latexStr) {
        this.quill.deleteText(this.range.index, this.range.length);
        // 延时执行，避免删除和添加同时执行时添加失败的情况
        setTimeout(() => {
          this.quill.insertEmbed(this.range.index, CustomMathjax.blotName, CustomText.handleSpecCharForText(latexStr));
          this.quill.setSelection(this.range.index + 1);
        }, 0);
      }
    },
    anything2TTSEnd(ttsStr) {
      if (ttsStr) {
        this.quill.deleteText(this.range.index, this.range.length);
        // 延时执行，避免删除和添加同时执行时添加失败的情况
        setTimeout(() => {
          this.quill.insertEmbed(this.range.index, CustomTextToSpeech.blotName, CustomTextToSpeech.handleText(ttsStr));
          this.quill.setSelection(this.range.index + 1);
          setTimeout(() => {
            this.textDetect();
          }, 0);
        }, 0);
      }
    },
    handleEnumertion(ttsStr) {
      if (ttsStr) {
        this.quill.deleteText(this.range.index, this.range.length);
        // 延时执行，避免删除和添加同时执行时添加失败的情况
        setTimeout(() => {
          this.quill.insertEmbed(this.range.index, CustomTextToSpeech.blotName, CustomTextToSpeech.handleText(ttsStr));
          this.quill.setSelection(this.range.index + 1);
          setTimeout(() => {
            this.textDetect();
          }, 0);
        }, 0);
      }
    },

    contentChange(delta) {
      const curIndex = delta.ops[0].retain;
      const [tableContainer] = this.quill.getModule('better-table').getTable({ index: curIndex });
      // skipTableProcess为true时，才根据当前改动的元素是不是tableContainer来判断是否跳过表格处理
      // skipTableProcess为false时，说明是insert table手动将状态改成了false，不跳过
      this.skipTableProcess = this.skipTableProcess ? !tableContainer : this.skipTableProcess;
      const quillBlots = this.quill.getLines();
      const { editorStr, newTables } = getEditorStrAndNewTables(quillBlots, this.curRes.tables, this.skipTableProcess);
      this.skipTableProcess = true;
      this.curRes.tables = newTables;
      this.$emit('input', editorStr);
      this.$emit('resourceChange', this.curRes);
      this.curQuillStr = editorStr;
      this.initTable();
    },
    // 获取当前的选中数据，同时在this中保存一份
    getQuillSelectionInfo() {
      const range = this.quill.getSelection(true);
      let selection = [];
      if (range) {
        selection = this.quill.getContents(range.index, range.length).ops || [];
      }
      this.selection = selection;
      this.range = range;
      return { selection, range };
    },
    onImageUpdate(newImage) {
      const { range } = this;
      const image = this.updateImage(newImage);
      // 删除原图片
      this.quill.deleteText(range.index, 1);
      // 延时执行，避免删除和添加同时执行时添加失败的情况
      setTimeout(() => {
        // 插入新图片
        this.quill.insertEmbed(range.index, CustomImage.blotName, getImgInsertSource(image));
      }, 0);
    },
    addImage(image) {
      const imageDefaultData = { id: -1, url: '', height: 0, width: 0, json_data: '', latex_text: '' };
      // url为空时，不新增图片数据到图片列表，避免新增无效图片
      if (!image.url) {
        return imageDefaultData;
      }
      const curId = Math.max(...(this.curRes.imgs.map(item => item.id)), -1) + 1;
      const newImage = { ...imageDefaultData, ...image, id: curId };
      this.curRes.imgs.push(newImage);
      this.$emit('resourceChange', this.curRes);
      return newImage;
    },
    updateImage(newImage) {
      const index = this.curRes.imgs.findIndex(item => item.id === newImage.id);
      let image = newImage;
      if (index !== -1) {
        image = {
          ...this.curRes.imgs[index],
          ...newImage,
        };
        this.$set(this.curRes.imgs, index, image);
        this.$emit('resourceChange', this.curRes);
      } else {
        image = this.addImage(image);
      }
      return image;
    },
    addAudio(audio) {
      const curId = Math.max(...(this.curRes.audios.map(item => item.id)), -1) + 1;
      const audioDefaultData = { url: '', play_count: 1 };
      const newAudio = { ...audioDefaultData, ...audio, id: curId };
      this.curRes.audios.push(newAudio);
      this.$emit('resourceChange', this.curRes);
      return newAudio;
    },
    addTable() {
      const maxTableId = Math.max(...(this.curRes.tables.map(item => item.id)), -1);
      const newTable = { id: maxTableId + 1, data: '[]', json_data: '' };
      this.curRes.tables.push(newTable);
      return maxTableId + 1;
    },
    updateTables(newTables) {
      this.curRes.tables = newTables;
      this.$emit('resourceChange', this.curRes);
    },
    // 将base64的图片转成文件
    // 参考：https://developer.mozilla.org/zh-CN/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
    base64Image2File(base64, filename, contentType) {
      const arr = base64.split(',');
      const bstr = atob(arr[1]);
      let leng = bstr.length;
      const u8arr = new Uint8Array(leng);
      do {
        leng -= 1;
        u8arr[leng] = bstr.charCodeAt(leng);
      } while (leng);
      const file = new File([u8arr], filename, { type: contentType });
      return file;
    },
    insertTable(options) {
      // 插入大表格时同步操作比较慢，这里加入loading状态，用异步来插入表格
      this.insertTableLoading = true;
      setTimeout(() => {
        const tableModule = this.quill.getModule('better-table');
        const tableId = this.addTable();
        const { range } = this.getQuillSelectionInfo();
        const index = range?.index || 0;
        this.skipTableProcess = false;
        tableModule.insertTable(options.row, options.col);
        const lines = this.quill.getLines(index + 1);
        // 为表格的第一个TableCol元素标记上表格id
        if (lines[0]?.domNode) {
          lines[0].domNode.tableId = tableId;
        }
        this.insertTableLoading = false;
      }, 0);
    },
    initTable() {
      this.skipTableProcess = false;
      const lines = this.quill.getLines();
      const delta = this.quill.getContents();
      const hasTableTilte = delta.ops.find(item => item?.attributes?.['table-title'] !== undefined);
      if (!hasTableTilte) {
        return;
      }
      // 为TableCol元素添加tableId属性
      lines.forEach((item, index) => {
        if (item.constructor.blotName === CustomTableTitle.blotName) {
          const [itemDelta] = item.delta().ops;
          const tableId = parseInt(itemDelta.attributes[CustomTableTitle.blotName], 10);
          const leftLines = lines.slice(index + 1);
          leftLines.some((item1) => {
            if (item1.constructor.blotName === CustomTableCol.blotName) {
              // eslint-disable-next-line no-param-reassign
              item1.domNode.tableId = tableId;
              return false;
            }
            return true;
          });
        }
      });
      // TableTitle用于在初始化时给TableCol的tableId赋值，赋值完成后删除TableTitle
      const tableTitles = this.quill.root.getElementsByClassName(CustomTableTitle.className);
      Array.from(tableTitles).forEach(item => item.remove());
    },
    textDetect() {
      const contents = this.quill.getContents();
      const transformedContents = transformContentDataForTextDetection(contents.ops);
      this.quill.setContents(transformedContents);
    },
  },
};
</script>
