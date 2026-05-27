const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'inicio sesion', 'index.html');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

function findTerm(term) {
    console.log(`=== Buscando "${term}" ===`);
    lines.forEach((line, index) => {
        if (line.includes(term)) {
            console.log(`${index + 1}: ${line.trim()}`);
        }
    });
}

findTerm('const componentData');
findTerm('scene.gltf');
findTerm('mostrarModal3D');
findTerm('document.getElementById(\'procesador\')');
findTerm('const selects =');
findTerm('tablaEnsamblesBody');
