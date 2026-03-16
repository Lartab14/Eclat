# Documentación Backend Eclat
**IMPORTANTE:** Asegurarse de cuando corra los siguientes comandos, estar dentro de la carpeta `eclat_backend`

# Base de datos
Prisma es un ORM que sirve como intermediario entre una Base de datos y un sistema.

### Credenciales

```
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: admin
    POSTGRES_DB: eclat_db
    DATABASE_URL="postgresql://admin:admin@localhost:5432/eclat_db"
```

### 1. Para correr la base de datos

Correr servidor de Base de datos:
IMPORTANTE TONTO: Abrir docker primero!!!

`docker compose up`

Instalar librerias
`npm i`

### 2. Ejecutar migraciones
Crea la base de datos, las tablas, relaciones, etc...

`npx prisma migrate dev --name init`

### 3. Ejecutar raul
`npm run dev` 

## IMPORTANTE!!!

cuando haga cambios en la base de datos seguir estos pasos:

1. Realizar el cambio en el archivo schema.prisma
2. Ejecutar el comando "npx prisma migrate dev" para que se apliquen los cambios en la base de datos

- NOTA: Si necesita resetear la base de datos (PELIGROSO!!!! - Pero si igual lo neceista)
ejecutar npx prisma migrate reset - PELIGROSO!!!
