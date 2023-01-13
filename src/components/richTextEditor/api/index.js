import Vue from 'vue';

import { uploadFileByCos } from '../utils/cosUploader';

const TVSBody = {
  header: {},
  payload: {},
};

// 获取图片的latex内容
export function getImageLatex(resUrl) {
  return Vue.$CMSAxios.post('/edu/openapi/v1/question/image_to_latex', {
    ...TVSBody,
    payload: {
      res_url: resUrl,
    },
  });
}

// 上传文件
export function uploadFile(file, name) {
  return uploadFileByCos(file, name);
}
