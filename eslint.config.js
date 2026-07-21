import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // These files belong to the preserved bag-builder prototype and are not part
  // of the new production app. Remove the exclusions when legacy leaves src/.
  globalIgnores([
    'dist',
    'tmp',
    'src/components/CombatScreen.tsx',
    'src/components/DieCard.tsx',
    'src/components/DraftScreen.tsx',
    'src/components/ShopScreen.tsx',
    'src/store/gameStore.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/components/EnemySprite.tsx'],
    rules: {
      // This retained animation adapter intentionally maps versioned animation
      // props to its local sprite mode in effects.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
