import React from 'react';

/**
 * Creates a Material Design ink ripple emanating from the click/tap coordinate.
 */
export const createRipple = (
  event: React.MouseEvent<HTMLElement>,
  color: string = 'rgba(0, 0, 0, 0.15)'
) => {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  const circle = document.createElement('span');
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.style.backgroundColor = color;
  circle.classList.add('ripple-circle');

  // Remove any stale ripple
  const existingRipple = element.querySelector('.ripple-circle');
  if (existingRipple) {
    existingRipple.remove();
  }

  element.appendChild(circle);

  setTimeout(() => {
    circle.remove();
  }, 600);
};

export default createRipple;
