import { defineConfig } from 'vitest/config';

// Pruebas unitarias (PC 7): reglas de negocio puras, sin base de datos ni navegador
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: [
        'server/adjustmentRules.js',
        'server/passwords.js',
        'src/models/**/*.js',
        'src/utils/**/*.js'
      ],
      // StorageModel y UserModel no tienen lógica de negocio del caso de uso HU-004
      exclude: ['src/models/StorageModel.js', 'src/models/UserModel.js'],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'pruebas/cobertura',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
});
