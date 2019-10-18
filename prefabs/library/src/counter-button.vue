<template>
	<button @click="count++" v-x="[0, {count}]">
		Click me: {count}
	</button>
</template>

<script lang="ts">
	import Vue from "vue";

	export default Vue.extend({
		data() {
			return {
				count: 0
			};
		}
	});
</script>
