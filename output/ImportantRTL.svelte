<script lang="ts">
  let showMobileFilters = false;
</script>

<section
  class:translate-x-0={showMobileFilters}
  class="ltr_!translate-x-full rtl_-translate-x-full menu ltr_right-0 rtl_left-0 overflow-y-auto w-64 md:w-52 inset-y-0 flex z-50 md:z-auto fixed md:sticky md:top-24 self-start flex-shrink-0 flex-col p-4 md:p-0 bg-white shadow-lg md:shadow-none transform transition-transform ease-in-out duration-300 md:max-h-[calc(100vh-107px)]"
/>

<style> :global([dir=rtl] .rtl_-translate-x-full) { @apply -translate-x-full; } :global([dir=rtl] .rtl_left-0) { @apply left-0; } :global([dir=ltr] .ltr_\!translate-x-full) { @apply !translate-x-full; } :global([dir=ltr] .ltr_right-0) { @apply right-0; }
  .menu {
    color: red;
  }
</style>
