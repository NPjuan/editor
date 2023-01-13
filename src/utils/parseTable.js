function getTableResItem(tables, id) {
  const idStr = String(id);
  const table = tables.find(item => String(item.id) === idStr);
  return table || {
    id: -1,
    data: '',
    json_data: '',
  };
}

function addLostData(arr) {
  const maxCol = arr.reduce((prev, curr) => Math.max(prev, curr.length), 0);
  return arr.map((item) => {
    if (item.length < maxCol) {
      for (let i = 0; i < maxCol - item.length; i++) {
        item.push('');
      }
      return item;
    }

    return item;
  });
}

function addLostJsonData(arr) {
  const maxRow = arr.reduce((prev, curr) => Math.max(prev, curr.row), 0);
  const maxCol = arr.reduce((prev, curr) => Math.max(prev, curr.col), 0);
  for (let i = 1; i <= maxRow; i++) {
    for (let j = 1; j <= maxCol; j++) {
      const row = i;
      const col = j;
      if (!arr.find(item => item.row === row && item.col === col)) {
        arr.push({ row, col, content: '', merge: '' });
      }
    }
  }
  return arr;
}

function sortJsonData(arr) {
  return arr.sort((a, b) => {
    if (a.row > b.row) return 1;

    return a.col - b.col;
  });
}

function getTableByData(str) {
  let arr = [];
  try {
    arr = JSON.parse(str || '[]');
  } catch (error) {
    arr = [];
  }

  if (!Array.isArray(arr)) return [];

  if (!arr.every(item => Array.isArray(item))) return [];

  return addLostData(arr)
    .map(rows => rows.map(col => ({ content: col })));
}


function jsonData2arr(str) {
  let arr = [];
  try {
    arr = JSON.parse(str).table || [];
  } catch (error) {
    console.warn('JSON.parse str failed', str);
    return [];
  }

  if (!Array.isArray(arr)) {
    console.warn('arr is not an array', arr);
    return [];
  }

  if (!arr.every(item => item instanceof Object)) {
    console.warn('arr items are not all object', arr);
    return [];
  }

  arr = arr.map((item) => ({
    row: Number(item.row || 1),
    col: Number(item.col || 1),
    content: String(item.content || ''),
    merge: String(item.merge || ''),
  }));

  arr = addLostJsonData(arr);
  arr = sortJsonData(arr);

  const out = [];
  arr.forEach((item) => {
    const rowIdx = item.row - 1;
    let row = out[rowIdx];
    if (!row) {
      row = [];
      out[rowIdx] = row;
    }
    const colIdx = item.col - 1;
    row[colIdx] = item;
  });
  return out;
}

function calcColspanRowspan(arr) {
  const rowLen = arr.length;
  if (!rowLen) return arr;

  const colLen = arr[0].length;

  for (let rowIdx = 0; rowIdx < rowLen; rowIdx++) {
    for (let colIdx = 0; colIdx < colLen - 1;) {
      const curr = arr[rowIdx][colIdx];
      const next = arr[rowIdx][colIdx + 1];
      if (next.merge === 'row') {
        let nextIdx = colIdx + 1;
        while (nextIdx < colLen - 1 && arr[rowIdx][nextIdx].merge === 'row') {
          nextIdx += 1;
        }
        if (arr[rowIdx][nextIdx].merge !== 'row') {
          nextIdx -= 1;
        }
        const colspan = nextIdx - colIdx + 1;
        curr.colspan = colspan;
        colIdx = nextIdx + 1;
        continue;
      }

      colIdx += 1;
    }
  }

  for (let colIdx = 0; colIdx < colLen; colIdx++) {
    for (let rowIdx = 0; rowIdx < rowLen - 1;) {
      const curr = arr[rowIdx][colIdx];
      const next = arr[rowIdx + 1][colIdx];
      if (next.merge === 'col') {
        let nextIdx = rowIdx + 1;
        while (nextIdx < rowLen - 1 && arr[nextIdx][colIdx].merge === 'col') {
          nextIdx += 1;
        }
        if (arr[nextIdx][colIdx].merge !== 'col') {
          nextIdx -= 1;
        }
        const rowspan = nextIdx - rowIdx + 1;
        curr.rowspan = rowspan;
        rowIdx = nextIdx + 1;
        continue;
      }

      rowIdx += 1;
    }
  }
  return arr;
}

function getTableByJsonData(str) {
  let arr = jsonData2arr(str);
  arr = calcColspanRowspan(arr);
  return arr;
}

function parseTable(tables, id){
  const table = getTableResItem(tables, id);

  const { data, json_data: jsonData } = table;

  if (jsonData?.length) {
    return getTableByJsonData(jsonData);
  }

  return getTableByData(data);
}

export default parseTable;
