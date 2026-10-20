// Arranque local de la API (npm run server). En Vercel se usa api/index.js.
import app from './app.js';
import { PORT, dbConfig } from './config.js';

app.listen(PORT, () => {
  console.log(`🚀 Servidor API de Base de Datos ejecutándose en http://localhost:${PORT}`);
  console.log(`🔗 Base de datos: ${dbConfig.database} en ${dbConfig.server}:${dbConfig.port}`);
});
