<template>
  <a-modal
    class="table-modal"
    :visible="value"
    title="添加表格"
    :centered="true"
    ok-text="确认"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="() => $emit('input', false)"
  >
    <span class="table-options-item">行数</span>
    <a-input-number class="table-input" v-model="row" :min="1"/>
    <span class="table-options-item">列数</span>
    <a-input-number class="table-input" v-model="col" :min="1"/>
  </a-modal>
</template>

<script>
export default {
  name: 'TableModal',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      row: 3,
      col: 2,
    };
  },
  methods: {
    handleOk() {
      this.$emit('input', false);
      this.$emit('handleOk', { row: this.row, col: this.col });
    },
  },
};
</script>

<style lang="less" scoped>
.table-modal {
  display: flex;

  .table-input {
    margin-right: 15px;
  }

  .table-options-item::after {
    content: ':';
    position: relative;
    top: -.5px;
    margin: 0 8px 0 2px;
  }
}
</style>
