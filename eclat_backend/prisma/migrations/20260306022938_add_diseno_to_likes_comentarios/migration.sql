-- DropForeignKey
ALTER TABLE "Comentario" DROP CONSTRAINT "Comentario_id_post_fkey";

-- DropForeignKey
ALTER TABLE "Like_post" DROP CONSTRAINT "Like_post_id_post_fkey";

-- AlterTable
ALTER TABLE "Comentario" ADD COLUMN     "id_diseño" INTEGER,
ALTER COLUMN "id_post" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Like_post" ADD COLUMN     "id_diseño" INTEGER,
ALTER COLUMN "id_post" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_id_post_fkey" FOREIGN KEY ("id_post") REFERENCES "Post"("id_post") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_id_diseño_fkey" FOREIGN KEY ("id_diseño") REFERENCES "Diseño"("id_diseño") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like_post" ADD CONSTRAINT "Like_post_id_post_fkey" FOREIGN KEY ("id_post") REFERENCES "Post"("id_post") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like_post" ADD CONSTRAINT "Like_post_id_diseño_fkey" FOREIGN KEY ("id_diseño") REFERENCES "Diseño"("id_diseño") ON DELETE SET NULL ON UPDATE CASCADE;
