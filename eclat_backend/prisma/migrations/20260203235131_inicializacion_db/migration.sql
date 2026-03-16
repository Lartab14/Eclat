-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "foto_perfil" TEXT,
    "descripcion" TEXT,
    "informacion_adicional" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Diseño" (
    "id_diseño" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_diseño" TEXT,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibilidad" TEXT NOT NULL DEFAULT 'publico',

    CONSTRAINT "Diseño_pkey" PRIMARY KEY ("id_diseño")
);

-- CreateTable
CREATE TABLE "ArchivoDiseño" (
    "id_archivo" SERIAL NOT NULL,
    "id_diseño" INTEGER NOT NULL,
    "tipo_archivo" TEXT,
    "ruta_archivo" TEXT NOT NULL,
    "formato" TEXT,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivoDiseño_pkey" PRIMARY KEY ("id_archivo")
);

-- CreateTable
CREATE TABLE "Post" (
    "id_post" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_diseño" INTEGER,
    "contenido_texto" TEXT,
    "fecha_publicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibilidad" TEXT NOT NULL DEFAULT 'publico',

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id_post")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id_seguir" SERIAL NOT NULL,
    "id_usuario_seguidor" INTEGER NOT NULL,
    "id_usuario_seguido" INTEGER NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id_seguir")
);

-- CreateTable
CREATE TABLE "Save_post" (
    "id_guardado" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_post" INTEGER NOT NULL,

    CONSTRAINT "Save_post_pkey" PRIMARY KEY ("id_guardado")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id_comentario" SERIAL NOT NULL,
    "id_post" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "Like_post" (
    "id_like" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_post" INTEGER NOT NULL,

    CONSTRAINT "Like_post_pkey" PRIMARY KEY ("id_like")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- AddForeignKey
ALTER TABLE "Diseño" ADD CONSTRAINT "Diseño_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoDiseño" ADD CONSTRAINT "ArchivoDiseño_id_diseño_fkey" FOREIGN KEY ("id_diseño") REFERENCES "Diseño"("id_diseño") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_id_diseño_fkey" FOREIGN KEY ("id_diseño") REFERENCES "Diseño"("id_diseño") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_id_usuario_seguidor_fkey" FOREIGN KEY ("id_usuario_seguidor") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_id_usuario_seguido_fkey" FOREIGN KEY ("id_usuario_seguido") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save_post" ADD CONSTRAINT "Save_post_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save_post" ADD CONSTRAINT "Save_post_id_post_fkey" FOREIGN KEY ("id_post") REFERENCES "Post"("id_post") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_id_post_fkey" FOREIGN KEY ("id_post") REFERENCES "Post"("id_post") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like_post" ADD CONSTRAINT "Like_post_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like_post" ADD CONSTRAINT "Like_post_id_post_fkey" FOREIGN KEY ("id_post") REFERENCES "Post"("id_post") ON DELETE RESTRICT ON UPDATE CASCADE;
