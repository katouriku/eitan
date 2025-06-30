-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerKana" TEXT,
    "customerEmail" TEXT NOT NULL,
    "couponCode" TEXT,
    "couponDiscount" INTEGER,
    "price" INTEGER NOT NULL,
    "paymentIntentId" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_date_key" ON "Booking"("date");
