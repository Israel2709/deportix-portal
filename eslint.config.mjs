import next from 'eslint-config-next';

const eslintConfig = [
  { ignores: ['node_modules/**', '.next/**', 'coverage/**'] },
  ...next,
];

export default eslintConfig;
