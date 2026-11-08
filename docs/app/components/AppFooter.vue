<script setup lang="ts">
const { github, npm } = useAppConfig();
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-sm text-muted">MIT licensed · © on-codemerge contributors</p>
    </template>
    <template #right>
      <UButton
        icon="i-simple-icons-npm"
        color="neutral"
        variant="ghost"
        :to="npm"
        target="_blank"
        aria-label="npm"
      />
      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        :to="github"
        target="_blank"
        aria-label="GitHub"
      />
    </template>
  </UFooter>
</template>
