function getImgStyle(imgItem) {
  const { width, height, position } = imgItem;
  let style = (width > 0 && height > 0) ? `width:${width}px;height:${height}px;` : '';
  const positionStyle = [
    'float: left;',
    'float: right;',
    'display: block;',
    'display: block; margin: auto;',
    'display: block; margin: 0 0 0 auto;',
  ];
  style += positionStyle[position - 1] || '';
  return style;
}

function getImgInsertSource(image) {
  const { id, url } = image;

  return {
    id,
    url,
    title: `$[img:${id}]`,
    style: getImgStyle(image),
  };
}

export {
  getImgStyle,
  getImgInsertSource,
};
