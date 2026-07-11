SIMULADOR ACTUALIZADO - CORRECCIÓN DE CACHÉ
Versión: 441.2.0

Cambios:
- app.js, questions.js y styles.css usan versionado.
- Se eliminan automáticamente cachés anteriores.
- Se desregistran service workers antiguos.
- La app se recarga una sola vez al detectar una nueva versión.
- Ya no debería ser necesario usar Ctrl+F5.

SUBIDA:
git init
git add .
git commit -m "Correccion definitiva de cache version 441.2.0"
git branch -M main
git remote add origin https://github.com/Utransito/complexivo-software-trainer-pablo.git
git push -u origin main --force
