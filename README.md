# Gimli Mouse Tracker

A single-file, no-dependency Web Component that tracks the user's mouse movements with tunable physics parameters (tension and friction) and sets the result as CSS custom properties.

## Installation

```bash
npm install gimli-mouse-tracker
```

Once installed, import the Web Component anywhere in your project 

```js
import 'gimli-mouse-tracker';
```

### Minimal example [View on Codepen](https://codepen.io/gimli_app/pen/NPrEONK)

The component outputs unitless numbers, allowing you to use them in calc() for pixels, degrees, or other units.

```html
<mouse-tracker style="--x: 0;" mouse-x="--x">
  <div style="transform: translate(calc(var(--x) * 1px), 0px); height: 20px; width: 20px; background: red;"></div>
</mouse-tracker>
```

Check out the demos below for more examples on how to use the mouse tracker.

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

| Attribute  | Description | Expected value |
| -------- | ------- | ------- |
| mouse-x  | Maps the horizontal pixel position to a CSS variable. | A CSS variable name, for example: --mouse-x |
| mouse-y | Maps the vertical pixel position to a CSS variable. | A CSS variable name, for example:  --mouse-y |

### Percentage-Based Tracking
These track the mouse position as a percentage (0 to 100) of the element's total width and height.

| Attribute | Description | Expected value |
| -------- | ------- | ------- |
| mouse-x-percentage  | Maps horizontal progress (0-100%) to a CSS variable. | A CSS variable name, for example: --mouse-x-percentage |
| mouse-y-percentage | Maps vertical progress (0-100%) to a CSS variable. | A CSS variable name, for example: --mouse-y-percentage |

### Offset Adjustments
Offsets allow you to shift the coordinate system. These are useful for centering an element on the cursor (e.g., setting a percentage offset of 50 to make the center of the element the origin).

| Attribute | Description | Expected value |
| -------- | ------- | ------- |
| offset-x  | Subtracted from the mouse-x value.   | A unitless number |
| offset-y | Subtracted from the mouse-y value. | A unitless number |
| offset-x-percentage  | Subtracted from the mouse-x-percentage value.  | A unitless number (0 - 100) |
| offset-y-percentage | Subtracted from the mouse-y-percentage value. | A unitless number (0 - 100) |

### Other attributes
| Attribute     | Description | Default value |
| -------- | ------- | ------- |
| disabled  | Observed attribute for enabling/disabling using true/false | false |
| touch-support | Unobserved attribute for touch support using true/false.  | true |

## Technical Behavior
 - Initial Values: When the component initializes, it looks for an existing value of the CSS variable on the document root or the component itself to use as the starting point.
 - Mouse Leave: When the mouse leaves the element's area, all tracked variables will automatically animate back to their initial starting values.


