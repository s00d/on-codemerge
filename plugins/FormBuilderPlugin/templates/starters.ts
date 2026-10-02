import type { FieldConfig, FormTemplate } from '../types';

function field(
  type: FieldConfig['type'],
  label: string,
  opts: Partial<FieldConfig> = {}
): FieldConfig {
  const id = `tpl_${type}_${label.toLowerCase().replace(/\W+/g, '_')}`;
  return {
    id,
    type,
    label,
    options: { name: id, ...opts.options },
    validation: opts.validation ?? { required: false },
  };
}

/** Data-only starter templates (no FieldBuilder). */
export const FORM_STARTERS: FormTemplate[] = [
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Name, email, phone, message',
    category: 'contact',
    config: {
      id: 'contact-form-template',
      method: 'POST',
      action: '/contact',
      className: 'contact-form',
      fields: [
        field('heading', 'Personal info', {
          options: { description: 'Contact details' },
        }),
        field('text', 'Name', { validation: { required: true } }),
        field('email', 'Email', {
          options: { autocomplete: 'email' },
          validation: { required: true },
        }),
        field('divider', 'Divider'),
        field('tel', 'Phone', { options: { autocomplete: 'tel' } }),
        field('textarea', 'Message', {
          options: { rows: 4 },
          validation: { required: true },
        }),
      ],
    },
  },
  {
    id: 'registration-form',
    name: 'Registration',
    description: 'Username, email, password',
    category: 'registration',
    config: {
      id: 'registration-form-template',
      method: 'POST',
      action: '/register',
      className: 'registration-form',
      fields: [
        field('text', 'Username', { validation: { required: true, minLength: 3 } }),
        field('email', 'Email', {
          options: { autocomplete: 'email' },
          validation: { required: true },
        }),
        field('password', 'Password', {
          options: { autocomplete: 'new-password' },
          validation: { required: true, minLength: 8 },
        }),
        field('checkbox', 'Agree to terms', {
          options: { value: 'I agree to the terms', checked: false },
          validation: { required: true },
        }),
      ],
    },
  },
  {
    id: 'survey-form',
    name: 'Survey',
    description: 'Rating and feedback',
    category: 'survey',
    config: {
      id: 'survey-form-template',
      method: 'POST',
      action: '/survey',
      className: 'survey-form',
      fields: [
        field('text', 'Name'),
        field('radio', 'Satisfaction', {
          options: {
            options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'],
            value: 'Satisfied',
          },
          validation: { required: true },
        }),
        field('select', 'How did you hear about us?', {
          options: {
            options: ['Search', 'Social', 'Friend', 'Other'],
            value: 'Search',
          },
        }),
        field('textarea', 'Comments', { options: { rows: 3 } }),
      ],
    },
  },
  {
    id: 'newsletter-form',
    name: 'Newsletter',
    description: 'Email signup',
    category: 'custom',
    config: {
      id: 'newsletter-form-template',
      method: 'POST',
      action: '/newsletter',
      className: 'newsletter-form',
      fields: [
        field('email', 'Email', {
          options: { autocomplete: 'email', placeholder: 'you@example.com' },
          validation: { required: true },
        }),
        field('text', 'Name'),
      ],
    },
  },
];

export const FORM_CATEGORIES: FormTemplate['category'][] = [
  'contact',
  'survey',
  'registration',
  'payment',
  'custom',
];

export const FORM_CATEGORY_NAMES: Record<FormTemplate['category'], string> = {
  contact: 'Contact',
  survey: 'Survey',
  registration: 'Registration',
  payment: 'Payment',
  custom: 'Custom',
};
