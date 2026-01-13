import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
});

const lintConfig =  [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".vscode/**",
      "public/**/*.min.js",
      "temp.*"
    ],
  },

  // {
  //   files: ["**/*.{js,jsx,mjs}"],
  //   ...js.configs.recommended,
  //   rules: {
  //     "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
  //     "no-console": "warn", 
  //     "no-debugger": "error",
  //     "prefer-const": "warn", 
  //     "no-var": "warn",
  //     "eqeqeq": "error"
  //   }
  // },

  ...tseslint.configs.strictTypeChecked.map(config => ({
    ...config,
    files: ["**/*.{ts,tsx,mts}"],
    ignores: ["eslint.config.mts"],
  })),

  ...tseslint.configs.stylisticTypeChecked.map(config => ({
    ...config,
    files: ["**/*.{ts,tsx,mts}"],
    ignores: ["eslint.config.mts"],
  })),

  {
    // files: ["**/*.{js,jsx,ts,tsx,mjs,mts}"],
    files: ["**/*.{ts,tsx,mts}"],
    plugins: {
      unicorn: unicorn,
    },
    rules: {
      ...unicorn.configs.recommended.rules,
      "unicorn/filename-case": "warn",
      "unicorn/no-null": "warn", 
      "unicorn/prevent-abbreviations": "warn",
      "unicorn/no-array-for-each": "warn", 
      "unicorn/prefer-spread": "warn",
      "unicorn/no-process-exit": "warn", 
      "unicorn/prefer-node-protocol": "warn", 
      "unicorn/no-console-spaces": "warn", 
      "unicorn/text-encoding-identifier-case": "warn", 
      "unicorn/prefer-top-level-await": "warn", 
    }
  },

  // rules for cognitive complexity
  {
    // files: ["**/*.{js,jsx,ts,tsx,mjs,mts}"],
    files: ["**/*.{ts,tsx,mts}"],
    plugins: {
      sonarjs: sonarjs,
    },
    rules: {
      ...sonarjs.configs.recommended.rules,
      "sonarjs/cognitive-complexity": ["warn", 50], 
      "sonarjs/no-commented-code": "warn", 
      "sonarjs/todo-tag": "warn", 
      "sonarjs/os-command": "error", 
    }
  },

  // security rules
  {
    // files: ["**/*.{js,jsx,ts,tsx,mjs,mts}"],
    files: ["**/*.{ts,tsx,mts}"],
    plugins: {
      security: security,
    },
    rules: {
      "security/detect-object-injection": "error",
      "security/detect-eval-with-expression": "error", 
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-new-buffer": "error",
    }
  },

  {
    // files: ["**/*.{js,jsx,ts,tsx,mjs,mts}"],
    files: ["**/*.{ts,tsx,mts}"],
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
        node: true,
      },
    },
    rules: {
      "import/no-cycle": "error",
      "import/no-self-import": "error", 
      "import/no-unresolved": "error",
      "import/no-duplicates": "error",
      "import/first": "error",
      "import/newline-after-import": "warn",
      "import/order": ["error", {
        "groups": [
          "builtin",
          "external", 
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }],
    }
  },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    files: ["**/*.{ts,tsx,mts}"],
    ignores: ["eslint.config.mts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "warn", 
      "@typescript-eslint/explicit-module-boundary-types": "warn", 
      "@typescript-eslint/prefer-readonly-parameter-types": "warn",
      "@typescript-eslint/array-type": ["warn", { "default": "array-simple" }], 
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/method-signature-style": ["warn", "property"], 
      "@typescript-eslint/no-confusing-void-expression": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/prefer-enum-initializers": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // file size and complexity limits
      "max-lines": ["warn", { "max": 500, "skipBlankLines": true, "skipComments": true }],
      "max-lines-per-function": ["warn", { "max": 50, "skipBlankLines": true, "skipComments": true }],
      "max-params": ["warn", 4],
      "max-depth": ["warn", 4],
      "complexity": ["warn", 10],
    }
  },

  // React safety rules
  {
    // files: ["**/*.{jsx,tsx}"],
    files: ["**/*.{tsx}"],
    rules: {
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error", 
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",
      "react/no-deprecated": "error",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-is-mounted": "error",
      "react/no-render-return-value": "error",
      "react/no-string-refs": "error",
      "react/no-unescaped-entities": "warn",
      "react/no-unknown-property": "error",
      "react/no-unsafe": "error",
      "react/require-render-return": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // performance rules
      "react/jsx-no-bind": "warn",
      "react/jsx-no-constructed-context-values": "warn"
    }
  },

  // accessibility rules
  {
    // files: ["**/*.{jsx,tsx}"],
    files: ["**/*.{tsx}"],
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/autocomplete-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/iframe-has-title": "warn",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/media-has-caption": "warn",
      "jsx-a11y/mouse-events-have-key-events": "warn",
      "jsx-a11y/no-access-key": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-distracting-elements": "warn",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "warn",
    }
  }
];

export default lintConfig;