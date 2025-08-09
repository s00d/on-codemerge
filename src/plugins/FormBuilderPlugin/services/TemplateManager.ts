import type { FormTemplate, FieldConfig } from '../types';
import type { HTMLEditor } from '../../../app';
import { FieldBuilder } from './FieldBuilder';

export class TemplateManager {
  private templates: FormTemplate[] = [];
  private fieldBuilder: FieldBuilder;

  constructor(_editor: HTMLEditor) {
    this.fieldBuilder = new FieldBuilder();
  }

  /**
   * Initialize the template manager
   */
  initialize(): void {
    this.initializeTemplates();
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates(): void {
    this.templates = [
      this.createContactFormTemplate(),
      this.createRegistrationFormTemplate(),
      this.createSurveyFormTemplate(),
      this.createPaymentFormTemplate(),
      this.createOrderFormTemplate(),
      this.createFeedbackFormTemplate(),
      this.createResumeFormTemplate(),
      this.createBookingFormTemplate(),
      this.createNewsletterFormTemplate(),
      this.createSatisfactionSurveyTemplate(),
      this.createJobApplicationTemplate(),
      this.createSupportTicketTemplate(),
    ];
  }

  /**
   * Get all templates
   */
  getTemplates(): FormTemplate[] {
    return this.templates;
  }
  /**
   * Get categories
   */
  getCategories(): FormTemplate['category'][] {
    return ['contact', 'survey', 'registration', 'payment', 'custom'];
  }

  /**
   * Get category names in English
   */
  getCategoryNames(): Record<FormTemplate['category'], string> {
    return {
      contact: 'Contact',
      survey: 'Survey',
      registration: 'Registration',
      payment: 'Payment',
      custom: 'Custom',
    };
  }

  /**
   * Create contact form template
   */
  private createContactFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true }),
      this.fieldBuilder.createPresetField('tel', 'Phone'),
      this.fieldBuilder.createPresetField('textarea', 'Message', {}, { required: true }),
    ];

    return {
      id: 'contact-form',
      name: 'Contact Form',
      description: 'Simple form for user contact',
      category: 'contact',
      config: {
        id: 'contact-form-template',
        method: 'POST',
        action: '/contact',
        className: 'contact-form',
        fields,
      },
    };
  }

  /**
   * Create registration form template
   */
  private createRegistrationFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Username', {}, { required: true, minLength: 3 }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true, email: true }),
      this.fieldBuilder.createPresetField(
        'password',
        'Password',
        {},
        { required: true, minLength: 6 }
      ),
      this.fieldBuilder.createPresetField('password', 'Confirm Password', {}, { required: true }),
      this.fieldBuilder.createPresetField('checkbox', 'Agree to Terms', {}, { required: true }),
    ];

    return {
      id: 'registration-form',
      name: 'Registration Form',
      description: 'Form for new user registration',
      category: 'registration',
      config: {
        id: 'registration-form-template',
        method: 'POST',
        action: '/register',
        className: 'registration-form',
        fields,
      },
    };
  }

  /**
   * Create survey form template
   */
  private createSurveyFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Your Name', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'select',
        'Age Group',
        { options: ['18-25', '26-35', '36-45', '46-55', '55+'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField(
        'radio',
        'Gender',
        { options: ['Male', 'Female', 'Other'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField('textarea', 'Your Suggestions'),
      this.fieldBuilder.createPresetField('range', 'Service Rating', {}, { required: true }),
    ];

    return {
      id: 'survey-form',
      name: 'Survey Form',
      description: 'Form for conducting surveys',
      category: 'survey',
      config: {
        id: 'survey-form-template',
        method: 'POST',
        action: '/survey',
        className: 'survey-form',
        fields,
      },
    };
  }

  /**
   * Create payment form template
   */
  private createPaymentFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField(
        'text',
        'Card Number',
        {},
        { required: true, pattern: '^[0-9]{13,19}$' }
      ),
      this.fieldBuilder.createPresetField('text', 'Cardholder Name', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'text',
        'Expiry Date',
        {},
        { required: true, pattern: '^(0[1-9]|1[0-2])\/([0-9]{2})$' }
      ),
      this.fieldBuilder.createPresetField(
        'text',
        'CVV',
        {},
        { required: true, pattern: '^[0-9]{3,4}$' }
      ),
      this.fieldBuilder.createPresetField('number', 'Amount', {}, { required: true, min: 0.01 }),
    ];

    return {
      id: 'payment-form',
      name: 'Payment Form',
      description: 'Form for processing payments',
      category: 'payment',
      config: {
        id: 'payment-form-template',
        method: 'POST',
        action: '/payment',
        className: 'payment-form',
        fields,
      },
    };
  }

  /**
   * Create order form template
   */
  private createOrderFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Product Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('number', 'Quantity', {}, { required: true, min: 1 }),
      this.fieldBuilder.createPresetField('text', 'Customer Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true, email: true }),
      this.fieldBuilder.createPresetField('tel', 'Phone', {}, { required: true }),
      this.fieldBuilder.createPresetField('textarea', 'Delivery Address', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'select',
        'Delivery Method',
        { options: ['Standard Delivery', 'Express Delivery', 'Pickup'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField('textarea', 'Special Instructions'),
    ];

    return {
      id: 'order-form',
      name: 'Order Form',
      description: 'Form for product orders and delivery',
      category: 'custom',
      config: {
        id: 'order-form-template',
        method: 'POST',
        action: '/order',
        className: 'order-form',
        fields,
      },
    };
  }

  /**
   * Create feedback form template
   */
  private createFeedbackFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Your Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true, email: true }),
      this.fieldBuilder.createPresetField(
        'select',
        'Feedback Type',
        { options: ['Bug Report', 'Feature Request', 'General Feedback', 'Complaint', 'Praise'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField('text', 'Subject', {}, { required: true }),
      this.fieldBuilder.createPresetField('textarea', 'Your Feedback', {}, { required: true }),
      this.fieldBuilder.createPresetField('range', 'Rating', {}, { required: true }),
      this.fieldBuilder.createPresetField('checkbox', 'Allow us to contact you'),
    ];

    return {
      id: 'feedback-form',
      name: 'Feedback Form',
      description: 'Form for collecting user feedback and suggestions',
      category: 'survey',
      config: {
        id: 'feedback-form-template',
        method: 'POST',
        action: '/feedback',
        className: 'feedback-form',
        fields,
      },
    };
  }

  /**
   * Create resume form template
   */
  private createResumeFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Full Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true, email: true }),
      this.fieldBuilder.createPresetField('tel', 'Phone', {}, { required: true }),
      this.fieldBuilder.createPresetField('text', 'Position Applied For', {}, { required: true }),
      this.fieldBuilder.createPresetField('textarea', 'Work Experience', {}, { required: true }),
      this.fieldBuilder.createPresetField('textarea', 'Education'),
      this.fieldBuilder.createPresetField('textarea', 'Skills'),
      this.fieldBuilder.createPresetField('file', 'Resume/CV', {}, { required: true }),
      this.fieldBuilder.createPresetField('textarea', 'Cover Letter'),
      this.fieldBuilder.createPresetField(
        'checkbox',
        'I agree to the terms',
        {},
        { required: true }
      ),
    ];

    return {
      id: 'resume-form',
      name: 'Resume Form',
      description: 'Form for job applications and resume submission',
      category: 'custom',
      config: {
        id: 'resume-form-template',
        method: 'POST',
        action: '/resume',
        className: 'resume-form',
        fields,
      },
    };
  }

  /**
   * Create booking form template
   */
  private createBookingFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Full Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true, email: true }),
      this.fieldBuilder.createPresetField('tel', 'Phone', {}, { required: true }),
      this.fieldBuilder.createPresetField('date', 'Booking Date', {}, { required: true }),
      this.fieldBuilder.createPresetField('time', 'Preferred Time', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'select',
        'Service Type',
        { options: ['Consultation', 'Appointment', 'Meeting', 'Event', 'Other'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField(
        'number',
        'Number of People',
        {},
        { required: true, min: 1 }
      ),
      this.fieldBuilder.createPresetField('textarea', 'Special Requirements'),
      this.fieldBuilder.createPresetField(
        'checkbox',
        'I confirm my booking',
        {},
        { required: true }
      ),
    ];

    return {
      id: 'booking-form',
      name: 'Booking Form',
      description: 'Form for scheduling appointments and bookings',
      category: 'custom',
      config: {
        id: 'booking-form-template',
        method: 'POST',
        action: '/booking',
        className: 'booking-form',
        fields,
      },
    };
  }

  /**
   * Create newsletter subscription form template
   */
  private createNewsletterFormTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'First Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('text', 'Last Name', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'email',
        'Email Address',
        {},
        { required: true, email: true }
      ),
      this.fieldBuilder.createPresetField('select', 'Newsletter Type', {
        options: ['General', 'Technology', 'Business', 'Lifestyle', 'All'],
      }),
      this.fieldBuilder.createPresetField('checkbox', 'Weekly Newsletter'),
      this.fieldBuilder.createPresetField('checkbox', 'Monthly Newsletter'),
      this.fieldBuilder.createPresetField('checkbox', 'Special Offers'),
      this.fieldBuilder.createPresetField(
        'checkbox',
        'I agree to receive emails',
        {},
        { required: true }
      ),
    ];

    return {
      id: 'newsletter-form',
      name: 'Newsletter Subscription',
      description: 'Form for newsletter and email subscription',
      category: 'contact',
      config: {
        id: 'newsletter-form-template',
        method: 'POST',
        action: '/newsletter',
        className: 'newsletter-form',
        fields,
      },
    };
  }

  /**
   * Create satisfaction survey template
   */
  private createSatisfactionSurveyTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Customer Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true, email: true }),
      this.fieldBuilder.createPresetField('select', 'Product/Service Used', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'radio',
        'Overall Satisfaction',
        {
          options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
        },
        { required: true }
      ),
      this.fieldBuilder.createPresetField(
        'radio',
        'Would you recommend us?',
        { options: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField(
        'radio',
        'Value for Money',
        { options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField('textarea', 'What did you like most?'),
      this.fieldBuilder.createPresetField('textarea', 'What could we improve?'),
      this.fieldBuilder.createPresetField('checkbox', 'Allow us to use your feedback'),
    ];

    return {
      id: 'satisfaction-survey',
      name: 'Satisfaction Survey',
      description: 'Form for measuring customer satisfaction',
      category: 'survey',
      config: {
        id: 'satisfaction-survey-template',
        method: 'POST',
        action: '/satisfaction-survey',
        className: 'satisfaction-survey',
        fields,
      },
    };
  }

  /**
   * Create job application form template
   */
  private createJobApplicationTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'First Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('text', 'Last Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true, email: true }),
      this.fieldBuilder.createPresetField('tel', 'Phone', {}, { required: true }),
      this.fieldBuilder.createPresetField('text', 'Position', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'select',
        'Experience Level',
        { options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField(
        'textarea',
        'Why should we hire you?',
        {},
        { required: true }
      ),
      this.fieldBuilder.createPresetField(
        'textarea',
        'Previous Experience',
        {},
        { required: true }
      ),
      this.fieldBuilder.createPresetField('file', 'Resume', {}, { required: true }),
      this.fieldBuilder.createPresetField('file', 'Cover Letter'),
      this.fieldBuilder.createPresetField('checkbox', 'I am available for interview'),
      this.fieldBuilder.createPresetField(
        'checkbox',
        'I agree to the terms',
        {},
        { required: true }
      ),
    ];

    return {
      id: 'job-application',
      name: 'Job Application',
      description: 'Form for job applications and recruitment',
      category: 'custom',
      config: {
        id: 'job-application-template',
        method: 'POST',
        action: '/job-application',
        className: 'job-application',
        fields,
      },
    };
  }

  /**
   * Create support ticket form template
   */
  private createSupportTicketTemplate(): FormTemplate {
    const fields: FieldConfig[] = [
      this.fieldBuilder.createPresetField('text', 'Full Name', {}, { required: true }),
      this.fieldBuilder.createPresetField('email', 'Email', {}, { required: true, email: true }),
      this.fieldBuilder.createPresetField('tel', 'Phone', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'select',
        'Issue Category',
        {
          options: [
            'Technical Issue',
            'Billing Question',
            'Feature Request',
            'Bug Report',
            'General Inquiry',
          ],
        },
        { required: true }
      ),
      this.fieldBuilder.createPresetField(
        'select',
        'Priority Level',
        { options: ['Low', 'Medium', 'High', 'Critical'] },
        { required: true }
      ),
      this.fieldBuilder.createPresetField('text', 'Subject', {}, { required: true }),
      this.fieldBuilder.createPresetField(
        'textarea',
        'Description of Issue',
        {},
        { required: true }
      ),
      this.fieldBuilder.createPresetField('file', 'Screenshots/Attachments'),
      this.fieldBuilder.createPresetField('textarea', 'Steps to Reproduce'),
      this.fieldBuilder.createPresetField(
        'checkbox',
        'I agree to the support terms',
        {},
        { required: true }
      ),
    ];

    return {
      id: 'support-ticket',
      name: 'Support Ticket',
      description: 'Form for creating support tickets and technical issues',
      category: 'custom',
      config: {
        id: 'support-ticket-template',
        method: 'POST',
        action: '/support-ticket',
        className: 'support-ticket',
        fields,
      },
    };
  }

  /**
   * Получает шаблон по ID
   */
  getTemplate(templateId: string): FormTemplate | undefined {
    return this.templates.find((template) => template.id === templateId);
  }
  /**
   * Экспортирует шаблон в JSON
   */
  exportTemplate(templateId: string): string | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    return JSON.stringify(template, null, 2);
  }
}
