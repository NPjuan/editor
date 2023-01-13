import { cloneDeep } from 'lodash';

// stringfy的时候讲空字符串去除，减少冗杂的字段
const tableJsonStringfy = (obj) => {
  const tableReplacer = (key, value) => (value === '' ? undefined : value);
  return JSON.stringify(obj, tableReplacer);
};

// 判断deltaItem是否是纯文本的delta
const isPureTextDelta = (deltaItem) => {
  const { insert = '', attributes } = deltaItem;
  // 无attributes，有内容即为纯文本的delta
  if (insert.length && !attributes) {
    return true;
  }
  // 有attributes，内容不全为换行符即为纯文本的delta
  return Array.from(insert).some(char => char !== '\n');
};
/**
 * 处理特殊字符
 * @description 用\n统一替换\r或\r\n；20空格替换A0空格；清除零宽间隔
 */
const handleSpecialChar = (str) => str
  .replace(/\r\n?/g, '\n')
  .replace(/\u00a0/g, ' ')
  .replace(/\u200b/g, '');

const getStrOrCellInfoFromBlot = (blot) => {
  let str = '';
  let cellInfo = { row: '', cell: '', rowspan: '', colspan: '', content: '' };
  const classList = ['ql-align-left', 'ql-align-center', 'ql-align-right'];
  let openTag = '';
  let closeTag = '';
  if (classList.includes(blot.domNode?.className)) {
    // 居左、居中、居右
    if (blot.domNode.className === 'ql-align-left') {
      openTag = '<p style="text-align: left;">';
    } else if (blot.domNode.className === 'ql-align-center') {
      openTag = '<p style="text-align: center;">';
    } else if (blot.domNode.className === 'ql-align-right') {
      openTag = '<p style="text-align: right;">';
    }
    closeTag = '</p>';
  }
  str += openTag;
  const deltas = blot.delta().ops;
  deltas.forEach((delta) => {
    const { attributes, insert } = delta;
    if (isPureTextDelta(delta)) {
      // 确保单独使用的$符号前面有转义符号
      let newStr = '';
      for (const c of insert) {
        if (c === '$' && !newStr.endsWith('\\')) {
          newStr += '\\$';
        } else {
          newStr += c;
        }
      }
      str = `${str}${newStr}`;
    } else if (insert.image) {
      str = `${str}${insert.image.title}`;
    } else if (insert.audio) {
      str = `${str}${insert.audio.title}`;
    } else if (insert.mathjax) {
      str = `${str}$${insert.mathjax}$`;
    } else if (insert.tts) {
      str = `${str}${insert.tts}`;
    } else if (insert['custom-underline']) {
      str = `${str}<u data-type="underline">${insert['custom-underline']}</u>`;
    } else if (insert['custom-wave']) {
      str = `${str}<u data-type="wave">${insert['custom-wave']}</u>`;
    } else if (insert['custom-emphasis']) {
      str = `${str}<u data-type="emphasis">${insert['custom-emphasis']}</u>`;
    } else if (insert['custom-bold']) {
      str = `${str}<b>${insert['custom-bold']}</b>`;
    } else if (insert['custom-italic']) {
      str = `${str}<i>${insert['custom-italic']}</i>`;
    } else if (attributes?.['table-cell-line']) {
      // eslint-disable-next-line
      cellInfo = {
        ...cellInfo,
        ...delta.attributes['table-cell-line'],
        content: handleSpecialChar(`${str}${insert}`),
      };
    }
  });
  str += closeTag;
  return { str: handleSpecialChar(str), cellInfo };
};

const mergeRepeatedCell = (mergeRepeatedCell) => {
  const newCells = [];
  mergeRepeatedCell.forEach((cellInfo) => {
    const lastOne = newCells.pop();
    if (!lastOne) {
      newCells.push(cellInfo);
    } else {
      const { row, cell, rowspan, colspan, content } = lastOne;
      const { row: row1, cell: cell1, rowspan: rowspan1, colspan: colspan1, content: content1 } = cellInfo;
      if (row === row1 && cell === cell1 && rowspan === rowspan1 && colspan === colspan1) {
        lastOne.content = content + content1;
        newCells.push(lastOne);
      } else {
        newCells.push(lastOne, cellInfo);
      }
    }
  });
  return newCells;
};

const getNewTableJsonData = (tableCellInfos) => {
  let tempCellInfos = cloneDeep(tableCellInfos);
  // 1. 合并重复的单元格：单元格拆分后还有重复的单元格，需要将内容合并起来
  tempCellInfos = mergeRepeatedCell(tempCellInfos);
  // 2. 转换成json_data
  // 获取初始的json_data数组
  // 表格数据的二维数组
  const rowCol2DimenArr = [];
  tempCellInfos.forEach((cellInfo) => {
    const rowNum = parseInt(cellInfo.row, 10);
    if (!rowCol2DimenArr[rowNum - 1]) {
      rowCol2DimenArr[rowNum - 1] = [];
    }
    rowCol2DimenArr[rowNum - 1].push({
      row: cellInfo.row,
      col: cellInfo.cell,
      colspan: cellInfo.colspan,
      rowspan: cellInfo.rowspan,
      content: cellInfo.content,
      merge: '',
      diagonal: '',
    });
  });
  for (let rowIndex = 0; rowIndex < rowCol2DimenArr.length; rowIndex += 1) {
    for (let colIndex = 0; colIndex < rowCol2DimenArr[rowIndex].length; colIndex += 1) {
      const cellTempInfo = rowCol2DimenArr[rowIndex][colIndex];
      const colCount = Number(cellTempInfo.colspan);
      const rowCount = Number(cellTempInfo.rowspan);
      if (colCount > 1) {
        rowCol2DimenArr[rowIndex].splice(colIndex + 1, 0, {
          ...cellTempInfo,
          colspan: `${Number(cellTempInfo.colspan) - 1}`,
          rowspan: '1',
          content: '',
          merge: 'row',
        });
      }
      if (rowCount > 1) {
        if (!rowCol2DimenArr[rowIndex + 1]) {
          rowCol2DimenArr[rowIndex + 1] = [];
        }
        rowCol2DimenArr[rowIndex + 1].splice(colIndex, 0, {
          ...cellTempInfo,
          colspan: cellTempInfo.colspan,
          rowspan: `${Number(cellTempInfo.rowspan) - 1}`,
          content: '',
          merge: 'col',
        });
      }
    }
  }
  const cellStoreInfos = [];
  rowCol2DimenArr.forEach((rowArr, rowNum) => {
    rowArr.forEach((rowItem, colNum) => cellStoreInfos.push({
      row: `${rowNum + 1}`,
      col: `${colNum + 1}`,
      content: rowItem.content,
      merge: rowItem.merge,
      diagonal: rowItem.diagonal,
    }));
  });
  return cellStoreInfos;
};

function getEditorStrAndNewTables(blots, tables, skipTable) {
  const maxTableId = Math.max(...(tables.map((item) => item.id)), -1);
  const tempBlots = cloneDeep(blots);
  let editorStr = '';
  const newTables = cloneDeep(tables);
  tempBlots.forEach((blot, index) => {
    if (blot.constructor.blotName === 'block') {
      editorStr += getStrOrCellInfoFromBlot(blot).str;
    } else if (blot.constructor.blotName === 'table-col') {
      const blotId = blot.domNode.tableId;
      // 新表格到此处时暂未将tableId注入domNode中，所以为undefined即为最新的表格
      const tableId = blotId === undefined ? maxTableId : blotId;
      const leftBlots = tempBlots.slice(index);
      let currentIndex = index;
      const tableCellInfos = [];
      const [rowIdSet, colIdSet] = [new Set(), new Set()];
      let tableContentStart = false;
      leftBlots.some((cellBlot, cellIndex) => {
        const cellBlotName = cellBlot.constructor.blotName;
        if (cellBlotName === 'table-cell-line') {
          tableContentStart = true;
          const { cellInfo } = getStrOrCellInfoFromBlot(cellBlot);
          if (!rowIdSet.has(cellInfo.row)) {
            // 新的一行col id从1开始算起
            colIdSet.clear();
          }
          rowIdSet.add(cellInfo.row);
          colIdSet.add(cellInfo.cell);
          cellInfo.row = `${rowIdSet.size}`;
          cellInfo.cell = `${colIdSet.size}`;
          tableCellInfos.push(cellInfo);
        } else if (tableContentStart === true) {
          // tableContentStart为true说明开始读取表格内容；如果blot不为table-cell-line，说明表格读取结束
          currentIndex += cellIndex;
          return true;
        }
        return false;
      });
      // skipTable为true时，跳过表格的更新，加快编辑器的响应速度
      if (!skipTable) {
        const targetTable = newTables.find(tableItem => tableItem.id === tableId);
        targetTable.json_data = tableJsonStringfy({ table: getNewTableJsonData(tableCellInfos) });
      }
      editorStr += `$[table:${tableId}]`;
      // 跳过已被读取过的表格blot
      tempBlots.splice(index, currentIndex - index - 1);
    }
  });
  // 输入时添加了换行符，保证正确展示换行，这里要删除多余的换行符
  if (editorStr.endsWith('\n')) {
    editorStr = editorStr.substr(0, editorStr.length - 1);
  }
  return { editorStr, newTables };
}

const dividedIntoMultipleDeltas = (delta, regexp) => {
  const targetDeltas = [];
  const { insert = '' } = delta;
  const matchedResult = [...insert.matchAll(regexp)];
  if (matchedResult.length) {
    const illegalData = matchedResult.map(matchedArray => ({
      text: matchedArray[0],
      index: matchedArray.index + matchedArray[0].length,
    }));
    let processingString = insert;
    illegalData.forEach((illegal) => {
      if (processingString) {
        const splitArray = processingString.split(illegal.text);
        if (splitArray[0]) {
          targetDeltas.push({
            insert: splitArray[0],
          });
        }
        targetDeltas.push({
          insert: illegal.text,
          attributes: {
            color: '#ff0000',
          },
        });
        processingString = insert.slice(illegal.index);
      }
    });
    if (processingString) {
      targetDeltas.push({
        insert: processingString,
      });
    }
  } else {
    targetDeltas.push(delta);
  }
  return targetDeltas;
};

function transformContentDataForTextDetection(deltas) {
  const targetDeltas = [];
  const regexp = /([^a-zA-Z\u0021\u0022\u201C\u201D\u0027\u2018\u2019\u002D\u2013\u002C\u002E\u003A\u003B\u0023\u007C\u002F\u003F\s\n])+/g;
  deltas.forEach((delta) => {
    if (isPureTextDelta(delta)) {
      targetDeltas.push(...dividedIntoMultipleDeltas(delta, regexp));
    } else {
      targetDeltas.push(delta);
    }
  });
  return targetDeltas;
}

export { isPureTextDelta, getEditorStrAndNewTables, handleSpecialChar, transformContentDataForTextDetection };
