import Vue from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import RichTextEditor from '@/components/richTextEditor/index';

Vue.config.productionTip = false
// 可使用局部引入
Vue.use(Antd);
Vue.component('rich-text-editor', RichTextEditor);

new Vue({
  render: h => h(App),
}).$mount('#app')
