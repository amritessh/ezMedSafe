-- CreateEnum
CREATE TYPE "PrescriptionType" AS ENUM ('EXISTING', 'NEW');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "api_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" UUID NOT NULL,
    "rx_norm_id" TEXT,
    "name" TEXT NOT NULL,
    "drug_class" TEXT,
    "search_terms" TEXT[],

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL,
    "age_group" TEXT,
    "renal_status" BOOLEAN,
    "hepatic_status" BOOLEAN,
    "cardiac_status" BOOLEAN,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "medication_id" UUID NOT NULL,
    "type" "PrescriptionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_alerts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "alert_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_api_key_key" ON "User"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "medications_rx_norm_id_key" ON "medications"("rx_norm_id");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_alerts" ADD CONSTRAINT "interaction_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_alerts" ADD CONSTRAINT "interaction_alerts_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_alerts" ADD CONSTRAINT "interaction_alerts_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
