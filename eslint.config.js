// ESLint flat config
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierPlugin from "eslint-plugin-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["node_modules", "dist", "build", "**/*.d.ts"],
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh, "prettier": prettierPlugin },
    rules: {
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "max-len": ["error", { "code": 100 }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "warn",
      "prettier/prettier": "error"
    }
  }
);
