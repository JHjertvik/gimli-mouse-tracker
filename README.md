# Gimli Mouse Tracker

A single-file, no-dependency Web Component that tracks the user's mouse movements with tunable physics parameters (tension and friction) and sets the result as CSS custom properties.

## Installation

```bash
npm install gimli-mouse-tracker
```

## Documentation

The mouse-tracker is a zero-dependency Web Component that monitors mouse movement within its bounds and maps those coordinates to CSS Custom Properties (CSS variables) using a spring-physics engine for smooth, organic motion.

## Demos
 - [Weather Widget on Codepen](https://codepen.io/gimli_app/pen/OPXgbwj)
 - [Magnetic button on Codepen](https://codepen.io/gimli_app/pen/VYaGoWj)
 - [Magnifying Widget](https://codepen.io/gimli_app/pen/jErweWL)
 - [Compare Widget](https://codepen.io/gimli_app/pen/azZVjRe)

## Attributes
### Physics Configuration
These attributes control the "feel" of the animation. They apply globally to all tracked variables within the component.

| Attribute    | Default | Description |
| -------- | ------- | ------- |
| friction  | 0.3    | Resistance. Controls how much the movement resists. Lower values result in more "bounciness" or overshoot; higher values make the movement stiffer.    |
| tension | 0.1     | Spring Strength. Controls how strongly the value pulls toward the target. Higher values make the animation faster and snappier.   |

### Tracking Attributes
The values of these attributes must be the CSS variable name (e.g., --my-coord) you wish to control.

### Pixel-Based Tracking
These track the mouse position in absolute pixels relative to the top-left corner of the <mouse-tracker> element.

| Attribute     | Description |
| -------- | ------- |
| mouse-x  | Maps the horizontal pixel position to a CSS variable.    |
| mouse-y | Maps the vertical pixel position to a CSS variable.  |

### Percentage-Based Tracking
These track the mouse position as a percentage (0 to 100) of the element's total width and height.

| Attribute     | Description |
| -------- | ------- |
| mouse-x-percentage  | Maps horizontal progress (0-100%) to a CSS variable.   |
| mouse-y-percentage | Maps vertical progress (0-100%) to a CSS variable. |

### Offset Adjustments
Offsets allow you to shift the coordinate system. These are useful for centering an element on the cursor (e.g., setting a percentage offset of 50 to make the center of the element the origin).

| Attribute     | Description |
| -------- | ------- |
| offset-x  | Subtracted from the mouse-x value.   |
| offset-y | Subtracted from the mouse-y value. |
| offset-x-percentage  | Subtracted from the mouse-x-percentage value.  |
| offset-y-percentage | Subtracted from the mouse-y-percentage value. |

## Technical Behavior
 - Initial Values: When the component initializes, it looks for an existing value of the CSS variable on the document root or the component itself to use as the starting point.
 - Mouse Leave: When the mouse leaves the element's area, all tracked variables will automatically animate back to their initial starting values.


