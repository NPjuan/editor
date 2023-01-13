import {
  uploadFileFail, uploadFileSuccess,
  getImageLatexFail, getImageLatexSuccess,
} from './mockData';

// 更新题目信息
export function uploadFile(file) {
  return new Promise((resolve, reject) => {
    if (file.name.includes('testFail')) {
      reject(uploadFileFail);
    } else {
      resolve(uploadFileSuccess);
    }
  });
}

// 获取图片的latex内容
export function getImageLatex(resUrl) {
  return new Promise((resolve, reject) => {
    if (resUrl.includes('testFail')) {
      reject(getImageLatexFail);
    } else {
      resolve(getImageLatexSuccess);
    }
  });
}
