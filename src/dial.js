// Interactive Skeuomorphic Rotating Dial Knob for Pepper Timer
import { sounds } from './audio.js';

export class DialControl {
  constructor(element, onTimeChange) {
    this.element = element;
    this.onTimeChange = onTimeChange;
    this.currentAngle = 0; // degrees
    this.totalSeconds = 15 * 60; // default 15 minutes
    this.isDragging = false;
    this.startAngle = 0;
    this.center = { x: 0, y: 0 };
    this.lastClickAngle = 0;
    this.disabled = false;

    this.initEvents();
    this.updateVisual();
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    if (disabled) {
      this.element.classList.add('dial-disabled');
    } else {
      this.element.classList.remove('dial-disabled');
    }
  }

  setSeconds(seconds, triggerCallback = true) {
    this.totalSeconds = Math.max(0, Math.round(seconds));
    // 360 degrees = 30 minutes (1800 seconds) -> 1 degree = 5 seconds
    this.currentAngle = (this.totalSeconds / 5);
    this.updateVisual();
    if (triggerCallback && this.onTimeChange) {
      this.onTimeChange(this.totalSeconds);
    }
  }

  getSeconds() {
    return this.totalSeconds;
  }

  updateVisual() {
    this.element.style.transform = `rotate(${this.currentAngle}deg)`;
  }

  initEvents() {
    const handleStart = (e) => {
      if (this.disabled) return;
      this.isDragging = true;
      const rect = this.element.getBoundingClientRect();
      this.center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      this.startAngle = this.getPointAngle(clientX, clientY);
      this.lastClickAngle = this.currentAngle;
      
      this.element.classList.add('dial-active');
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    };

    const handleMove = (e) => {
      if (!this.isDragging || this.disabled) return;
      if (e.cancelable) e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const currentPointAngle = this.getPointAngle(clientX, clientY);
      let angleDiff = currentPointAngle - this.startAngle;

      // Handle crossing -180/180 boundary
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      const newAngle = Math.max(0, this.currentAngle + angleDiff);
      const angleDelta = newAngle - this.currentAngle;
      
      this.currentAngle = newAngle;
      this.startAngle = currentPointAngle;

      // 1 degree = 5 seconds (360 deg = 30 min)
      // If holding Shift / fine adjustment, 1 deg = 1 sec
      const secsPerDeg = e.shiftKey ? 1 : 5;
      const newSeconds = Math.max(0, Math.round(this.currentAngle * secsPerDeg));

      if (newSeconds !== this.totalSeconds) {
        this.totalSeconds = newSeconds;
        
        // Play mechanical tick sound every 3 degrees (~15s) or on minute marks
        if (Math.abs(this.currentAngle - this.lastClickAngle) >= 3) {
          sounds.playDialClick(e.shiftKey);
          this.lastClickAngle = this.currentAngle;
        }

        if (this.onTimeChange) {
          this.onTimeChange(this.totalSeconds);
        }
      }

      this.updateVisual();
    };

    const handleEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.element.classList.remove('dial-active');
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    this.element.addEventListener('mousedown', handleStart);
    this.element.addEventListener('touchstart', handleStart, { passive: false });
  }

  getPointAngle(x, y) {
    const dx = x - this.center.x;
    const dy = y - this.center.y;
    // Returns angle in degrees from -180 to 180
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }
}
