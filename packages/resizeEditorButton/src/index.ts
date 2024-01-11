import { DropdownMenu } from "../../../helpers/dropdownMenu";
import { smartphone } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

const popularScreenSizes = [
  { width: 360, height: 640, deviceType: "Phone (360x640)" },
  { width: 375, height: 667, deviceType: "Phone (375x667)" },
  { width: 414, height: 896, deviceType: "Phone (414x896)" },
  { width: 768, height: 1024, deviceType: "Tablet (768x1024)" },
  { width: 800, height: 1280, deviceType: "Tablet (800x1280)" },
  { width: 834, height: 1112, deviceType: "Tablet (834x1112)" },
  { width: 1024, height: 1366, deviceType: "Tablet (1024x1366)" },
  { width: 1280, height: 720, deviceType: "Desktop (1280x720)" },
  { width: 1366, height: 768, deviceType: "Desktop (1366x768)" },
  { width: 1440, height: 900, deviceType: "Desktop (1440x900)" },
  { width: 1536, height: 864, deviceType: "Desktop (1536x864)" },
  { width: 1920, height: 1080, deviceType: "Desktop (1920x1080)" },
  { width: 2560, height: 1440, deviceType: "Desktop (2560x1440)" }
];

export class ResizeEditorButton implements IEditorModule, Observer {
  private dropdown: DropdownMenu|null = null;
  private core: EditorCoreInterface|null = null;
  private active: string|null = null;
  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.dropdown = new DropdownMenu(core, smartphone, 'Styling', () => {
      this.dropdown?.clearItems();
      this.dropdown?.addItem('Default', () => {
        this.core?.editor.clearScreenSize();
        this.active = null;
      }, () => this.active === null)
      for (const i in popularScreenSizes) {
        this.dropdown?.addItem(popularScreenSizes[i].deviceType, () => {
          this.core?.editor.setScreenSize(popularScreenSizes[i].width, popularScreenSizes[i].height);
          this.active = popularScreenSizes[i].deviceType;
        }, () => this.active === popularScreenSizes[i].deviceType)
      }
    })

    core.toolbar.addHtmlItem(this.dropdown.getButton());

    core.i18n.addObserver(this);
  }

  update(): void {
    this.dropdown?.setTitle(this.core!.i18n.translate('Styling'))
  }

  destroy(): void {
    this.dropdown?.destroy();
    this.dropdown = null;
    this.core = null;
    this.active = null;
  }
}

export default ResizeEditorButton;
