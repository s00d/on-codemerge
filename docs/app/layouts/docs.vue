<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation');
const route = useRoute();

// 120+ pages: keep every section collapsed except the branch of the current page.
const openActive = (items: ContentNavigationItem[]): ContentNavigationItem[] =>
  items.map((item) => ({
    ...item,
    defaultOpen: route.path.startsWith(item.path),
    children: item.children ? openActive(item.children) : undefined,
  }));
const tree = computed(() => openActive(navigation?.value ?? []));
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UContentNavigation :key="route.path" highlight :navigation="tree" />
        </UPageAside>
      </template>
      <slot />
    </UPage>
  </UContainer>
</template>
