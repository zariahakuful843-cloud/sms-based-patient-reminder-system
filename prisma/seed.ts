import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@clinic.gh" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@clinic.gh",
      passwordHash,
      role: "ADMIN",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "nurse@clinic.gh" },
    update: {},
    create: {
      name: "Nurse Akua",
      email: "nurse@clinic.gh",
      passwordHash: await bcrypt.hash("staff123", 12),
      role: "STAFF",
    },
  });

  const settings = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      reminderHoursBefore: 24,
      reminderEnabled: true,
      facilityName: "Korle Bu Teaching Hospital",
    },
  });

  const template = await prisma.messageTemplate.upsert({
    where: { name: "appointment_reminder" },
    update: {},
    create: {
      name: "appointment_reminder",
      content:
        "Hello {patient_name}, this is a reminder of your appointment at {facility} on {date} at {time}. Please arrive 15 minutes early.",
    },
  });

  const patient1 = await prisma.patient.upsert({
    where: { id: "seed-patient-1" },
    update: {},
    create: {
      id: "seed-patient-1",
      name: "Kwame Asante",
      phoneNumber: "+233241234567",
      gender: "Male",
      dateOfBirth: new Date("1985-03-15"),
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { id: "seed-patient-2" },
    update: {},
    create: {
      id: "seed-patient-2",
      name: "Ama Mensah",
      phoneNumber: "+233501234567",
      gender: "Female",
      dateOfBirth: new Date("1992-07-20"),
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.upsert({
    where: { id: "seed-appointment-1" },
    update: {},
    create: {
      id: "seed-appointment-1",
      patientId: patient1.id,
      appointmentDate: tomorrow,
      type: "General Checkup",
      status: "SCHEDULED",
    },
  });

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 30, 0, 0);

  await prisma.appointment.upsert({
    where: { id: "seed-appointment-2" },
    update: {},
    create: {
      id: "seed-appointment-2",
      patientId: patient2.id,
      appointmentDate: nextWeek,
      type: "Follow-up Visit",
      status: "SCHEDULED",
    },
  });

  console.log("Seeded:", { admin: admin.email, staff: staff.email, settings: settings.id, template: template.name });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
