module.exports = {
    extends: ["eslint:recommended", "plugin:tailwindcss/recommended"],
    plugins: ["tailwindcss"],
    rules: {
      "tailwindcss/no-custom-classname": "off"
  },
};
