export interface NotificationOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: HTMLElement[] = [];

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public show(options: NotificationOptions): void {
    const { message, type = 'info', duration = 3000, position = 'top-right' } = options;

    // Создаем контейнер для позиции, если его нет
    let container = document.querySelector(
      `.notification-container.${position.replace('-', '-')}`
    ) as HTMLElement;
    if (!container) {
      container = document.createElement('div');
      container.className = `notification-container ${position.replace('-', '-')}`;
      document.body.appendChild(container);
    }

    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Добавляем в контейнер
    container.appendChild(notification);
    this.notifications.push(notification);

    // Автоматическое удаление
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }
  }

  public success(message: string, options?: Partial<NotificationOptions>): void {
    this.show({ ...options, message, type: 'success' });
  }

  public error(message: string, options?: Partial<NotificationOptions>): void {
    this.show({ ...options, message, type: 'error' });
  }

  public warning(message: string, options?: Partial<NotificationOptions>): void {
    this.show({ ...options, message, type: 'warning' });
  }

  public info(message: string, options?: Partial<NotificationOptions>): void {
    this.show({ ...options, message, type: 'info' });
  }

  private remove(notification: HTMLElement): void {
    if (!notification.parentNode) return;

    notification.classList.add('removing');

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }

      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }

      // Удаляем пустые контейнеры
      const containers = document.querySelectorAll('.notification-container');
      containers.forEach((container) => {
        if (container.children.length === 0) {
          container.remove();
        }
      });
    }, 300);
  }

  public clearAll(): void {
    this.notifications.forEach((notification) => {
      this.remove(notification);
    });
  }

  public destroy(): void {
    this.clearAll();
  }
}
