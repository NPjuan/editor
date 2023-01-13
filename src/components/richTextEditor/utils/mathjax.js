const createLatexRender = () => {
  let retryTimes = 4;
  const retry = () => {
    if (window?.MathJax?.typeset) {
      window?.MathJax?.typeset();
      retryTimes = 4;
    } else if (retryTimes <= 0) {
      console.error('mathjax资源未加载，重试超过最大次数');
    } else {
      retryTimes -= 1;
      setTimeout(retry, 500);
    }
  };
  return retry;
};

export default createLatexRender;
