import lexData from './lexData';

const VALID_TAGNAMES = ['p', 'i', 'u', 'b'];
const SUB_VALID_TAGNAMES = ['i', 'u', 'b'];
const VALID_RESNAMES = ['img', 'audio', 'table'];

function getData(arr, subLevel = false) {
  const out = [];
  for (let i = 0; i < arr.length;) {
    let item = { ...arr[i] };

    if (item.type === 'open_tag') {
      const { tagName } = item.options;
      let tagLevel = 0;
      const closeTagIdx = arr.findIndex((tag, idx) => {
        if (idx <= i) return false;
        if (tag.type === 'open_tag' && tag.options.tagName === tagName) {
          tagLevel += 1;
        }

        if (tag.type === 'close_tag' && tag.options.tagName === tagName) {
          if (tagLevel === 0) {
            return true;
          }
          tagLevel -= 1;
        }

        return false;
      });

      if (closeTagIdx === -1) {
        item.type = 'string';
      } else {
        item.type = 'html';
        if (!subLevel) {
          if (VALID_TAGNAMES.includes(tagName)) {
            item.tagName = tagName.toUpperCase();
            item.data = getData(arr.slice(i + 1, closeTagIdx), true);
          } else {
            item.tagName = 'notSupport';
            item.data = getSubString(arr.slice(i, closeTagIdx + 1));
          }
        } else {
          if (SUB_VALID_TAGNAMES.includes(tagName)) {
            item.tagName = tagName.toUpperCase();
            item.data = getData(arr.slice(i + 1, closeTagIdx), true);
          } else {
            [item] = getSubString(arr.slice(i, closeTagIdx + 1));
          }
        }
        if (item.options?.dataType) {
          item.dataType = item.options.dataType;
        }
        if (item.options?.textAlign) {
          item.textAlign = item.options.textAlign;
        }
        i = closeTagIdx;
      }
    } else if (subLevel && item.type !== 'latex') {
      item.type = 'string';
      item.data = item.input;
    } else if (item.type === 'close_tag') {
      item.type = 'string';
    } else if (item.type === 'resource') {
      const { resName } = item.options;
      if (!VALID_RESNAMES.includes(resName)) {
        item.type = 'string';
        item.data = item.input;
      } else {
        item.resName = resName;
      }
    } else if (item.type === 'breakline') {
      item.data = '\n';
    } else if (item.type === 'dollar') {
      item.data = '$';
    }
    if (item.data === undefined) {
      item.data = item.input;
    }
    out.push(item);
    i += 1;
  }
  return out;
}

function getSubString(arr) {
  const data = arr.map(item => item.input).join('');
  return [{ type: 'string', input: data, data }];
}

function parseData(msg) {
  const arr = lexData(msg);
  return getData(arr);
}

export default parseData;
