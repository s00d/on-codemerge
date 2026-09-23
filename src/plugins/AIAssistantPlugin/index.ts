import './style.scss';
import { asAttr } from '../../utils/asAttr';

import { definePlugin } from '@on-codemerge/sdk';
import type { EditorAPI, PopupItem, PopupOptions } from '@on-codemerge/sdk';
import { aiAssistantIcon } from '../../icons';
import {
  OpenAIDriver,
  DeepSeekDriver,
  HuggingFaceDriver,
  GitHubAzureDriver,
  LlamaDriver,
  MistralDriver,
  OllamaDriver,
} from './drivers';
import type { AIDriver } from './drivers';
import type { DriverOptions, OptionDescription, OptionsDescription } from './drivers/AIDriver';

const LOCAL_STORAGE_KEY = 'aiAssistantSettings';

const defaultPrompt =
  'Write an article about the benefits of using artificial intelligence in web development.';
const defaultStructurePrompt = `The response should be formatted as HTML. Use h1-h3, p, ul/ol/li, pre/code, strong/em, a, table. Do not include html/head/body.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function optionFieldValue(
  merged: Record<string, unknown>,
  key: string,
  field: OptionDescription
): string | number | boolean | undefined {
  const raw = merged[key];
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    return raw;
  }
  return field.default;
}

function defaultsFromDesc(desc: OptionsDescription): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(desc)) {
    if (field.default !== undefined) {
      out[key] = field.default;
    }
  }
  return out;
}

function toDriverOptions(merged: Record<string, unknown>): DriverOptions {
  const model = typeof merged.model === 'string' ? merged.model : '';
  const options: DriverOptions = { model };
  if (typeof merged.temperature === 'number') {
    options.temperature = merged.temperature;
  }
  if (typeof merged.maxTokens === 'number') {
    options.maxTokens = merged.maxTokens;
  }
  if (typeof merged.topP === 'number') {
    options.topP = merged.topP;
  }
  return options;
}

export function AIAssistantPlugin() {
  let openAI: (() => void) | null = null;

  return definePlugin({
    name: 'ai-assistant',
    hotkeys: [{ keys: 'Mod-Shift-a', command: 'openAI', description: 'AI Assistant' }],
    commands: {
      openAI: () => {
        openAI?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      let apiKey = '';
      let driverName = 'openai';
      let prompt = defaultPrompt;
      let structurePrompt = defaultStructurePrompt;
      let driverOptions: Record<string, unknown> = {};

      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isRecord(parsed)) {
            const s = parsed;
            // Never restore secrets from localStorage (purge legacy blobs).
            driverName = asAttr(s.driverName, 'openai');
            prompt = asAttr(s.prompt, defaultPrompt);
            structurePrompt = asAttr(s.structurePrompt, defaultStructurePrompt);
            driverOptions = isRecord(s.driverOptions) ? { ...s.driverOptions } : {};
            if ('apiKey' in s) {
              localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify({ driverName, prompt, structurePrompt, driverOptions })
              );
            }
          }
        }
      } catch {
        /* ignore */
      }

      const drivers: Record<string, AIDriver<DriverOptions>> = {
        openai: new OpenAIDriver(apiKey),
        deepseek: new DeepSeekDriver(apiKey),
        huggingface: new HuggingFaceDriver(apiKey),
        github: new GitHubAzureDriver(apiKey),
        llama: new LlamaDriver(apiKey),
        mistral: new MistralDriver(apiKey),
        ollama: new OllamaDriver(),
      };

      const saveSettings = () => {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({ driverName, prompt, structurePrompt, driverOptions })
        );
      };

      const popups = ctx.popup.session();

      const popupChrome = (): Pick<
        PopupOptions,
        'title' | 'className' | 'closeOnClickOutside'
      > => ({
        title: editor.t('common.aiAssistant'),
        className: 'ai-assistant',
        closeOnClickOutside: true,
      });

      const popupButtons = (): PopupOptions['buttons'] => [
        {
          label: editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: editor.t('common.generate'),
          variant: 'primary',
          onClick: () => {
            ctx.defer(() => handleGenerate(editor));
            return true;
          },
        },
      ];

      const resolveDriverOptions = (): Record<string, unknown> => {
        const driver = drivers[driverName];
        const desc = driver?.getOptionsDescription() ?? {};
        return { ...defaultsFromDesc(desc), ...driverOptions };
      };

      const buildItems = (): PopupItem[] => {
        const items: PopupItem[] = [
          {
            type: 'list',
            id: 'driver',
            label: editor.t('common.provider'),
            options: Object.keys(drivers),
            value: driverName,
            onChange: (v) => {
              driverName = String(v);
              const next = drivers[driverName];
              driverOptions = defaultsFromDesc(next?.getOptionsDescription() ?? {});
              popups.update({
                ...popupChrome(),
                items: buildItems(),
                buttons: popupButtons(),
              });
            },
          },
          {
            type: 'input',
            id: 'api-key',
            label: editor.t('common.apiKey'),
            value: apiKey,
            onChange: (v) => {
              apiKey = String(v);
            },
          },
          {
            type: 'textarea',
            id: 'prompt',
            label: editor.t('common.prompt'),
            value: prompt,
            onChange: (v) => {
              prompt = String(v);
            },
          },
          {
            type: 'textarea',
            id: 'structure',
            label: editor.t('common.structure'),
            value: structurePrompt,
            onChange: (v) => {
              structurePrompt = String(v);
            },
          },
        ];

        const driver = drivers[driverName];
        const desc = driver?.getOptionsDescription() ?? {};
        const merged = resolveDriverOptions();
        items.push(
          ...Object.entries(desc).map(([optionKey, fieldDef]) => ({
            type: fieldDef.type,
            id: `driver-option-${optionKey}`,
            label: fieldDef.label,
            options: fieldDef.type === 'list' ? fieldDef.options : undefined,
            value: optionFieldValue(merged, optionKey, fieldDef),
            onChange: (value: unknown) => {
              driverOptions[optionKey] = value;
              saveSettings();
            },
          }))
        );

        return items;
      };

      const handleGenerate = async (api: EditorAPI) => {
        saveSettings();
        const driver = drivers[driverName];
        // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
        if (!driver) {
          api.notify(api.t('common.unsupportedDriver'));
          return;
        }
        try {
          if ('apiKey' in driver) {
            Reflect.set(driver, 'apiKey', apiKey);
          }
          const fullPrompt = `${structurePrompt}\n\n${prompt}`;
          const generatedText = await driver.generateText(
            fullPrompt,
            toDriverOptions(resolveDriverOptions())
          );
          const current = api.getHTML();
          api.setHTML(`${current}${generatedText}`);
          popups.close();
        } catch (error) {
          console.error('Error generating text:', error);
          api.notify(api.t('common.failedToGenerateText'));
        }
      };

      openAI = () => {
        popups.open({
          ...popupChrome(),
          items: buildItems(),
          buttons: popupButtons(),
        });
      };

      ctx.toolbar.add({
        id: 'ai-assistant',
        icon: aiAssistantIcon,
        title: editor.t('common.aiAssistant'),
        menu: 'tools',
        order: 90,
        onClick: () => {
          openAI?.();
        },
      });
    },
  });
}
