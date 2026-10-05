# Los Troncos de Repil - Sistema de Gestión de Reservas

Este proyecto es una **Aplicación Web Progresiva (PWA)** diseñada a medida para el centro turístico **"Los Troncos de Repil"**, ubicado en el sector rural de Fresia, Región de Los Lagos.

El sistema centraliza y automatiza la administración de reservas para sus tres servicios principales:

- Servicio gastronómico.
- Arriendo de cabañas.
- Arriendo de espacios de camping.

Una de las características clave de este sistema es su arquitectura **Offline-First**, la cual permite a los dueños registrar reservas de manera local en sus dispositivos incluso durante cortes de internet, sincronizando los datos automáticamente con la nube una vez que se restablece la conexión.

## 🛠️ Tecnologías Usadas y Justificación

### Vue 3 + Vite

Se eligió este framework por su reactividad y excelente rendimiento. Vite proporciona un entorno de desarrollo extremadamente rápido, lo que agiliza la creación de componentes modulares.

### TypeScript

Añade tipado estático al proyecto, lo que ayuda a detectar errores durante el desarrollo y mejora la autocompletación, especialmente útil al interactuar con las tablas de la base de datos.

### Tailwind CSS (v3)

Permite construir interfaces a medida de forma rápida sin salir del HTML. Es fundamental para replicar con exactitud la paleta de colores corporativa, basada en tonos tierra y verde, y los requerimientos de alta legibilidad para los administradores.

### Vite PWA Plugin

Esta herramienta es el núcleo de la solución offline. Configura los **Service Workers** necesarios para que la aplicación siga funcionando sin internet, almacenando la interfaz en caché.

### Pinia

El gestor de estado oficial de Vue. Se utiliza para manejar:

- El estado global de las reservas.
- La sesión de los usuarios.
- La cola de sincronización cuando el sistema opera sin conexión.

### Supabase

Backend as a Service (BaaS) basado en PostgreSQL. Proporciona de forma rápida:

- Base de datos relacional.
- Autenticación de los administradores.
- Capacidades en tiempo real.
- Sincronización en la nube.

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura modular basada en componentes:

```text
sistema-gestion-LTR/
├── public/             # Iconos de la PWA y archivos estáticos
├── src/
│   ├── assets/         # Imágenes, fuentes (Atkinson Hyperlegible) y estilos globales
│   ├── components/     # Componentes reutilizables (Botones, Calendarios, Encabezados)
│   │   └── UI/         # Elementos de interfaz genéricos
│   ├── lib/            # Configuración de clientes externos (ej. supabase.ts)
│   ├── stores/         # Archivos de Pinia para el estado global (auth, reservas, offline)
│   ├── views/          # Vistas completas de la aplicación
│   │   ├── admin/      # Vistas exclusivas para los dueños (Dashboard, Solicitudes)
│   │   └── client/     # Vistas públicas para que los clientes reserven
│   ├── App.vue         # Componente raíz
│   └── main.ts         # Punto de entrada de la aplicación
├── .env                # Variables de entorno (No se sube a GitHub)
├── tailwind.config.js  # Configuración de colores y utilidades de Tailwind
└── vite.config.ts      # Configuración del empaquetador y PWA
```


## 🚀 Cómo iniciar el proyecto en otra computadora

### 1. Clonar el repositorio

Abre una terminal y ejecuta:

```bash
git clone https://github.com/bwnjawn/sistema-gestion-LTR.git
```

### 2. Entrar a la carpeta del proyecto

```bash
cd sistema-gestion-LTR
```

### 3. Instalar las dependencias

Asegúrate de tener instalado **Node.js**. Luego instala los paquetes necesarios de NPM:

```bash
npm install
```

### 4. Configurar las variables de entorno

Crea un archivo llamado `.env` en la raíz del proyecto, al mismo nivel que el archivo `package.json`.

Añade las credenciales de Supabase:

```env
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase_aqui
```

### 5. Iniciar el servidor de desarrollo

Levanta la aplicación para verla en tu navegador:

```bash
npm run dev
```

La terminal te indicará una ruta local, generalmente:

```text
http://localhost:5173/
```

Abre esa dirección en tu navegador para acceder al sistema en funcionamiento.
