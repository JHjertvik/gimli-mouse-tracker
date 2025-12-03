class TrackerModel {
  constructor(initialValue, tension, friction, attributeValue, styleReceiver) {
    this.styleReceiver = styleReceiver;
    this.attributeValue = attributeValue;

    this.initialValue = initialValue;
    this.value = initialValue; // The current value
    this.target = initialValue; // The target value we're moving towards
    this.velocity = 0; // The current speed of change

    // Tunable physics parameters
    this.tension = tension; // How "strong" the spring is (0 to 1)
    this.friction = friction; // How much it resists (0 to 1) - lower is more bouncy
  }

  setToInitialValue() {
    this.target = this.initialValue;
  }

  // Set a new target to animate towards
  setTarget(newTarget) {
    this.target = newTarget;
  }

  update() {
    // Calculate the force of the spring (Hooke's Law)
    const springForce = (this.target - this.value) * this.tension;

    // Calculate the damping force (resistance)
    const dampingForce = -this.velocity * this.friction;

    // Update the velocity based on the combined forces
    this.velocity += springForce + dampingForce;

    // Update the current value
    this.value += this.velocity;

    let isMoving = true;

    // Check if it's close enough to snap
    if (Math.abs(this.value - this.target) < 0.1 && Math.abs(this.velocity) < 0.1) {
      this.value = this.target;
      this.velocity = 0;
      isMoving = false;
    }

    this.styleReceiver.style.setProperty(this.attributeValue, this.value);
    return isMoving;
  }
}

export class MouseTracker extends HTMLElement {
  static DEFAULT_FRICTION = 0.3;
  static DEFAULT_TENSION = 0.1;

  static get observedAttributes() {
    return [
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

    // Default physics
    this.friction = MouseTracker.DEFAULT_FRICTION;
    this.tension = MouseTracker.DEFAULT_TENSION;

    // Default offsets
    this.xOffsetPx = 0;
    this.yOffsetPx = 0;
    this.xOffsetPercentage = 0;
    this.yOffsetPercentage = 0;

    this.boundAnimate = this.animate.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);

    this.rootStyles = getComputedStyle(document.documentElement);
    this.componentStyles = getComputedStyle(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    const num = parseFloat(newValue);
    const numVal = isNaN(num) ? null : num;

    switch (name) {
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
    this.addEventListener('mousemove', this.boundHandleMouseMove);
    this.addEventListener('mouseleave', this.boundHandleMouseLeave);
  }

  disconnectedCallback() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.removeEventListener('mouseleave', this.boundHandleMouseLeave);
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

  /**
   * @param {MouseEvent} event
   */
  handleMouseMove(event) {
    // Tried to cache rect but measured no performance gains
    const rect = this.getBoundingClientRect();

    const xPx = event.clientX - rect.left;
    const yPx = event.clientY - rect.top;

    this.models['mouse-x']?.setTarget(xPx + this.xOffsetPx);
    this.models['mouse-y']?.setTarget(yPx + this.yOffsetPx);

    this.models['mouse-x-percentage']?.setTarget((xPx / rect.width) * 100 - this.xOffsetPercentage);
    this.models['mouse-y-percentage']?.setTarget((yPx / rect.height) * 100 - this.yOffsetPercentage);

    this.requestAnimate();
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