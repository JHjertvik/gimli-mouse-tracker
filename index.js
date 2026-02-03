class TrackerModel {
  constructor(initialValue, tension, friction, attributeValue, styleReceiver) {
    this.styleReceiver = styleReceiver;
    this.attributeValue = attributeValue;

    this.initialValue = initialValue;
    this.value = initialValue;
    this.target = initialValue;
    this.velocity = 0;

    this.tension = tension;
    this.friction = friction;
  }

  setToInitialValue() {
    this.target = this.initialValue;
  }

  setTarget(newTarget) {
    this.target = newTarget;
  }

  update() {
    const springForce = (this.target - this.value) * this.tension;
    const dampingForce = -this.velocity * this.friction;

    this.velocity += springForce + dampingForce;
    this.value += this.velocity;

    let isMoving = true;

    if (Math.abs(this.value - this.target) < 0.1 && Math.abs(this.velocity) < 0.1) {
      this.value = this.target;
      this.velocity = 0;
      isMoving = false;
    }

    this.styleReceiver.style.setProperty(this.attributeValue, this.value);
    return isMoving;
  }
}

class MouseTracker extends HTMLElement {
  static DEFAULT_FRICTION = 0.3;
  static DEFAULT_TENSION = 0.1;

  static get observedAttributes() {
    return [
      'disabled',
      'friction',
      'tension',
      'offset-x',
      'offset-y',
      'offset-x-percentage',
      'offset-y-percentage',
      'mouse-x',
      'mouse-y',
      'mouse-x-percentage',
      'mouse-y-percentage',
    ];
  }

  constructor() {
    super();
    this.models = {};
    this.modelsArr = [];

    this.friction = MouseTracker.DEFAULT_FRICTION;
    this.tension = MouseTracker.DEFAULT_TENSION;

    this.xOffsetPx = 0;
    this.yOffsetPx = 0;
    this.xOffsetPercentage = 0;
    this.yOffsetPercentage = 0;

    this.boundAnimate = this.animate.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);

    this.rootStyles = getComputedStyle(document.documentElement);
    this.componentStyles = getComputedStyle(this);
  }

  get isDisabled() {
    return this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    const num = parseFloat(newValue);
    const numVal = isNaN(num) ? null : num;

    switch (name) {
      case 'disabled':
        if (this.isConnected) {
          this.isDisabled ? this.stopTracking() : this.startTracking();
        }
        break;
      case 'friction':
        this.friction = numVal || MouseTracker.DEFAULT_FRICTION;
        this.updateAllModelsPhysics();
        break;
      case 'tension':
        this.tension = numVal || MouseTracker.DEFAULT_TENSION;
        this.updateAllModelsPhysics();
        break;
      case 'offset-x':
        this.xOffsetPx = numVal || 0;
        break;
      case 'offset-y':
        this.yOffsetPx = numVal || 0;
        break;
      case 'offset-x-percentage':
        this.xOffsetPercentage = numVal || 0;
        break;
      case 'offset-y-percentage':
        this.yOffsetPercentage = numVal || 0;
        break;
      case 'mouse-x':
      case 'mouse-y':
      case 'mouse-x-percentage':
      case 'mouse-y-percentage':
        this.createOrUpdateModel(name);
        break;
    }
  }

  createOrUpdateModel(attributeName) {
    const attributeValue = this.getAttribute(attributeName);

    if (!attributeValue) {
      this.models[attributeName] = null;
      this.refreshModelsArray();
      return;
    }

    const rootValue = this.rootStyles.getPropertyValue(attributeValue);
    const value = parseFloat((rootValue || this.componentStyles.getPropertyValue(attributeValue)) ?? 0);

    this.models[attributeName] = new TrackerModel(
      value,
      this.tension,
      this.friction,
      attributeValue,
      rootValue ? document.documentElement : this
    );

    this.refreshModelsArray();
  }

  refreshModelsArray() {
    this.modelsArr = Object.values(this.models).filter((value) => value !== null);
  }

  connectedCallback() {
    if (!this.isDisabled) {
      this.startTracking();
    }
  }

  disconnectedCallback() {
    this.stopTracking();
  }

  startTracking() {
    this.addEventListener('mousemove', this.boundHandleMouseMove);
    this.addEventListener('mouseleave', this.boundHandleMouseLeave);

    if (this.getAttribute('touch-support') !== 'false') {
      this.addEventListener('touchstart', this.boundHandleTouchMove, { passive: true });
      this.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true });
      this.addEventListener('touchend', this.boundHandleTouchEnd);
      this.addEventListener('touchcancel', this.boundHandleTouchEnd);
    }
  }

  stopTracking() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.removeEventListener('mouseleave', this.boundHandleMouseLeave);
    
    // Always attempt removal to ensure clean state
    this.removeEventListener('touchstart', this.boundHandleTouchMove);
    this.removeEventListener('touchmove', this.boundHandleTouchMove);
    this.removeEventListener('touchend', this.boundHandleTouchEnd);
    this.removeEventListener('touchcancel', this.boundHandleTouchEnd);
  }

  updateAllModelsPhysics() {
    this.modelsArr.forEach((model) => {
      if (model) {
        model.friction = this.friction;
        model.tension = this.tension;
      }
    });
  }

  handleMouseLeave() {
    this.modelsArr.forEach((model) => model.setToInitialValue());
    this.requestAnimate();
  }

  handleTouchEnd() {
    this.handleMouseLeave();
  }

  updateTargets(clientX, clientY) {
    // Tried to cache rect but measured no performance gains
    const rect = this.getBoundingClientRect();

    const xPx = clientX - rect.left;
    const yPx = clientY - rect.top;

    this.models['mouse-x']?.setTarget(xPx + this.xOffsetPx);
    this.models['mouse-y']?.setTarget(yPx + this.yOffsetPx);

    this.models['mouse-x-percentage']?.setTarget((xPx / rect.width) * 100 - this.xOffsetPercentage);
    this.models['mouse-y-percentage']?.setTarget((yPx / rect.height) * 100 - this.yOffsetPercentage);

    this.requestAnimate();
  }

  handleMouseMove(event) {
    this.updateTargets(event.clientX, event.clientY);
  }

  handleTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updateTargets(touch.clientX, touch.clientY);
    }
  }

  requestAnimate() {
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(this.boundAnimate);
    }
  }

  animate() {
    let stillAnimating = false;

    this.modelsArr.forEach((model) => {
      if (model.update()) {
        stillAnimating = true;
      }
    });

    if (stillAnimating) {
      this.animationFrameId = requestAnimationFrame(this.boundAnimate);
    } else {
      this.animationFrameId = null;
    }
  }
}

customElements.define('mouse-tracker', MouseTracker);