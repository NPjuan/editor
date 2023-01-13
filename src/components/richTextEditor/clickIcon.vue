<template>
  <div class="cms-rich-text-toolbar-icon">
    <a-tooltip :placement="placement">
      <template slot="title">{{ title }}</template>
      <img
        :src="src"
        @click="(e) => $emit('click', e)"
        @mouseenter="(e) => $emit('mouseenter', e)"
        @mouseleave="(e) => $emit('mouseleave', e)"
      />
    </a-tooltip>
  </div>
</template>

<script>
export default {
  name: 'ClickIcon',
  props: {
    src: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    placement: {
      type: String,
      default: 'top',
    },
  },
};
</script>
