import designSystem from '../config/design-system.json';

// Type definitions for the design system
export type ColorShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type ColorName = 'primary' | 'secondary' | 'emerald' | 'gray' | 'red' | 'blue' | 'amber' | 'green';
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'bordered' | 'dashed';
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

// Design System object
export const ds = designSystem;

// Helper functions to get design tokens
export const getColor = (color: ColorName, shade?: ColorShade | 'dark'): string => {
  if (!shade) return ds.colors[color]['500'];
  const colorObj = ds.colors[color] as any;
  return colorObj[shade] || ds.colors[color]['500'];
};

export const getButtonClasses = (variant: ButtonVariant = 'primary'): string => {
  const button = ds.components.button[variant];
  return `${button.base} ${button.hover} ${button.active} ${button.disabled}`;
};

export const getBadgeClasses = (variant: BadgeVariant = 'primary'): string => {
  return ds.components.badge[variant];
};

export const getInputClasses = (state: 'default' | 'error' | 'success' = 'default'): string => {
  return `${ds.components.input.base} ${ds.components.input[state]} ${ds.components.input.disabled}`;
};

export const getCardClasses = (state: 'default' | 'hover' | 'active' | 'error' = 'default'): string => {
  return `${ds.components.card.base} ${ds.components.card.default} ${state !== 'default' ? ds.components.card[state] : ''}`;
};

export const getSelectClasses = (): string => {
  return `${ds.components.select.base} ${ds.components.select.default} ${ds.components.select.disabled}`;
};

export const getTextareaClasses = (state: 'default' | 'error' = 'default'): string => {
  return `${ds.components.textarea.base} ${ds.components.textarea[state]}`;
};

export const getCheckboxClasses = (): string => {
  return `${ds.components.checkbox.base} ${ds.components.checkbox.default}`;
};

export const getModalOverlayClasses = (): string => {
  return ds.components.modal.overlay;
};

export const getModalPanelClasses = (): string => {
  return ds.components.modal.panel;
};

export const getModalDialogClasses = (): string => {
  return ds.components.modal.dialog;
};

export const getModalContentClasses = (): string => {
  return ds.components.modal.content;
};

// Shadow utilities
export const getShadow = (size: 'soft' | 'soft-lg' | 'soft-xl' | 'none' = 'soft'): string => {
  return ds.shadows[size];
};

// Transition utilities
export const getTransitionDuration = (speed: 'fast' | 'normal' | 'slow' | 'slower' = 'normal'): string => {
  return ds.transitions.duration[speed];
};

// Spacing utilities
export const getSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'): string => {
  return ds.spacing[size];
};

// Border radius utilities
export const getBorderRadius = (size: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'): string => {
  return ds.borderRadius[size];
};

// Gradient utilities
export const getGradient = (type: 'primary' | 'warm' | 'cool' = 'primary'): string => {
  return ds.gradients[type];
};

// Export the full design system for direct access
export default ds;
