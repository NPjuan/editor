import parseData from './parseData';
import parseTable from './parseTable';
function htmlEscape(input) {
  const output = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/ /g, '&nbsp;')
    .replace(new RegExp(String.fromCharCode(0x3000), 'g'), '&nbsp;&nbsp;')
    .replace(/"/g, '&quot;');
  return output;
}

const getTableBoundary = (id) => `<span class="cms-rich-text-table-title" tableId="${id}"></span>`;

// 获取表格的html字符串
function getHtmlStrForTable(arr, resource, id) {
  if (!arr.length) {
    return '';
  }

  let str = '';
  for (const row of arr) {
    str += '<tr>';
    for (const col of row) {
      if (col.merge !== 'row' && col.merge !== 'col') {
        let attrs = '';
        if (col.colspan) {
          attrs += ` colspan="${col.colspan || 1}"`;
        }
        if (col.rowspan) {
          attrs += ` rowspan="${col.rowspan || 1}"`;
        }
        str += `<td${attrs}>`;
        str += lexToString(col.content, resource);
        str += '</td>';
      }
    }
    str += '</tr>';
  }
  const tableBoundary = getTableBoundary(id);
  const tableHeader = `<table title="$[table:${id}]"`
  + ' border="1" style="width:100%; border-collapse:collapse;">'
  + '<tbody>';
  const tableTailer = '</tbody></table>';
  return `${tableBoundary}${tableHeader}${str}${tableTailer}`;
}

function paserItems2str(arr, resource) {
  let message = '';
  const { imgs, audios } = resource;

  arr.forEach((messageItem) => {
    if (messageItem.type === 'latex') {
      const latexStr = messageItem.data;
      message += `<span class="cms-rich-text-latex" latex-text="${latexStr}"></span>`;
    } else if (messageItem.type === 'tts') {
      const ttsStr = htmlEscape(messageItem.data);
      message += `<span class="cms-rich-text-tts" tts-text="${ttsStr}"></span>`;
    } else if (messageItem.type === 'breakline') {
      message += '<br>';
    } else if (messageItem.type === 'resource' && messageItem.resName === 'img') {
      const idStr = messageItem.data;
      const index = parseInt(idStr, 10);
      const imgItem = imgs.find(item => item.id === index) || {};
      const { url = '', width, height, position } = imgItem;
      const style = (height > 0 && width > 0) ? `width:${width}px;height:${height}px;` : '';
      const extraInfo = JSON.stringify({ id: index, position, status: 'init' });
      message += `<img class="cms-rich-text-img" style="${style}" data-extra='${extraInfo}' title="$[img:${index}]" src="${url}" alt="${url ? '' : '图片丢失啦'}" />`;
    } else if (messageItem.type === 'resource' && messageItem.resName === 'audio') {
      const idStr = messageItem.data;
      const index = parseInt(idStr, 10);
      const audioItem = audios.find(item => item.id === index) || {};
      const { url = '' } = audioItem;
      message += `<audio class="cms-rich-text-audio" title="$[audio:${index}]" src="${url}" controls></audio>`;
    } else if (messageItem.type === 'resource' && messageItem.resName === 'table') {
      const id = Number(messageItem.data);
      // 保证表格前有换行符，修复表格前面的文本内容被吞的问题
      const arr = parseTable(resource.tables, id);
      message += `<br>${getHtmlStrForTable(arr, resource, id)}`;
    } else if (messageItem.type === 'html' && messageItem.tagName === 'U') {
      const openTag = `<u class="cms-rich-text-${messageItem.dataType}" data-type="${messageItem.dataType}">`;
      const closeTag = '</u>';
      const subArr = messageItem.data;
      const str = paserItems2str(subArr, resource);
      message += `${openTag}${str}${closeTag}`;
    } else if (messageItem.type === 'html' && messageItem.tagName === 'B') {
      const openTag = '<b class="cms-rich-text-bold">';
      const closeTag = '</b>';
      const subArr = messageItem.data;
      const str = paserItems2str(subArr, resource);
      message += `${openTag}${str}${closeTag}`;
    } else if (messageItem.type === 'html' && messageItem.tagName === 'I') {
      const openTag = '<i class="cms-rich-text-italic">';
      const closeTag = '</i>';
      const subArr = messageItem.data;
      const str = paserItems2str(subArr, resource);
      message += `${openTag}${str}${closeTag}`;
    } else if (messageItem.type === 'html' && messageItem.tagName === 'P') {
      const openTag = `<p class="ql-align-${messageItem.textAlign}">`;
      const closeTag = '</p>';
      const subArr = messageItem.data;
      const str = paserItems2str(subArr, resource);
      message += `${openTag}${str}${closeTag}`;
    } else if (messageItem.type === 'html') {
      const subArr = messageItem.data;
      const str = paserItems2str(subArr, resource);
      message += str;
    } else {
      const str = messageItem.data;
      message += htmlEscape(str);
    }
  });
  return message;
}

function lexToString(msg, resource) {
  const messageArr = parseData(msg);
  return paserItems2str(messageArr, resource);
}

function getHtmlStrForRowData(str, resource) {
  // 末尾添加换行保证末尾换行能正确展示，输出时再删除添加的，保证数据一致性
  let string = `${str}\r\n`;
  string = lexToString(string, resource);
  return string;
}
export {
  lexToString,
  getHtmlStrForTable,
  getHtmlStrForRowData,
};
