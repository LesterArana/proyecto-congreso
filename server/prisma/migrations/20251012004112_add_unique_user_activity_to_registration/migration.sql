/*
  Warnings:

  - A unique constraint covering the columns `[userId,activityId]` on the table `registration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Registration_user_activity_unique` ON `registration`(`userId`, `activityId`);
