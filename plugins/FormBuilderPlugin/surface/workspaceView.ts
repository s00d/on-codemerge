import { foreign, h, mount, studioPaneTabs, syncStudioPanel } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle, ViewSpec } from '@codemerge/sdk';

import type { DocNode, EditorState } from '@codemerge/kernel';
import type { FieldType, FormConfig } from '../types';
import { parseFormHttpMethod } from '../types';
import { FormStore } from '../services/FormStore';
import { FieldInspector } from '../components/FieldInspector';
import { TemplatesModal } from '../components/TemplatesModal';
import { paletteFieldTypes, getDriver } from '../drivers/registry';
import { formView } from '../render/formView';
import { configFromDoc, emptyFormConfig } from '../io/adapters';

export type FormWorkspaceHandle = {
  destroy: () => void;
  update: (state: EditorState) => void;
  getConfig: () => FormConfig;
  setConfig: (config: FormConfig) => void;
  addField: (type?: FieldType) => void;
  clearFields: () => void;
  openTemplates: () => void;
  getMethod: () => FormConfig['method'];
  setNarrowPreview: (narrow: boolean) => void;
};

export type MountFormWorkspaceOptions = {
  mode: 'workspace' | 'atom';
  initial?: FormConfig;
  scope: DisposableScope;
  onChange?: (config: FormConfig) => void;
  onSave?: (config: FormConfig) => void;
  onCancel?: () => void;
};

/**
 * Three-column form studio: Palette | Canvas (chips + preview) | Inspector.
 */
export function mountFormWorkspace(
  editor: EditorAPI,
  host: HTMLElement,
  opts: MountFormWorkspaceOptions
): FormWorkspaceHandle {
  const store = new FormStore(editor);
  let lastSyncedDoc: DocNode | null = null;
  const templatesModal = new TemplatesModal(editor, opts.scope);
  let selectedFieldId: string | null = null;
  let suppressDocSync = false;
  let dragFrom: number | null = null;
  let chipMount: MountHandle | null = null;
  let previewMount: MountHandle | null = null;
  let fieldInspector: FieldInspector | null = null;
  let chipHost: HTMLElement | null = null;
  let previewHost: HTMLElement | null = null;
  let inspectorHost: HTMLElement | null = null;
  let rootMount: MountHandle | null = null;
  let tabsMount: MountHandle | null = null;
  let bodyEl: HTMLElement | null = null;
  let tabsHost: HTMLElement | null = null;
  let narrowPreview = false;
  let mobilePanel: 'palette' | 'canvas' | 'inspector' = 'canvas';

  const t = (k: string) => editor.t(k) || k;

  const refreshTabs = (): void => {
    if (!tabsHost) {
      return;
    }
    tabsMount?.destroy();
    tabsMount = mount(
      tabsHost,
      studioPaneTabs(
        [
          { id: 'canvas', label: 'Preview' },
          { id: 'palette', label: t('formBuilder.formFields') || 'Fields' },
          { id: 'inspector', label: t('formBuilder.fieldEditor') || 'Edit' },
        ],
        mobilePanel,
        (id) => {
          if (id === 'canvas' || id === 'palette' || id === 'inspector') {
            setMobilePanel(id);
          }
        }
      )
    );
  };

  const setMobilePanel = (panel: 'palette' | 'canvas' | 'inspector'): void => {
    mobilePanel = panel;
    if (bodyEl) {
      syncStudioPanel(bodyEl, mobilePanel);
    }
    refreshTabs();
  };

  const emitChange = (): void => {
    opts.onChange?.(store.getConfig());
  };

  const renderChips = (): void => {
    if (!chipHost) {
      return;
    }
    chipMount?.destroy();
    const fields = store.getFields();
    chipMount = mount(
      chipHost,
      fields.length === 0
        ? h('p', { class: 'form-ws-empty' }, t('formBuilder.noFieldsAddedYet'))
        : h(
            'div',
            { class: 'form-ws-chips' },
            ...fields.map((field, index) =>
              h(
                'button',
                {
                  class: `form-ws-chip${selectedFieldId === field.id ? ' is-selected' : ''}`,
                  attrs: { type: 'button', draggable: true },
                  on: {
                    dragstart: (e) => {
                      dragFrom = index;
                      e.dataTransfer?.setData('text/plain', String(index));
                    },
                    dragover: (e) => {
                      e.preventDefault();
                    },
                    drop: (e) => {
                      e.preventDefault();
                      if (dragFrom !== null && dragFrom !== index) {
                        const src = store.getFields()[dragFrom];
                        if (src !== undefined) {
                          store.moveField(src.id, index);
                          emitChange();
                        }
                      }
                      dragFrom = null;
                    },
                    click: () => {
                      selectedFieldId = field.id;
                      setMobilePanel('inspector');
                      refreshAll();
                    },
                  },
                },
                [
                  h(
                    'span',
                    { class: 'form-ws-chip__label' },
                    field.label || t('formBuilder.untitledField')
                  ),
                  h('span', { class: 'form-ws-chip__type' }, field.type),
                ]
              )
            )
          )
    );
  };

  const renderPreview = (): void => {
    if (!previewHost) {
      return;
    }
    previewMount?.destroy();
    const config = store.getConfig();
    if (config.fields.length > 0) {
      previewMount = mount(
        previewHost,
        formView(config, {
          preventSubmit: true,
          i18n: editor,
          studioAnchors: true,
          highlightFieldId: selectedFieldId,
        })
      );
      const highlightId = selectedFieldId;
      if (highlightId) {
        requestAnimationFrame(() => {
          const preview = previewHost;
          if (!preview) {
            return;
          }
          const target = preview.querySelector(`[data-ocm-field-id="${CSS.escape(highlightId)}"]`);
          if (target instanceof HTMLElement) {
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        });
      }
    } else {
      previewMount = mount(
        previewHost,
        h('p', { class: 'form-ws-empty' }, t('formBuilder.noFieldsAddedYet'))
      );
    }
  };

  const ensureInspector = (): FieldInspector => {
    fieldInspector ??= new FieldInspector(editor, store, {
      onChange: () => {
        emitChange();
      },
      onRemove: (fieldId) => {
        store.removeField(fieldId);
        if (selectedFieldId === fieldId) {
          selectedFieldId = null;
        }
        refreshAll();
        emitChange();
      },
      onClone: (fieldId) => {
        const field = store.getField(fieldId);
        if (!field) {
          return;
        }
        const cloned = structuredClone(field);
        cloned.id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        cloned.label = `${field.label} (Copy)`;
        store.addField(field.type, cloned);
        selectedFieldId = cloned.id;
        refreshAll();
        emitChange();
      },
    });
    return fieldInspector;
  };

  const renderInspector = (): void => {
    if (!inspectorHost) {
      return;
    }
    const field = selectedFieldId ? store.getField(selectedFieldId) : undefined;
    if (field) {
      ensureInspector().mountInto(inspectorHost, field);
    } else {
      fieldInspector?.destroy();
      mount(inspectorHost, h('p', { class: 'form-ws-empty' }, t('formBuilder.selectAFieldToEdit')));
    }
  };

  const refreshAll = (): void => {
    renderChips();
    renderPreview();
    renderInspector();
  };

  const addField = (type: FieldType = 'text'): void => {
    const field = store.addField(type);
    selectedFieldId = field.id;
    setMobilePanel('inspector');
    refreshAll();
    emitChange();
  };

  const openTemplates = (): void => {
    templatesModal.show((template) => {
      store.setConfig(template.config);
      selectedFieldId = null;
      refreshAll();
      emitChange();
    });
  };

  const setConfig = (config: FormConfig): void => {
    suppressDocSync = true;
    store.setConfig(config);
    selectedFieldId = null;
    refreshAll();
    suppressDocSync = false;
  };

  const initial =
    opts.initial ??
    (opts.mode === 'workspace' ? configFromDoc(editor.getState().doc) : emptyFormConfig());
  store.setConfig(initial);

  const headerView = (): ViewSpec =>
    h('div', { class: 'form-ws-header' }, [
      h('div', { class: 'form-ws-header__settings' }, [
        h('label', { class: 'form-ws-label' }, [
          t('formBuilder.method'),
          h(
            'select',
            {
              class: 'form-ws-control',
              props: { value: store.getMethod() },
              on: {
                change: (e) => {
                  const el = e.target;
                  if (el instanceof HTMLSelectElement) {
                    store.setMethod(parseFormHttpMethod(el.value));
                    emitChange();
                  }
                },
              },
            },
            ...(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const).map((m) =>
              h(
                'option',
                {
                  attrs: { value: m },
                  props: { selected: store.getMethod() === m },
                },
                m
              )
            )
          ),
        ]),
        h('label', { class: 'form-ws-label form-ws-label--grow' }, [
          t('formBuilder.actionUrl'),
          h('input', {
            class: 'form-ws-control',
            attrs: {
              type: 'text',
              placeholder: t('formBuilder.enterFormActionUrl'),
            },
            props: { value: store.getAction() },
            on: {
              input: (e) => {
                const el = e.target;
                if (el instanceof HTMLInputElement) {
                  store.setAction(el.value);
                  emitChange();
                }
              },
            },
          }),
        ]),
      ]),
      h('div', { class: 'form-ws-header__actions' }, [
        h(
          'button',
          {
            class: 'ocm-popup__btn',
            attrs: { type: 'button' },
            on: {
              click: () => {
                openTemplates();
              },
            },
          },
          t('common.templates')
        ),
        ...(opts.mode === 'atom'
          ? [
              h(
                'button',
                {
                  class: 'ocm-popup__btn',
                  attrs: { type: 'button' },
                  on: {
                    click: () => {
                      opts.onCancel?.();
                    },
                  },
                },
                t('common.cancel')
              ),
              h(
                'button',
                {
                  class: 'ocm-popup__btn ocm-popup__btn--primary',
                  attrs: { type: 'button' },
                  on: {
                    click: () => {
                      opts.onSave?.(store.getConfig());
                    },
                  },
                },
                t('formBuilder.saveForm')
              ),
            ]
          : []),
      ]),
    ]);

  const paletteView = (): ViewSpec =>
    h(
      'div',
      {
        class: 'form-ws-palette',
        attrs: { 'data-ocm-studio-pane': 'palette' },
      },
      [
        h('div', { class: 'form-ws-panel__title' }, t('formBuilder.formFields')),
        h(
          'div',
          { class: 'form-ws-palette__list' },
          ...paletteFieldTypes().map((type) => {
            const d = getDriver(type);
            const label = t(d.nameKey);
            return h(
              'button',
              {
                class: 'form-ws-palette__item',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    addField(type);
                  },
                },
              },
              [
                h('span', { class: 'form-ws-palette__type' }, type),
                h('span', null, label === d.nameKey ? type : label),
              ]
            );
          })
        ),
      ]
    );

  const layout = (): ViewSpec =>
    h('div', { class: `ocm-studio form-ws${narrowPreview ? ' form-ws--narrow' : ''}` }, [
      headerView(),
      h('div', { class: 'ocm-studio__tabs-host' }),
      h(
        'div',
        {
          class: 'ocm-studio__body form-ws-body',
          style: {
            '--ocm-studio-cols': narrowPreview
              ? '12rem minmax(0,1fr) 16rem'
              : '14rem minmax(0,1fr) 18rem',
          },
          attrs: { 'data-panel': mobilePanel },
        },
        [
          paletteView(),
          h(
            'div',
            {
              class: 'form-ws-canvas',
              attrs: { 'data-ocm-studio-pane': 'canvas' },
            },
            [
              foreign((el, scope) => {
                el.className = 'form-ws-chip-host';
                chipHost = el;
                renderChips();
                scope.disposable(() => {
                  chipMount?.destroy();
                  chipMount = null;
                  if (chipHost === el) {
                    chipHost = null;
                  }
                });
              }),
              foreign((el, scope) => {
                el.className = 'form-ws-preview-host';
                previewHost = el;
                renderPreview();
                scope.disposable(() => {
                  previewMount?.destroy();
                  previewMount = null;
                  if (previewHost === el) {
                    previewHost = null;
                  }
                });
              }),
            ]
          ),
          h(
            'div',
            {
              class: 'form-ws-inspector',
              attrs: { 'data-ocm-studio-pane': 'inspector' },
            },
            [
              h('div', { class: 'form-ws-panel__title' }, t('formBuilder.fieldEditor')),
              foreign((el, scope) => {
                el.className = 'form-ws-inspector-host';
                inspectorHost = el;
                renderInspector();
                scope.disposable(() => {
                  fieldInspector?.destroy();
                  fieldInspector = null;
                  if (inspectorHost === el) {
                    inspectorHost = null;
                  }
                });
              }),
            ]
          ),
        ]
      ),
    ]);

  const remount = (): void => {
    tabsMount?.destroy();
    tabsMount = null;
    rootMount?.destroy();
    host.classList.add('form-ws-root');
    rootMount = mount(host, layout());
    bodyEl = host.querySelector('.ocm-studio__body');
    tabsHost = host.querySelector('.ocm-studio__tabs-host');
    if (bodyEl) {
      syncStudioPanel(bodyEl, mobilePanel);
    }
    refreshTabs();
  };

  remount();
  opts.scope.disposable(
    store.subscribe(() => {
      refreshAll();
    })
  );

  return {
    destroy: () => {
      tabsMount?.destroy();
      tabsMount = null;
      rootMount?.destroy();
      rootMount = null;
      chipMount?.destroy();
      previewMount?.destroy();
      fieldInspector?.destroy();
      host.classList.remove('form-ws-root');
      host.replaceChildren();
    },
    update: (state) => {
      if (suppressDocSync || opts.mode !== 'workspace') {
        return;
      }
      if (state.doc === lastSyncedDoc) {
        return;
      }
      lastSyncedDoc = state.doc;
      setConfig(configFromDoc(state.doc));
    },
    getConfig: () => store.getConfig(),
    setConfig,
    addField,
    clearFields: () => {
      const method = store.getMethod();
      const action = store.getAction();
      const id = store.getConfig().id;
      store.setConfig({
        id,
        method,
        action,
        className: 'generated-form',
        fields: [],
      });
      selectedFieldId = null;
      refreshAll();
      emitChange();
    },
    openTemplates,
    getMethod: () => store.getMethod(),
    setNarrowPreview: (narrow: boolean) => {
      if (narrowPreview === narrow) {
        return;
      }
      narrowPreview = narrow;
      remount();
    },
  };
}
