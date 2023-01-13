/** HTML开始标签正则匹配
 *
 * 条件1: ‘<’开头，‘>’结尾
 * 条件2: 内容由‘tagName+attributes’组成
 * 条件3: tagName部分是英文字符串
 * 条件4: attributes部分可选
 * 条件5: attributes部分是由空格开头的字符串，但不包含‘<’和‘>’
 */
const OPEN_TAG_REG = /<([a-zA-Z]+[1-9]?)( [^<>]*)?>/g;
/** HTML结束标签正则匹配
 *
 * 条件1: ‘</’开头，‘>’结尾
 * 条件2: 内容由‘tagName’组成
 * 条件3: tagName部分是英文字符串
 */
const CLOSE_TAG_REG = /<\/([a-zA-Z]+[1-9]?)>/g;
/** 公式正则匹配
 *
 * 条件1: ‘$’开头，‘$’结尾
 * 条件2: 不能是‘\$’开头，不能是‘\$’结尾
 * 条件3: 公式中如果有‘$’，需要使用转义的‘$’，即‘\$’
 *
 * 参考资料：(?<!y)x表示仅仅当'x'前面不是'y'时匹配'x'，这被称为反向否定查找。
 * 参考链接：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions#special-negated-look-ahead
 */
const LATEX_REG = /(?<!\\)\$(([^$]||\\\$)*)(?<!\\)\$/g;
/** 资源占位符正则匹配
 *
 * 条件1: ‘$[’开头，‘]’结尾
 * 条件2: 内容由‘type:id’组成
 * 条件3: type是英文字符串，id是整数
 */
const RES_REG = /\$\[([a-zA-Z]+):([0-9]+)\]/g;
/** 换行符号正则匹配
 *
 * 条件2: ‘\n’
 * 条件3: ‘\r\n’
 */
const BREAKLINE_REG1 = /\r?\n/g;
/** 换行符号正则匹配
 *
 * 条件1: ‘\r’
 */
const BREAKLINE_REG2 = /\r/g;
/** 美元符号正则匹配
 *
 * 条件1: ‘\$’
 */
const DOLLAR_REG = /\\\$/g;
/** TTS转写格式正则匹配
 *
 * 形如: $[tts:{\"normalized_text\":[\"twenty\"],\"origin_text\":\"20\",\"from\":496,\"to\":498}]
 */
const TTS_REG = /\$\[tts:(\{.*?\})\]/g;

function pushTargetBefore(arr, msg, start, stop) {
  if (start === stop) {
    return;
  }

  arr.push({
    input: msg.substring(start, stop),
    type: 'string',
    eles: [],
  });
}

function pushTargetAfter(arr, msg, start) {
  if (start === msg.length) {
    return;
  }

  arr.push({
    input: msg.substring(start),
    type: 'string',
    eles: [],
  });
}

function split(msg, REG, pushTargetHandler) {
  const arr = [];
  let lastIdx = 0;
  let match;
  while ((match = REG.exec(msg)) !== null) {
    const start = match.index;
    pushTargetBefore(arr, msg, lastIdx, start);
    pushTargetHandler(arr, match);
    lastIdx = start + match[0].length;
  }
  pushTargetAfter(arr, msg, lastIdx);
  return arr;
}

function splitByBreakLine1(msg) {
  return split(msg, BREAKLINE_REG1, (arr, match) => {
    const [input] = match;

    arr.push({
      input,
      type: 'breakline',
      eles: [],
    });
  });
}

function splitByBreakLine2(msg) {
  return split(msg, BREAKLINE_REG2, (arr, match) => {
    const [input] = match;

    arr.push({
      input,
      type: 'breakline',
      eles: [],
    });
  });
}

function splitByResource(msg) {
  return split(msg, RES_REG, (arr, match) => {
    const [input, resName, id] = match;

    arr.push({
      input,
      type: 'resource',
      eles: [resName, id],
    });
  });
}

function splitByLatex(msg) {
  return split(msg, LATEX_REG, (arr, match) => {
    const [input, latex] = match;

    arr.push({
      input,
      type: 'latex',
      eles: [latex],
    });
  });
}

function splitByHtmlOpenTag(msg) {
  return split(msg, OPEN_TAG_REG, (arr, match) => {
    const [input, tagName, attributes = ''] = match;

    arr.push({
      input,
      type: 'open_tag',
      eles: [tagName, attributes],
    });
  });
}

function splitByHtmlCloseTag(msg) {
  return split(msg, CLOSE_TAG_REG, (arr, match) => {
    const [input, tagName] = match;

    arr.push({
      input,
      type: 'close_tag',
      eles: [tagName],
    });
  });
}

function splitByDollar(msg) {
  return split(msg, DOLLAR_REG, (arr, match) => {
    const [input] = match;

    arr.push({
      input,
      type: 'dollar',
      eles: [],
    });
  });
}

function splitByTTS(msg) {
  return split(msg, TTS_REG, (arr, match) => {
    const [input] = match;

    arr.push({
      input,
      type: 'tts',
      eles: [],
    });
  });
}

function stringItemHandler(arr, splitMethod) {
  return arr.map((item) => {
    if (item.type === 'string') {
      return splitMethod(item.input);
    }
    return item;
  }).flat();
}

function splitData(msg) {
  let arr = [{ input: msg, type: 'string', eles: [] }];
  arr = stringItemHandler(arr, splitByHtmlOpenTag);
  arr = stringItemHandler(arr, splitByHtmlCloseTag);
  arr = stringItemHandler(arr, splitByResource);
  arr = stringItemHandler(arr, splitByTTS);
  arr = stringItemHandler(arr, splitByLatex);
  arr = stringItemHandler(arr, splitByBreakLine1);
  arr = stringItemHandler(arr, splitByBreakLine2);
  arr = stringItemHandler(arr, splitByDollar);
  return arr;
}

export default splitData;
