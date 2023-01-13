class ImageForUpload {
  oldUrl;
  id;
  acceptType;
  newUrl = '';
  then;

  constructor(image, acceptType) {
    this.oldUrl = image.url;
    this.id = image.id;
    this.acceptType = acceptType;

    const init = (async () => {
      this.newUrl = await this.url2Base64();
      delete this.then;
      return this;
    })();

    this.then = init.then.bind(init);
  }

  get isBase64Url() {
    return this.base64UrlCheck(this.newUrl);
  }

  get type() {
    const matched = this.newUrl.match(/^data:(image\/.*);base64/);
    return matched?.[1] || '';
  }

  get isValidType() {
    return this.acceptType.includes(this.type);
  }

  base64UrlCheck(url) {
    return !!url.match(/^data:image\/.*;base64/);
  }

  isOldImg(oldImgsId) {
    return oldImgsId.includes(this.id);
  }

  url2Base64() {
    if (this.base64UrlCheck(this.oldUrl)) {
      return Promise.resolve(this.oldUrl);
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const img = new Image;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context?.drawImage(img, 0, 0);
        // 匹配url后缀作为原始类型
        const originalType = this.oldUrl.match(/\.([a-z]+)(\?|#.*)?$/)?.[1] || '';
        const typeIsValid = this.acceptType.includes(`image/${originalType}`);
        const type = typeIsValid ? originalType : 'image/png';
        const urlData = canvas.toDataURL(type);
        resolve(urlData);
      };
      img.onerror = () => resolve('');
      img.src = this.oldUrl;
    });
  }
}

export default ImageForUpload;
