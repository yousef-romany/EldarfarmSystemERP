-- CreateIndex
CREATE INDEX `Expense_date_idx` ON `Expense`(`date`);

-- CreateIndex
CREATE INDEX `Expense_category_date_idx` ON `Expense`(`category`, `date`);

-- CreateIndex
CREATE INDEX `Livestock_barnId_status_idx` ON `Livestock`(`barnId`, `status`);

-- CreateIndex
CREATE INDEX `Livestock_livestockTypeId_status_idx` ON `Livestock`(`livestockTypeId`, `status`);

-- CreateIndex
CREATE INDEX `Livestock_status_createdAt_idx` ON `Livestock`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Livestock_createdAt_idx` ON `Livestock`(`createdAt`);

-- CreateIndex
CREATE INDEX `Payment_date_idx` ON `Payment`(`date`);

-- CreateIndex
CREATE INDEX `Payment_walletId_date_idx` ON `Payment`(`walletId`, `date`);

-- CreateIndex
CREATE INDEX `Purchase_purchaseDate_idx` ON `Purchase`(`purchaseDate`);

-- CreateIndex
CREATE INDEX `Purchase_status_purchaseDate_idx` ON `Purchase`(`status`, `purchaseDate`);

-- CreateIndex
CREATE INDEX `Sale_saleDate_idx` ON `Sale`(`saleDate`);

-- CreateIndex
CREATE INDEX `Sale_status_saleDate_idx` ON `Sale`(`status`, `saleDate`);

-- CreateIndex
CREATE INDEX `Sale_type_status_idx` ON `Sale`(`type`, `status`);
