import { h, mount } from '@on-codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import type { FormConfig, FieldConfig } from '../types';

/** Form preview — ViewSpec + mount (no innerHTML scrape). */
export class FormPreview {
  private readonly container: HTMLElement;
  private readonly editor: EditorAPI;
  private mountHandle: MountHandle | null = null;

  constructor(container: HTMLElement, editor: EditorAPI) {
    this.container = container;
    this.editor = editor;
  }

  createPreview(formConfig: FormConfig): void {
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
    if (!this.container) {
      return;
    }
    this.mountHandle?.destroy();
    this.mountHandle = mount(this.container, this.view(formConfig));
  }

  view(formConfig: FormConfig): ViewSpec {
    return h(
      'form',
      {
        class: `${formConfig.className ?? 'generated-form'} not-prose`,
        attrs: {
          method: formConfig.method,
          action: formConfig.action,
        },
        on: {
          submit: (e) => {
            e.preventDefault();
          },
        },
      },
      ...formConfig.fields.map((f) => this.fieldView(f)).filter(Boolean),
      h(
        'button',
        { class: 'submit-button', attrs: { type: 'submit' } },
        this.editor.t('formBuilder.submit')
      )
    );
  }

  private commonAttrs(
    field: FieldConfig
  ): Record<string, string | number | boolean | null | undefined> {
    const { options, validation } = field;
    return {
      placeholder: options?.placeholder,
      value: options?.value,
      class: options?.className,
      readonly: options?.readonly ? true : undefined,
      disabled: options?.disabled ? true : undefined,
      size: options?.size,
      maxlength: options?.maxlength,
      minlength: options?.minlength,
      min: options?.min,
      max: options?.max,
      step: options?.step,
      autocomplete: options?.autocomplete,
      required: validation?.required ? true : undefined,
      pattern: validation?.pattern,
      'data-validation': validation ? JSON.stringify(validation) : undefined,
    };
  }

  private fieldView(field: FieldConfig): ViewSpec {
    const { id, type, label, options, validation } = field;
    const name = options?.name ?? id;
    const wrapClass = `form-field${validation?.required ? ' required-field' : ''}`;
    const labelNode = label ? h('label', { attrs: { for: id } }, label) : null;

    const simpleInput = (
      inputType: string,
      extra: Record<string, string | number | boolean | null | undefined> = {}
    ) =>
      h('div', { class: wrapClass }, [
        labelNode,
        h('input', {
          attrs: { type: inputType, id, name, ...this.commonAttrs(field), ...extra },
        }),
      ]);

    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'tel':
      case 'url':
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'month':
      case 'week':
      case 'color':
      case 'range': {
        return simpleInput(type);
      }
      case 'textarea': {
        return h('div', { class: wrapClass }, [
          labelNode,
          h('textarea', {
            attrs: {
              id,
              name,
              rows: options?.rows,
              cols: options?.cols,
              ...this.commonAttrs(field),
            },
          }),
        ]);
      }
      case 'select': {
        return h('div', { class: wrapClass }, [
          labelNode,
          h(
            'select',
            {
              attrs: {
                id,
                name,
                multiple: options?.multiple ? true : undefined,
                ...this.commonAttrs(field),
              },
            },
            ...(options?.options ?? []).map((opt) => h('option', { attrs: { value: opt } }, opt))
          ),
        ]);
      }
      case 'checkbox': {
        const text = (options?.value ?? label) || '';
        return h('div', { class: wrapClass }, [
          h('div', { class: 'checkbox-container' }, [
            h('input', {
              attrs: {
                type: 'checkbox',
                id,
                name,
                checked: options?.checked ? true : undefined,
                ...this.commonAttrs(field),
              },
            }),
            text ? h('label', { attrs: { for: id } }, text) : null,
          ]),
        ]);
      }
      case 'radio': {
        return h(
          'div',
          { class: wrapClass },
          ...(options?.options ?? []).flatMap((option, index) => {
            const radioId = `${id}_${index}`;
            return [
              h('input', {
                attrs: {
                  type: 'radio',
                  id: radioId,
                  name,
                  value: option,
                  checked: options?.value === option ? true : undefined,
                  ...this.commonAttrs(field),
                },
              }),
              h('label', { attrs: { for: radioId } }, option),
            ];
          })
        );
      }
      case 'file': {
        return simpleInput('file', {
          accept: options?.accept,
          multiple: options?.multiple ? true : undefined,
        });
      }
      case 'hidden': {
        return h('input', {
          attrs: { type: 'hidden', id, name, ...this.commonAttrs(field) },
        });
      }
      case 'image': {
        return h('input', {
          attrs: {
            type: 'image',
            id,
            name,
            src: options?.src,
            alt: options?.alt,
            ...this.commonAttrs(field),
          },
        });
      }
      case 'button':
      case 'submit':
      case 'reset': {
        return h(
          'button',
          { attrs: { type, id, name, ...this.commonAttrs(field) } },
          label || type
        );
      }
      default: {
        return simpleInput('text');
      }
    }
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
  }
}
