# Guía de Despliegue Manual en Akamai Linode

Sigue los siguientes 4 comandos exactos desde tu terminal de Windows para construir, exportar, subir y activar el contenedor en el servidor de producción:

### 1. Construcción de la Imagen
Compila la imagen Docker del ERP inmobiliario localmente:
```bash
docker build -t propio-erp:latest .
```

### 2. Exportación de la Imagen
Guarda la imagen compilada en un archivo empaquetado `.tar`:
```bash
docker save -o propio-erp.tar propio-erp:latest
```

### 3. Subida del Archivo al Servidor
Transfiere el archivo tar al directorio `/var/www/` del servidor VPS usando SCP:
```bash
scp propio-erp.tar root@172.233.14.148:/var/www/
```

### 4. Activación e Inicio del Contenedor (vía SSH)
Conéctate por SSH al servidor y ejecuta los siguientes comandos para cargar el contenedor y levantarlo manteniendo la persistencia de `db.json`:
```bash
ssh root@172.233.14.148
# Dentro del servidor VPS:
docker load -i /var/www/propio-erp.tar
docker run -d --name propio-erp-prod -p 3000:3000 -v /var/www/db.json:/app/db.json --restart always propio-erp:latest
```
