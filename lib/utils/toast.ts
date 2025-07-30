type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

class Toast {
  private container: HTMLDivElement | null = null;

  private getOrCreateContainer(): HTMLDivElement {
    if (!this.container) {
      this.container = document.getElementById('toast-container') as HTMLDivElement;
      
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(this.container);
      }
    }
    
    return this.container;
  }

  private show(message: string, type: ToastType, options: ToastOptions = {}) {
    const { duration = 3000 } = options;
    const container = this.getOrCreateContainer();
    
    const toast = document.createElement('div');
    toast.className = `transform transition-all duration-300 ease-in-out max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`;
    
    const typeStyles = {
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600'
    };
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <div class="flex-1 w-0 p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0 pt-0.5">
            <span class="${typeStyles[type]} text-xl">${icons[type]}</span>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-gray-900">
              ${message}
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Add to container with animation
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });
    
    // Auto remove
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  success(message: string, options?: ToastOptions) {
    this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions) {
    this.show(message, 'error', options);
  }

  warning(message: string, options?: ToastOptions) {
    this.show(message, 'warning', options);
  }

  info(message: string, options?: ToastOptions) {
    this.show(message, 'info', options);
  }
}

export const toast = new Toast();