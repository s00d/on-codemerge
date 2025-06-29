import type { Timer, CreateTimerData, UpdateTimerData, TimerTimeLeft } from '../types';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class TimerManager {
  private timersKey = 'html-editor-timers';
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  public getTimers(): Timer[] {
    const stored = localStorage.getItem(this.timersKey);
    if (!stored) return [];

    const timers = JSON.parse(stored);

    // Конвертируем строки targetDate обратно в объекты Date
    return timers.map((timer: any) => ({
      ...timer,
      targetDate: new Date(timer.targetDate)
    }));
  }

  public getTimer(id: string): Timer | null {
    const timers = this.getTimers();
    return timers.find(timer => timer.id === id) || null;
  }

  public createTimer(data: CreateTimerData): Timer {
    const timers = this.getTimers();
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      targetDate: data.targetDate,
      targetTime: data.targetTime,
      color: data.color || '#3b82f6',
      category: data.category,
      tags: data.tags || [],
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    timers.push(newTimer);
    localStorage.setItem(this.timersKey, JSON.stringify(timers, (_key, value) => {
      // Конвертируем Date в строку для JSON
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
    return newTimer;
  }

  public updateTimer(id: string, data: UpdateTimerData): Timer {
    const timers = this.getTimers();
    const index = timers.findIndex(timer => timer.id === id);

    if (index === -1) {
      throw new Error('Timer not found');
    }

    const updated: Timer = {
      ...timers[index],
      ...data,
      updatedAt: Date.now(),
    };

    timers[index] = updated;
    localStorage.setItem(this.timersKey, JSON.stringify(timers, (_key, value) => {
      // Конвертируем Date в строку для JSON
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
    return updated;
  }

  public deleteTimer(id: string): void {
    const timers = this.getTimers().filter(timer => timer.id !== id);
    localStorage.setItem(this.timersKey, JSON.stringify(timers));
  }

  public getTimeLeft(timer: Timer): TimerTimeLeft {
    // Если targetDate это объект Date, используем его напрямую
    let targetDateTime: Date;
    if (timer.targetDate instanceof Date) {
      targetDateTime = timer.targetDate;
    } else {
      // Fallback для старых данных, где targetDate была строкой
      targetDateTime = new Date(`${timer.targetDate}T${timer.targetTime}`);
    }

    const now = new Date();
    const diff = targetDateTime.getTime() - now.getTime();

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
    };
  }

  // Генерация HTML таймера
  public generateTimerHTML(timer: Timer): string {
    const timeLeft = this.getTimeLeft(timer);
    const categoryColor = timer.color || '#3b82f6';
    const categoryName = timer.category || this.editor.t('General');
    
    const tagsHtml = timer.tags && timer.tags.length > 0 
      ? `<div class="timer-tags">${timer.tags.map(tag => `<span class="timer-tag">${tag}</span>`).join('')}</div>` 
      : '';

    const timeLeftHtml = timeLeft.isExpired 
      ? `<div class="timer-expired">${this.editor.t('Time expired')}</div>`
      : `<div class="timer-countdown" id="timer-countdown-${timer.id}">
          <div class="timer-unit">
            <span class="timer-value" id="timer-days-${timer.id}">${timeLeft.days}</span>
            <span class="timer-label">${this.editor.t('days')}</span>
          </div>
          <div class="timer-unit">
            <span class="timer-value" id="timer-hours-${timer.id}">${timeLeft.hours.toString().padStart(2, '0')}</span>
            <span class="timer-label">${this.editor.t('hours')}</span>
          </div>
          <div class="timer-unit">
            <span class="timer-value" id="timer-minutes-${timer.id}">${timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span class="timer-label">${this.editor.t('min')}</span>
          </div>
          <div class="timer-unit">
            <span class="timer-value" id="timer-seconds-${timer.id}">${timeLeft.seconds.toString().padStart(2, '0')}</span>
            <span class="timer-label">${this.editor.t('sec')}</span>
          </div>
        </div>`;

    // Форматируем целевую дату
    let targetDate: Date;
    if (timer.targetDate instanceof Date) {
      targetDate = timer.targetDate;
    } else {
      // Fallback для старых данных
      targetDate = new Date(`${timer.targetDate}T${timer.targetTime}`);
    }
    
    const formattedTargetDate = targetDate.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // JavaScript для обновления таймера
    const updateScript = `
      <script>
        (function() {
          const timerId = '${timer.id}';
          const targetDate = new Date('${targetDate.toISOString()}');
          const expiredText = '${this.editor.t('Time expired')}';
          
          function updateTimer() {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();
            
            if (diff <= 0) {
              // Таймер истек
              const countdownEl = document.getElementById('timer-countdown-' + timerId);
              if (countdownEl) {
                countdownEl.innerHTML = '<div class="timer-expired">' + expiredText + '</div>';
              }
              return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const daysEl = document.getElementById('timer-days-' + timerId);
            const hoursEl = document.getElementById('timer-hours-' + timerId);
            const minutesEl = document.getElementById('timer-minutes-' + timerId);
            const secondsEl = document.getElementById('timer-seconds-' + timerId);
            
            if (daysEl) daysEl.textContent = days;
            if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
          }
          
          // Обновляем каждую секунду
          updateTimer();
          setInterval(updateTimer, 1000);
        })();
      </script>
    `;

    return `
      <div class="timer-widget" data-timer-id="${timer.id}" style="--timer-color: ${timer.color || '#3b82f6'}">
        <div class="timer-header">
          <div class="timer-title">${timer.title}</div>
          <div class="timer-category" style="background-color: ${categoryColor}">${categoryName}</div>
        </div>
        ${timer.description ? `<div class="timer-description">${timer.description}</div>` : ''}
        <div class="timer-target-date">${this.editor.t('Until')}: ${formattedTargetDate}</div>
        ${timeLeftHtml}
        ${tagsHtml}
      </div>
      ${updateScript}
    `;
  }

  public exportTimer(id: string): string {
    const timer = this.getTimer(id);
    if (!timer) {
      throw new Error('Timer not found');
    }

    const exportData = {
      timer,
      exportDate: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  public importTimer(data: string): Timer {
    try {
      const importData = JSON.parse(data);
      const timer = importData.timer;

      return this.createTimer({
        title: timer.title,
        description: timer.description,
        targetDate: timer.targetDate,
        targetTime: timer.targetTime,
        color: timer.color,
        category: timer.category,
        tags: timer.tags,
      });
    } catch (error) {
      throw new Error('Invalid timer data format');
    }
  }

  public copyTimer(id: string): Timer {
    const originalTimer = this.getTimer(id);
    if (!originalTimer) {
      throw new Error('Timer not found');
    }

    return this.createTimer({
      title: `${originalTimer.title} (Копия)`,
      description: originalTimer.description,
      targetDate: originalTimer.targetDate,
      targetTime: originalTimer.targetTime,
      color: originalTimer.color,
      category: originalTimer.category,
      tags: originalTimer.tags,
    });
  }
} 
