export class ValidationManager {
  addValidation(field: HTMLElement, rules: any): void {
    const input = field.querySelector('input, select, textarea');
    if (!input) return;

    if (rules.required) {
      input.setAttribute('required', 'true');
    }
    if (rules.pattern) {
      input.setAttribute('pattern', rules.pattern);
    }
    if (rules.minLength) {
      input.setAttribute('minlength', rules.minLength);
    }
    if (rules.maxLength) {
      input.setAttribute('maxlength', rules.maxLength);
    }
    if (rules.min) {
      input.setAttribute('min', rules.min);
    }
    if (rules.max) {
      input.setAttribute('max', rules.max);
    }
  }
}
