import splitData from './splitData';

/** HTML开始标签正则匹配
 *
 * 条件1: ‘<’开头，‘>’结尾
 * 条件2: 内容由‘tagName+attributes’组成
 * 条件3: tagName部分是英文字符串
 * 条件4: attributes部分可选
 * 条件5: attributes部分是由空格开头的字符串，但不包含‘<’和‘>’
 */
const ATTRIBUTES_REG = / ([-a-zA-Z]+)="([^"]+)"/g;

function getTextAlign(str) {
  let match;
  let style = '';
  const reg = new RegExp(ATTRIBUTES_REG);
  while ((match = reg.exec(str)) !== null) {
    const [, attrName, attrVal] = match;
    if (attrName === 'style') {
      style = attrVal;
      break;
    }
  }

  let textAlign = '';
  const styleArr = style.split(';');
  for (const styleItem of styleArr) {
    const item = styleItem.trim();
    const itemArr = item.split(':');
    if (itemArr.length !== 2) {
      continue;
    }

    let [styleName, styleVal] = itemArr;
    styleName = styleName.trim();
    styleVal = styleVal.trim();

    if (styleName === 'text-align') {
      textAlign = styleVal;
      break;
    }
  }

  const validValues = ['left', 'center', 'right'];
  return validValues.includes(textAlign) ? textAlign : validValues[0];
}

function getDataType(str) {
  let match;
  let dataType = '';
  const reg = new RegExp(ATTRIBUTES_REG);
  while ((match = reg.exec(str)) !== null) {
    const [, attrName, attrVal] = match;
    if (attrName === 'data-type') {
      dataType = attrVal;
      break;
    }
  }

  const validDataType = ['underline', 'wave', 'emphasis'];
  return validDataType.includes(dataType) ? dataType : validDataType[0];
}

function lexData(msg) {
  const arr = splitData(msg);
  return arr.map((item) => {
    const options = {};

    if (item.type === 'open_tag') {
      const [tagName, attributes] = item.eles;
      options.tagName = tagName;
      if (tagName === 'p') {
        options.textAlign = getTextAlign(attributes);
      }
      if (tagName === 'u') {
        options.dataType = getDataType(attributes);
      }
      return { type: item.type, input: item.input, options };
    }

    if (item.type === 'close_tag') {
      const [tagName] = item.eles;
      options.tagName = tagName;
      return { type: item.type, input: item.input, options };
    }

    if (item.type === 'resource') {
      const [resName, id] = item.eles;
      options.resName = resName;
      return { type: item.type, input: item.input, data: id, options };
    }

    if (item.type === 'latex') {
      const [latex] = item.eles;
      return { type: item.type, input: item.input, data: latex, options };
    }

    if (item.type === 'tts') {
      return { type: item.type, input: item.input, data: item.input, options };
    }

    return { type: item.type, input: item.input, options };
  });
}

export default lexData;
