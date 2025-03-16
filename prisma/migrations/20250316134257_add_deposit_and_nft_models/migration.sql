-- CreateTable
CREATE TABLE "deposits" (
    "id" SERIAL NOT NULL,
    "unique_key" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "wallet_address" VARCHAR(255) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "signature" VARCHAR(255) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfts" (
    "id" SERIAL NOT NULL,
    "unique_key" VARCHAR(255) NOT NULL,
    "mint_address" VARCHAR(255) NOT NULL,
    "metadata" TEXT NOT NULL,
    "product_id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "wallet_address" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposits_unique_key_key" ON "deposits"("unique_key");

-- CreateIndex
CREATE INDEX "deposits_user_id_idx" ON "deposits"("user_id");

-- CreateIndex
CREATE INDEX "deposits_wallet_address_idx" ON "deposits"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "nfts_unique_key_key" ON "nfts"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "nfts_mint_address_key" ON "nfts"("mint_address");

-- CreateIndex
CREATE INDEX "nfts_user_id_idx" ON "nfts"("user_id");

-- CreateIndex
CREATE INDEX "nfts_wallet_address_idx" ON "nfts"("wallet_address");

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
