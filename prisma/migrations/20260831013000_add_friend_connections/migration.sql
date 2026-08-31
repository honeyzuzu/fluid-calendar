CREATE TABLE "FriendConnection" (
    "id" TEXT NOT NULL,
    "pairKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requesterVisibility" TEXT NOT NULL DEFAULT 'BUSY_ONLY',
    "addresseeVisibility" TEXT NOT NULL DEFAULT 'BUSY_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,

    CONSTRAINT "FriendConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FriendConnection_pairKey_key" ON "FriendConnection"("pairKey");
CREATE INDEX "FriendConnection_requesterId_status_idx" ON "FriendConnection"("requesterId", "status");
CREATE INDEX "FriendConnection_addresseeId_status_idx" ON "FriendConnection"("addresseeId", "status");

ALTER TABLE "FriendConnection" ADD CONSTRAINT "FriendConnection_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FriendConnection" ADD CONSTRAINT "FriendConnection_addresseeId_fkey"
FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
