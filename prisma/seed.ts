import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // Users
  const adminPw = await bcrypt.hash("admin123", 12);
  const receptionistPw = await bcrypt.hash("recept123", 12);
  const doctorPw = await bcrypt.hash("doctor123", 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@ridgehospital.gh",
      password: adminPw,
      role: "ADMIN",
      name: "System Administrator",
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { username: "receptionist" },
    update: {},
    create: {
      username: "receptionist",
      email: "reception@ridgehospital.gh",
      password: receptionistPw,
      role: "RECEPTIONIST",
      name: "Abena Mensah",
    },
  });

  const doctor = await prisma.user.upsert({
    where: { username: "doctor" },
    update: {},
    create: {
      username: "doctor",
      email: "doctor@ridgehospital.gh",
      password: doctorPw,
      role: "DOCTOR",
      name: "Dr. Kofi Boateng",
    },
  });

  console.log(`Created users: ${admin.username}, ${receptionist.username}, ${doctor.username}`);

  // Patients
  const patients = await Promise.all([
    prisma.patient.upsert({
      where: { id: 1 },
      update: {},
      create: {
        fullName: "Kwame Asante",
        gender: "Male",
        phoneNumber: "0244123456",
        address: "12 Ring Road Central, Accra",
        dateOfBirth: new Date("1985-03-15"),
      },
    }),
    prisma.patient.upsert({
      where: { id: 2 },
      update: {},
      create: {
        fullName: "Ama Owusu",
        gender: "Female",
        phoneNumber: "0551234567",
        address: "7 Cantonments Road, Accra",
        dateOfBirth: new Date("1992-07-22"),
      },
    }),
    prisma.patient.upsert({
      where: { id: 3 },
      update: {},
      create: {
        fullName: "Kofi Adjei",
        gender: "Male",
        phoneNumber: "0201234567",
        address: "45 Labadi Beach Road, Accra",
        dateOfBirth: new Date("1978-11-08"),
      },
    }),
    prisma.patient.upsert({
      where: { id: 4 },
      update: {},
      create: {
        fullName: "Abena Darko",
        gender: "Female",
        phoneNumber: "0271234567",
        address: "23 Tema Station, Tema",
        dateOfBirth: new Date("2001-04-30"),
      },
    }),
    prisma.patient.upsert({
      where: { id: 5 },
      update: {},
      create: {
        fullName: "Yaw Boateng",
        gender: "Male",
        phoneNumber: "0241234567",
        address: "8 High Street, Kumasi",
        dateOfBirth: new Date("1990-09-12"),
      },
    }),
    prisma.patient.upsert({
      where: { id: 6 },
      update: {},
      create: {
        fullName: "Akosua Antwi",
        gender: "Female",
        phoneNumber: "0591234567",
        address: "15 Bantama Road, Kumasi",
        dateOfBirth: new Date("1988-12-25"),
      },
    }),
  ]);

  console.log(`Created ${patients.length} patients`);

  // Appointments (mix of past and future)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  tomorrow.setHours(10, 0, 0, 0);
  nextWeek.setHours(14, 30, 0, 0);
  yesterday.setHours(9, 0, 0, 0);
  lastWeek.setHours(11, 0, 0, 0);

  const twodays = new Date(now);
  twodays.setDate(twodays.getDate() + 2);
  twodays.setHours(15, 0, 0, 0);

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorName: "Dr. Kofi Boateng",
        appointmentDate: tomorrow,
        status: "SCHEDULED",
        reminderSent: false,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorName: "Dr. Mensah",
        appointmentDate: nextWeek,
        status: "SCHEDULED",
        reminderSent: false,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorName: "Dr. Kofi Boateng",
        appointmentDate: yesterday,
        status: "COMPLETED",
        reminderSent: true,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        doctorName: "Dr. Asare",
        appointmentDate: lastWeek,
        status: "MISSED",
        reminderSent: true,
        notes: "Patient did not show up. Follow up required.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        doctorName: "Dr. Mensah",
        appointmentDate: twodays,
        status: "SCHEDULED",
        reminderSent: false,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[5].id,
        doctorName: "Dr. Kofi Boateng",
        appointmentDate: lastWeek,
        status: "COMPLETED",
        reminderSent: true,
      },
    }),
  ]);

  console.log(`Created ${appointments.length} appointments`);

  // SMS Logs
  const smsLogs = await Promise.all([
    prisma.sMSLog.create({
      data: {
        patientId: patients[2].id,
        phoneNumber: patients[2].phoneNumber,
        message: `Dear Kofi, this is a reminder of your appointment with Dr. Kofi Boateng at Ridge Hospital on ${yesterday.toDateString()} at 09:00 AM. Please arrive 15 minutes early.`,
        messageType: "APPOINTMENT",
        deliveryStatus: "SENT",
      },
    }),
    prisma.sMSLog.create({
      data: {
        patientId: patients[3].id,
        phoneNumber: patients[3].phoneNumber,
        message: `Dear Abena, this is a reminder of your appointment with Dr. Asare at Ridge Hospital. Please contact us to reschedule.`,
        messageType: "APPOINTMENT",
        deliveryStatus: "SENT",
      },
    }),
    prisma.sMSLog.create({
      data: {
        patientId: patients[5].id,
        phoneNumber: patients[5].phoneNumber,
        message: `Dear Akosua, this is a reminder of your appointment with Dr. Kofi Boateng at Ridge Hospital. Please arrive 15 minutes early.`,
        messageType: "APPOINTMENT",
        deliveryStatus: "SENT",
      },
    }),
  ]);

  console.log(`Created ${smsLogs.length} SMS logs`);
  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
