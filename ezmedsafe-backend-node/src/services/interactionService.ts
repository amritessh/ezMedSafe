import { MCPEnabledEGAAgent } from '../agents/egaAgent';
import prisma from '../clients/prismaClient';
import { DDIAlert, PatientContextInput, MedicationInput } from '../types';
import crypto from 'crypto';

export class MCPInteractionService {
  private egaAgent: MCPEnabledEGAAgent;

  constructor() {
    this.egaAgent = new MCPEnabledEGAAgent();
  }

  async checkAndPersistInteractions(
    userId: string,
    patientProfileId: string,
    patientContext: PatientContextInput,
    existingMedications: MedicationInput[],
    newMedication: MedicationInput
  ): Promise<DDIAlert[]> {
    const alertsToReturn: DDIAlert[] = [];

    try {
      // 1. Create medication and prescription records
      let newMedicationRecord = await prisma.medication.upsert({
        where: { rx_norm_id: newMedication.rxNormId || '' },
        update: { name: newMedication.name },
        create: { 
          id: crypto.randomUUID(), 
          name: newMedication.name, 
          rx_norm_id: newMedication.rxNormId || null 
        }
      });

      const newPrescription = await prisma.prescription.create({
        data: {
          patientProfileId: patientProfileId,
          medicationId: newMedicationRecord.id,
          type: 'NEW',
        },
      });

      const allMedicationNames = [
        ...existingMedications.map(m => m.name),
        newMedication.name
      ];

      // 2. Generate alert using MCP-enabled agent
      const finalAlert = await this.egaAgent.generateDDIAlert(patientContext, allMedicationNames);
      alertsToReturn.push(finalAlert);

      // 3. Persist alert
      await prisma.interactionAlert.create({
        data: {
          userId: userId,
          patientProfileId: patientProfileId,
          prescriptionId: newPrescription.id,
          alertData: JSON.parse(JSON.stringify(finalAlert)),
        },
      });

      console.log('DDI Alert generated via MCP:', finalAlert);
      return alertsToReturn;

    } catch (error) {
      console.error('Error in MCPInteractionService:', error);
      throw error;
    }
  }

  async cleanup() {
    await this.egaAgent.cleanup();
  }
}