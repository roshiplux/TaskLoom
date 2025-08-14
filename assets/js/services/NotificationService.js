// Simple Notification Service
class NotificationService {
    static show(message, type = 'info', duration = 3500) {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.warn('Notification container not found in the DOM.');
            // Fallback to alert
            alert(message);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Trigger fade in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Set timeout to remove the notification
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            // Remove element after transition
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, duration);
    }
}
