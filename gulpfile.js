import gulp from 'gulp';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import browserSync from 'browser-sync';
import fs from 'fs-extra';
import path from 'path';

// Crear instancia de BrowserSync
const browserSyncInstance = browserSync.create();

// Rutas de los archivos
const paths = {
    scripts: ['src/js/*.js', '!src/assets/**/*.js'],
    styles: ['src/css/*.css', '!src/assets/**/*.css'],
    html: 'src/templates/*.html',
    images: 'src/assets/**/*.{png,jpg,jpeg,svg,gif}',
    fonts: 'src/assets/**/*.{woff,woff2,ttf,eot}',
    data: 'src/data.json',
    dist: {
        js: 'dist/js',
        css: 'dist/css',
        html: 'dist/',
        images: 'dist/assets/',
        fonts: 'dist/assets/fonts/',
        data: 'dist/data/'
    }
};

// Estructura del scaffolding
const scaffolding = {
    'src/js': 'main.js',
    'src/css': 'styles.css',
    'src/templates': 'index.html',
    'src/assets': null,
    'src/assets/img': null,
    'src/assets/icons': null,
    'src/assets/fonts': null,
    'src/templates': 'template.html',
    'src/templates/components': null
};

// Archivos de ejemplo para componentes
const components = {
    'src/templates/components/header.html': '<header><h1>Bienvenido a Nuestro Sitio</h1></header>',
    'src/templates/components/footer.html': '<footer><p>© 2024 Mi Sitio Web. Todos los derechos reservados.</p></footer>',
};

// Tarea para crear el scaffolding
gulp.task('scaffold', async () => {
    for (const [dir, file] of Object.entries(scaffolding)) {
        if (!fs.existsSync(dir)) {
            await fs.mkdirp(dir);
            console.log(`Directorio creado: ${dir}`);
        }
        if (file && !fs.existsSync(`${dir}/${file}`)) {
            const content = file === 'index.html' ? '<!-- index.html generado automáticamente -->' :
                file === 'template.html' ? '<!-- template.html generado automáticamente -->' :
                `/* ${file} creado automáticamente */`;
            await fs.writeFile(`${dir}/${file}`, content);
            console.log(`Archivo creado: ${dir}/${file}`);
        }
    }

    // Crear archivos de componentes
    for (const [filePath, content] of Object.entries(components)) {
        if (!fs.existsSync(filePath)) {
            await fs.writeFile(filePath, content);
            console.log(`Componente creado: ${filePath}`);
        }
    }
});

// Función para cargar un componente HTML
function loadComponent(componentName) {
    const componentPath = path.join('src/templates/components', `${componentName}.html`);
    if (fs.existsSync(componentPath)) {
        return fs.readFileSync(componentPath, 'utf8');
    } else {
        console.warn(`Componente no encontrado: ${componentName}`);
        return `<!-- Componente ${componentName} no encontrado -->`;
    }
}

function renderTemplate(templateString, data) {
    return templateString.replace(/{{#if\s+([^{}]+)}}([\s\S]*?){{\/if}}|{{#([^{}]+)}}([\s\S]*?){{\/\1}}|{{>([^{}]+)}}|{{([^{}]+)}}/g, (match, condition, ifContent, loopKey, loopContent, componentKey, variableKey) => {

        if (condition && ifContent) {
            // Bloque if
            const conditionValue = condition.trim().split('.').reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : false, data);
            return conditionValue ? renderTemplate(ifContent, data) : '';

        } else if (componentKey) {
            // Inserta el componente
            return loadComponent(componentKey.trim());

        } else if (variableKey) {
            // Reemplazo de variable simple con parámetros
            const [varName, ...params] = variableKey.trim().split(' ');
            const keys = varName.split('.');
            let value = keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : match, data);

            const paramValues = params.map(param => {
                const paramKeys = param.split('.');
                const paramValue = paramKeys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, data);
                return paramValue !== null ? paramValue : param;
            });

            return paramValues.length ? `${value} - ${paramValues.join(' ')}` : value;

        } else if (loopKey && loopContent) {
            // Manejo de bucles
            const loopData = data[loopKey.trim()];
            if (Array.isArray(loopData)) {
                return loopData.map(item => renderTemplate(loopContent, item)).join('');
            }
        }

        return match;
    });
}

// Tarea para generar HTML desde plantillas
gulp.task('generate-html', () => {
    console.log('Generando HTML...'); // Agrega esta línea para verificar
    const jsonData = JSON.parse(fs.readFileSync(paths.data, 'utf8')); // Lee el archivo data.json desde src

    return gulp.src(paths.html)
        .on('data', (file) => {
            const templateContent = file.contents.toString();
            const renderedHtml = renderTemplate(templateContent, jsonData);
            const outputFileName = file.relative; // Mantiene el mismo nombre
            fs.writeFileSync(`${paths.dist.html}/${outputFileName}`, renderedHtml); // Escribe el HTML renderizado
            console.log(`Archivo generado: ${paths.dist.html}/${outputFileName}`);
        })
        .on('end', () => {
            browserSync.reload(); // Recarga el navegador
        });
});

// Tarea para concatenar y minificar JS
gulp.task('scripts', () => {
    return gulp.src(paths.scripts)
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist.js))
        .pipe(browserSync.stream());
});

// Tarea para concatenar y minificar CSS
gulp.task('styles', () => {
    return gulp.src(paths.styles)
        .pipe(concat('styles.min.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest(paths.dist.css))
        .pipe(browserSync.stream());
});

// Tarea para copiar imágenes
gulp.task('copy-images', () => {
    return gulp.src('src/assets/**/*.{png,jpg,jpeg,svg,gif}')
        .pipe(gulp.dest('dist/assets'))
        .pipe(browserSync.stream());
});

// Tarea para copiar fuentes
gulp.task('copy-fonts', () => {
    return gulp.src('src/assets/**/*.{woff,woff2,ttf,eot}')
        .pipe(gulp.dest('dist/assets'))
        .pipe(browserSync.stream());
});


// Tarea para iniciar BrowserSync y observar cambios
gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: 'dist', // Sirve `dist` como base principal
        },
        serveStatic: [
            { route: '/assets', dir: 'src/assets' } // Exponiendo `src/assets`
        ],
        notify: false,
        open: true
    });

    gulp.watch(paths.scripts, gulp.series('scripts'));
    gulp.watch(paths.styles, gulp.series('styles'));
    gulp.watch(paths.html, gulp.series('generate-html'));
    gulp.watch('src/templates/components/**/*.html', gulp.series('generate-html')); // Observa cambios en componentes
    gulp.watch(paths.images, gulp.series('copy-images'));
});

// Tarea por defecto
//gulp.task('default', gulp.series('scaffold', 'scripts', 'styles', 'copy-images', 'copy-data', 'generate-html', 'serve'));
gulp.task('default', gulp.series('scaffold', 'scripts', 'styles', 'copy-images', 'copy-fonts', 'generate-html', 'serve'));