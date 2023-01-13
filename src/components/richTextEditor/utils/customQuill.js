import Vue from 'vue';
import Quill from 'quill';
import QuillBetterTable from 'quill-better-table';
import createLatexRender from './mathjax';
import { getImgInsertSource } from './index';

const Delta = Quill.import('delta');
const Block = Quill.import('blots/block');
const Image = Quill.import('formats/image');
const Parchment = Quill.import('parchment');

console.log('QuillBetterTable', QuillBetterTable)

class CustomTableTitle extends Block {
  static blotName = 'table-title';
  static className = 'cms-rich-text-table-title';
  static tagName = 'SPAN';
  static create(value) {
    const node = super.create();
    node.setAttribute('tableId', value);
    node.setAttribute('style', 'display:none;');
    return node;
  }
  static formats(domNode) {
    const tableId = domNode.getAttribute('tableId');
    return tableId;
  }
}

class CustomImage extends Image {
  static create(value) {
    const node = super.create(value.url);
    node.setAttribute('src', this.sanitize(value.url));
    node.setAttribute('title', value.title);
    node.setAttribute('style', value.style);
    node.setAttribute('data-id', value.id);
    return node;
  }
  static value(domNode) {
    const url = domNode.getAttribute('src');
    const title = domNode.getAttribute('title');
    const style = domNode.getAttribute('style');
    const id = domNode.getAttribute('data-id');
    // data-extra只有初始化时才有
    let extra;
    try {
      extra = JSON.parse(domNode.getAttribute('data-extra'));
    } catch (error) {
      extra = {};
    }

    return { url, title, style, id, ...extra };
  }
  static fileUploadHandler(files, callback) {
    const promises = files.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    }));
    Promise.all(promises).then(images => images.forEach(image => callback(image)));
  }
  // 初始化编辑器时的图片，以及粘贴的图片都会执行pasteHandler逻辑
  static pasteHandler(node, delta, addOrUpdateImage) {
    const imageInfo = delta.ops[0].insert.image;
    let [width, height] = [0, 0];
    imageInfo?.style?.replace(/width:([0-9]+[.?[0-9]+]?)px;height:([0-9]+[.?[0-9]+]?)px/g, (m, p1, p2) => {
      width = parseInt(p1, 10);
      height = parseInt(p2, 10);
      return m;
    });
    const { url, id, position, status } = imageInfo;
    let newImage = { width, height, url, position };
    // 使用status来区分初始化渲染的图片和复制粘贴的图片：init表示初始化的。
    // 是初始化的图片则将id赋值给newImage，否则由addOrUpdateImage新增一个图片对象，id递增
    if (status === 'init') {
      newImage.id = id;
    }
    newImage = addOrUpdateImage(newImage);
    // 重新给图片的delta赋值
    return new Delta([{
      insert: {
        image: getImgInsertSource(newImage),
      },
    }]);
  }
}

function pauseAllAudio() {
  const self = this;
  const audios = document.getElementsByClassName('cms-rich-text-audio');
  [].forEach.call(audios, (audio) => {
    audio !== self && audio.pause();
  });
}

class CustomAudio extends Parchment.EmbedBlot {
  static blotName = 'audio';
  static className = 'cms-rich-text-audio';
  static tagName = 'AUDIO';
  static create(value) {
    const node = super.create();
    node.setAttribute('controls', true);
    node.setAttribute('src', value.url);
    node.setAttribute('title', value.title);
    node.addEventListener('play', pauseAllAudio.bind(node));
    return node;
  }
  static value(domNode) {
    const url = domNode.getAttribute('src');
    const title = domNode.getAttribute('title');
    return { url, title };
  }
}

// Extend the embed
class CustomMathjax extends Parchment.EmbedBlot {
  static blotName = 'mathjax';
  static className = 'cms-rich-text-latex';
  static tagName = 'SPAN';
  // Create node
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.innerHTML = `&#65279;$${this.escapeSpecChar(value)}$&#65279;`;
      node.contentEditable = 'false';
      node.setAttribute('latex-text', value);
    }
    // 等待公式添加到文档流后，再通过mathjax渲染
    Vue.nextTick(() => {
      const latexRender = createLatexRender();
      latexRender();
    });
    return node;
  }
  // 去除latex字符串中的特殊字符，避免html渲染时出错
  static escapeSpecChar(str) {
    return str.replace(/</g, '&lt;')
      .replace(/ /g, '&nbsp;');
  }
  // Return the attribute value (probably for Delta)
  static value(domNode) {
    return domNode.getAttribute('latex-text');
  }
  // 拷贝此类元素时返回的html内容，主要用于公式的复制粘贴
  html() {
    const newDomNode = this.domNode.cloneNode(true);
    const latexStr = this.domNode.getAttribute('latex-text');
    newDomNode.innerHTML = `$${latexStr}$`;
    return newDomNode.outerHTML;
  }
}
class CustomUnderline extends Parchment.EmbedBlot {
  static blotName = 'custom-underline';
  static className = 'cms-rich-text-underline';
  static tagName = 'U';

  // Create node
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.innerHTML = value;
      node.setAttribute('data-type', 'underline');
    }
    return node;
  }
  // Return the attribute value (probably for Delta)
  static value(domNode) {
    return domNode.innerHTML.replace(/&nbsp;/g, ' ');
  }
}

class CustomRemoveDollarItalic extends Parchment.EmbedBlot {
  static blotName = 'custom-remove-dollar-italic';
  static className = 'cms-rich-text-remove-dollar-italic';
  static tagName = 'U';

  // Create node
  static create(value) {
    console.log('value', value);
    const node = super.create(value);
    if (typeof value === 'string') {
      node.innerHTML = value;
      node.setAttribute('data-type', 'underline');
    }
    return node;
  }
  // Return the attribute value (probably for Delta)
  static value(domNode) {
    return domNode.innerHTML.replace(/&nbsp;/g, ' ');
  }
}
class CustomWave extends Parchment.EmbedBlot {
  static blotName = 'custom-wave';
  static className = 'cms-rich-text-wave';
  static tagName = 'U';

  // Create node
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.innerHTML = value;
      node.setAttribute('data-type', 'wave');
    }
    return node;
  }
  // Return the attribute value (probably for Delta)
  static value(domNode) {
    return domNode.innerHTML.replace(/&nbsp;/g, ' ');
  }
}
class CustomEmphasis extends Parchment.EmbedBlot {
  static blotName = 'custom-emphasis';
  static className = 'cms-rich-text-emphasis';
  static tagName = 'U';

  // Create node
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.innerHTML = value;
      node.setAttribute('data-type', 'emphasis');
    }
    return node;
  }
  // Return the attribute value (probably for Delta)
  static value(domNode) {
    return domNode.innerHTML.replace(/&nbsp;/g, ' ');
  }
}
class CustomBold extends Parchment.EmbedBlot {
  static blotName = 'custom-bold';
  static className = 'cms-rich-text-bold';
  static tagName = 'B';

  // Create node
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.innerHTML = value;
    }
    return node;
  }
  // Return the attribute value (probably for Delta)
  static value(domNode) {
    return domNode.innerHTML.replace(/&nbsp;/g, ' ');
  }
}
class CustomItalic extends Parchment.EmbedBlot {
  static blotName = 'custom-italic';
  static className = 'cms-rich-text-italic';
  static tagName = 'I';

  // Create node
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.innerHTML = value;
    }
    return node;
  }
  // Return the attribute value (probably for Delta)
  static value(domNode) {
    return domNode.innerHTML.replace(/&nbsp;/g, ' ');
  }
}

class CustomQuillBetterTable extends QuillBetterTable {
  static containerClassName = 'quill-better-table-wrapper';
  static config = {
    operationMenu: {
      items: {
        insertColumnRight: {
          text: '在右边插入1列',
        },
        insertColumnLeft: {
          text: '在左边插入1列',
        },
        insertRowUp: {
          text: '在上边插入1行',
        },
        insertRowDown: {
          text: '在下边插入1行',
        },
        mergeCells: {
          text: '合并单元格',
        },
        unmergeCells: {
          text: '拆分单元格',
        },
        deleteColumn: {
          text: '删除此列',
        },
        deleteRow: {
          text: '删除此行',
        },
        deleteTable: {
          text: '删除表格',
        },
      },
    },
  };
}
class CustomTableCol {
  static blotName = 'table-col';
  static tagName = 'col';
}

class CustomText {
  static handleSpecCharForText(text) {
    let newText = '';
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === '$' && text[i - 1] !== '\\') {
        newText += '\\$';
      } else {
        newText += text[i];
      }
    }
    return newText;
  }
}

// Extend the embed
class CustomTextToSpeech extends Parchment.EmbedBlot {
  static blotName = 'tts';
  static className = 'cms-rich-text-tts';
  static tagName = 'SPAN';
  // Create node
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.innerHTML = `${this.extractSpecificWords(value)}`;
      node.contentEditable = 'false';
      node.setAttribute('tts-text', value);
      node.setAttribute('style', 'color:#0088FB');
    }
    return node;
  }

  static extractSpecificWords(str) {
    const regexp = /(?<=\$\[tts:)(\{.*\})/g;
    const matchedArray = str.match(regexp) || [];
    let ttsData;
    if (matchedArray.length) {
      try {
        ttsData = JSON.parse(matchedArray[0]);
      } catch (e) {
        ttsData = {
          origin_text: '',
        };
        console.error('转写格式数据JSON解析错误!');
      }
    } else {
      ttsData = {
        origin_text: '',
      };
      console.error('未匹配到转写数据!');
    }
    if (ttsData.origin_text.trim()) {
      if (!ttsData.normalized_texts) ttsData.normalized_texts = [];
      return `${ttsData.origin_text} {${ttsData.normalized_texts.join('##')}}`;
    }
    return '';
  }

  static handleText(text) {
    // todo
    return text;
  }

  // Return the attribute value (probably for Delta)
  static value(domNode) {
    return domNode.getAttribute('tts-text');
  }
  // 拷贝此类元素时返回的html内容，主要用于tts的复制粘贴
  html() {
    // const newDomNode = this.domNode.cloneNode(true);
    // const ttsStr = this.domNode.getAttribute('tts-text');
    // newDomNode.innerHTML = `&#65279;${this.extractSpecificWords(ttsStr)}&#65279;`;
    // return newDomNode.outerHTML;
  }
}

// Register the module
Quill.register(CustomTableTitle);
Quill.register(CustomAudio);
Quill.register(CustomMathjax);
Quill.register(CustomUnderline);
Quill.register(CustomWave);
Quill.register(CustomEmphasis);
Quill.register(CustomBold);
Quill.register(CustomItalic);
Quill.register(CustomTextToSpeech);
// 第二个参数为true代表忽略告警。如果模块本身存在，再注册时会有告警。
Quill.register(CustomImage, true);
Quill.register({ 'modules/better-table': CustomQuillBetterTable }, true);
Quill.register(CustomRemoveDollarItalic, true);

export {
  Delta,
  Quill,
  CustomTableTitle,
  CustomImage,
  CustomAudio,
  CustomMathjax,
  CustomUnderline,
  CustomWave,
  CustomEmphasis,
  CustomBold,
  CustomItalic,
  CustomQuillBetterTable,
  CustomTableCol,
  CustomText,
  CustomTextToSpeech,
  CustomRemoveDollarItalic,
};
