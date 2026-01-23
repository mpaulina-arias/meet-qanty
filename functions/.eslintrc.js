module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parserOptions: {
    sourceType: "module",
  },
  ignorePatterns: ["lib/**/*", "generated/**/*"],
  rules: {
    // 🔴 QUITAR REGLAS PROBLEMÁTICAS
    "linebreak-style": "off",
    "object-curly-spacing": "off",
    "require-jsdoc": "off",

    // 🟡 Ajustes razonables
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",

    // 🟢 Estilo básico
    quotes: ["error", "double"],
    indent: ["error", 2],
  },
};
