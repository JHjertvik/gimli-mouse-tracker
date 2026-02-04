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
    this.modelAttributes = [];

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
  }

  get isDisabled() {
    return this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';
  }

  parseValue(value, defaultValue){
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (attribute) {
      case 'disabled':
        if (this.isConnected) {
          this.isDisabled ? this.stopTracking() : this.startTracking();
        }
        break;
      case 'friction':
        this.friction = this.parseValue(newValue, MouseTracker.DEFAULT_FRICTION);
        this.updateAllModelsPhysics();
        break;
      case 'tension':
        this.tension = this.parseValue(newValue, MouseTracker.DEFAULT_TENSION);
        this.updateAllModelsPhysics();
        break;
      case 'offset-x':
        this.xOffsetPx = this.parseValue(newValue, 0);
        break;
      case 'offset-y':
        this.yOffsetPx = this.parseValue(newValue, 0);
        break;
      case 'offset-x-percentage':
        this.xOffsetPercentage = this.parseValue(newValue, 0);
        break;
      case 'offset-y-percentage':
        this.yOffsetPercentage = this.parseValue(newValue, 0);
        break;
      case 'mouse-x':
      case 'mouse-y':
      case 'mouse-x-percentage':
      case 'mouse-y-percentage':
        if(this.modelAttributes.includes(attribute)){
          this.createOrUpdateModel(attribute);
        }else{
          this.modelAttributes.push(attribute);
        }
        break;
    }
  }

  createOrUpdateModel(attributeName) {
    const attributeValue = this.getAttribute(attributeName);

    if (!attributeValue) {
      this.models[attributeName] = null;
      this.modelsArr = Object.values(this.models).filter((value) => value !== null);
      return;
    }

    const rootValue = this.rootStyles.getPropertyValue(attributeValue);
    const value =  this.parseValue(rootValue || getComputedStyle(this).getPropertyValue(attributeValue), 0);
    
    this.models[attributeName] = new TrackerModel(
      value,
      this.tension,
      this.friction,
      attributeValue,
      rootValue ? document.documentElement : this
    );

    this.modelsArr = Object.values(this.models).filter((value) => value !== null);
  }

  connectedCallback() {
    this.modelAttributes.forEach(attribute => this.createOrUpdateModel(attribute));
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