export type MathTemplate = {
  key: string;
  name: string;
  expression: string;
};

/** Starter formulas — ChartMenu templates analog. */
export const MATH_TEMPLATES: MathTemplate[] = [
  {
    key: 'quadratic',
    name: 'Quadratic',
    expression: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  },
  {
    key: 'pythagoras',
    name: 'Pythagoras',
    expression: 'a^2 + b^2 = c^2',
  },
  {
    key: 'sum',
    name: 'Sum',
    expression: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
  },
  {
    key: 'integral',
    name: 'Integral',
    expression: '\\int_{a}^{b} f(x)\\,dx',
  },
  {
    key: 'limit',
    name: 'Limit',
    expression: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
  },
  {
    key: 'euler',
    name: 'Euler',
    expression: 'e^{i\\pi} + 1 = 0',
  },
];
