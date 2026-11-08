<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';
import { findPageHeadline } from '@nuxt/content/utils';
import { withoutTrailingSlash } from 'ufo';

definePageMeta({ layout: 'docs' });

const route = useRoute();
const { edit, github, npm } = useAppConfig();
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation');
const path = computed(() => withoutTrailingSlash(route.path));

const { data: page } = await useAsyncData(path.value, () =>
  queryCollection('docs').path(path.value).first()
);
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const { data: surround } = await useAsyncData(`${path.value}-surround`, () =>
  queryCollectionItemSurroundings('docs', path.value, { fields: ['description'] })
);

useSeoMeta({
  title: page.value.title,
  description: page.value.description,
  ogTitle: page.value.title,
  ogDescription: page.value.description,
});

const headline = computed(() => findPageHeadline(navigation?.value, page.value?.path));
const editUrl = computed(() =>
  page.value?.stem.endsWith('changelog')
    ? undefined
    : `${edit}/${page.value?.stem}.${page.value?.extension}`
);
const tocLinks = computed(() => page.value?.body?.toc?.links ?? []);
const communityLinks = [
  { icon: 'i-simple-icons-github', label: 'GitHub', to: github, target: '_blank' },
  { icon: 'i-simple-icons-npm', label: 'npm', to: npm, target: '_blank' },
  { icon: 'i-lucide-history', label: 'Changelog', to: '/changelog' },
];
</script>

<template>
  <UPage v-if="page">
    <UPageHeader :title="page.title" :description="page.description" :headline="headline">
      <template v-if="page.links?.length" #links>
        <UButton
          v-for="(link, index) in page.links"
          :key="index"
          color="neutral"
          variant="outline"
          v-bind="link"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <ContentRenderer :value="page" />

      <div v-if="editUrl" class="border-t border-default pt-6 text-sm text-muted">
        <ULink
          :to="editUrl"
          target="_blank"
          class="inline-flex items-center gap-1.5 hover:text-highlighted"
        >
          <UIcon name="i-lucide-square-pen" aria-hidden="true" />
          Edit this page on GitHub
        </ULink>
      </div>

      <UContentSurround :surround="surround" />
    </UPageBody>

    <template v-if="tocLinks.length" #right>
      <UContentToc title="On this page" :links="tocLinks" highlight>
        <template #bottom>
          <div class="hidden lg:block space-y-6">
            <USeparator type="dashed" />
            <UPageLinks title="Links" :links="communityLinks" />
          </div>
        </template>
      </UContentToc>
    </template>
  </UPage>
</template>
