import { LocaleManager } from '../services/LocaleManager';

describe('LocaleManager', () => {
  let localeManager: LocaleManager;

  beforeEach(() => {
    localeManager = new LocaleManager('en');
  });

  it('should load the default locale', async () => {
    await localeManager.loadLocale('en');
    expect(localeManager.getCurrentLocale()).toMatchSnapshot();
  });

  it('should translate a key correctly', async () => {
    await localeManager.loadLocale('en');
    const translation = localeManager.translate('New Block');
    expect(translation).toMatchSnapshot();
  });

  it('should fallback to default locale if translation is missing', async () => {
    await localeManager.loadLocale('ru');
    const translation = localeManager.translate('NonExistentKey');
    expect(translation).toMatchSnapshot();
  });

  it('should replace placeholders in translations', async () => {
    await localeManager.loadLocale('en');
    const translation = localeManager.translate('File size exceeds {{max}} limit', { max: '10MB' });
    expect(translation).toMatchSnapshot();
  });

  it('should set a new locale', async () => {
    await localeManager.loadLocale('ru');
    await localeManager.setLocale('ru');
    expect(localeManager.getCurrentLocale()).toMatchSnapshot();
  });

  it('should return the list of loaded locales', async () => {
    await localeManager.loadLocale('en');
    await localeManager.loadLocale('ru');
    const loadedLocales = localeManager.getLoadedLocales();
    expect(loadedLocales).toMatchSnapshot();
  });
});
