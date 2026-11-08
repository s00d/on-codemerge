<script setup lang="ts">
import type { ButtonProps, PageFeatureProps } from '@nuxt/ui';

const { github } = useAppConfig();
const { data: page } = await useAsyncData('landing', () =>
  queryCollection('landing').path('/').first()
);

useSeoMeta({
  title: 'on-codemerge',
  description: page.value?.description,
  ogTitle: 'on-codemerge',
  ogDescription: page.value?.description,
});

const heroLinks: ButtonProps[] = [
  {
    label: 'Get started',
    to: '/getting-started/introduction',
    size: 'lg',
    trailingIcon: 'i-lucide-arrow-right',
  },
  {
    label: 'GitHub',
    to: github,
    target: '_blank',
    size: 'lg',
    color: 'neutral',
    variant: 'outline',
    icon: 'i-simple-icons-github',
  },
];

const features: PageFeatureProps[] = [
  {
    title: 'Eight editors, one kernel',
    description:
      'WYSIWYG, JSON, Markdown, Code, Forms, Charts, Calendar and Tables share one JSON document model, ops and undo.',
    icon: 'i-lucide-layout-panel-left',
    to: '/getting-started/editors',
  },
  {
    title: '40 plugins',
    description:
      'Tables, media, math, footnotes, comments, track changes, spell check, AI assistant — each a factory you opt into.',
    icon: 'i-lucide-puzzle',
    to: '/plugins/overview',
  },
  {
    title: 'Real-time collaboration',
    description:
      'Authoritative WebSocket server with server-side rebase, roles, comments and offline edits replayed on reconnect.',
    icon: 'i-lucide-users',
    to: '/plugins/collaboration/collaboration',
  },
  {
    title: 'Any host',
    description:
      'React, Vue, Svelte, Angular, <ocm-editor> web component, plus server recipes from Laravel to Axum and native shells.',
    icon: 'i-lucide-plug',
    to: '/integrate/overview',
  },
  {
    title: 'Clean output',
    description:
      'HTML, Markdown and JSON in and out, sanitized; published pages hydrate with a tiny public runtime.',
    icon: 'i-lucide-file-code',
    to: '/getting-started/editor-api',
  },
  {
    title: 'Plugin SDK',
    description:
      'definePlugin, a zero-dependency ViewSpec DOM runtime and core-owned toolbar, menus and popups.',
    icon: 'i-lucide-cpu',
    to: '/architecture/authoring-plugins',
  },
];

const quickLinks: ButtonProps[] = [
  { label: 'Editor API', to: '/getting-started/editor-api', trailingIcon: 'i-lucide-arrow-right' },
  {
    label: 'Migrate from v1',
    to: '/getting-started/migration-v1-to-v2',
    color: 'neutral',
    variant: 'outline',
  },
];
</script>

<template>
  <div>
    <UPageHero
      title="Plugin-oriented document editors"
      description="on-codemerge is a family of editors on one JSON document kernel. Toolbar, menus and popups live in the core; features come as plugins. Mount it in any framework or plain HTML."
      :links="heroLinks"
    >
      <template #headline>
        <UButton
          to="/changelog"
          label="What's new in 2.9"
          trailing-icon="i-lucide-arrow-right"
          color="neutral"
          variant="subtle"
          size="sm"
        />
      </template>
    </UPageHero>

    <UPageSection
      title="Try it"
      description="Every product below is the real editor from this repository. Only the active one is mounted."
    >
      <ClientOnly>
        <HomeEditorsDemo />
        <template #fallback>
          <div class="ocm-demo h-96 animate-pulse bg-elevated" />
        </template>
      </ClientOnly>
    </UPageSection>

    <UPageSection title="What you get" :features="features" />

    <UPageSection
      title="Two minutes to the first editor"
      description="Install the package, import the CSS and mount an Editor with the default plugin set."
      orientation="horizontal"
      :links="quickLinks"
    >
      <div class="min-w-0">
        <ContentRenderer v-if="page" :value="page" />
      </div>
    </UPageSection>
  </div>
</template>
