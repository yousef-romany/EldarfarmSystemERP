-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "avatar" TEXT
);

-- CreateTable
CREATE TABLE "Barn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "LivestockType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Livestock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tagId" TEXT,
    "isBatch" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER,
    "livestockTypeId" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "weight" DECIMAL NOT NULL,
    "age" INTEGER NOT NULL,
    "cost" DECIMAL,
    "status" TEXT NOT NULL,
    "barnId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Livestock_livestockTypeId_fkey" FOREIGN KEY ("livestockTypeId") REFERENCES "LivestockType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Livestock_barnId_fkey" FOREIGN KEY ("barnId") REFERENCES "Barn" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "livestockId" TEXT NOT NULL,
    "supplier" TEXT,
    "purchaseDate" DATETIME NOT NULL,
    "totalCost" DECIMAL NOT NULL,
    "amountPaid" DECIMAL NOT NULL,
    "remainingAmount" DECIMAL NOT NULL,
    CONSTRAINT "Purchase_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "livestockId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "saleDate" DATETIME NOT NULL,
    "settlementDate" DATETIME,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pricePerKg" DECIMAL NOT NULL,
    "initialWeight" DECIMAL,
    "finalWeight" DECIMAL,
    "totalPrice" DECIMAL NOT NULL,
    "amountPaid" DECIMAL NOT NULL,
    "remainingAmount" DECIMAL NOT NULL,
    CONSTRAINT "Sale_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorName" TEXT NOT NULL,
    "receiptId" TEXT,
    "date" DATETIME NOT NULL,
    "livestockId" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Vow_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalAmount" DECIMAL NOT NULL
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "purchaseId" TEXT,
    "saleId" TEXT,
    "expenseId" TEXT,
    "contributionId" TEXT,
    CONSTRAINT "Payment_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Barn_name_key" ON "Barn"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LivestockType_name_key" ON "LivestockType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Livestock_tagId_key" ON "Livestock"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_livestockId_key" ON "Purchase"("livestockId");

-- CreateIndex
CREATE UNIQUE INDEX "Vow_livestockId_key" ON "Vow"("livestockId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_name_key" ON "Wallet"("name");
