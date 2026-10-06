/** True when focus is in a field the host should not remount away. */
export function isEditingInside(host: HTMLElement): boolean {
  const ae = document.activeElement;
  if (!(ae instanceof HTMLElement) || !host.contains(ae)) {
    return false;
  }
  const tag = ae.tagName;
  if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || ae.isContentEditable) {
    return true;
  }
  return Boolean(ae.closest('.ocm-source-editor'));
}
