import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEPARTMENTS: { name: string; code: string; description: string }[] = [
  { name: "General OPD", code: "OPD", description: "General outpatient department" },
  { name: "Emergency", code: "EMG", description: "Emergency and casualty" },
  { name: "Pediatrics", code: "PED", description: "Child and infant care" },
  { name: "Maternity", code: "MAT", description: "Maternity and delivery" },
  { name: "Antenatal Clinic", code: "ANC", description: "Antenatal and prenatal care" },
  { name: "Laboratory", code: "LAB", description: "Diagnostic laboratory services" },
  { name: "Pharmacy", code: "PHM", description: "Pharmacy and dispensing" },
  { name: "Surgical", code: "SUR", description: "Surgical services" },
  { name: "Medical Ward", code: "MED", description: "Inpatient medical ward" },
];

async function main() {
  console.log("Seeding database…");

  // Departments
  const departments: Record<string, { id: number }> = {};
  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description, active: true },
      create: { name: d.name, code: d.code, description: d.description },
    });
    departments[d.code] = dept;
  }
  console.log(`Created ${DEPARTMENTS.length} departments`);

  // Users
  const adminPw = await bcrypt.hash("admin123", 12);
  const receptionistPw = await bcrypt.hash("recept123", 12);
  const doctorPw = await bcrypt.hash("doctor123", 12);
  const nursePw = await bcrypt.hash("nurse123", 12);

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
    update: { departmentId: departments.OPD.id },
    create: {
      username: "doctor",
      email: "doctor@ridgehospital.gh",
      password: doctorPw,
      role: "DOCTOR",
      name: "Dr. Kofi Boateng",
      departmentId: departments.OPD.id,
    },
  });

  const nurse = await prisma.user.upsert({
    where: { username: "nurse" },
    update: { departmentId: departments.PED.id },
    create: {
      username: "nurse",
      email: "nurse@ridgehospital.gh",
      password: nursePw,
      role: "NURSE",
      name: "Efua Sarpong",
      departmentId: departments.PED.id,
    },
  });

  console.log(
    `Created users: ${admin.username}, ${receptionist.username}, ${doctor.username}, ${nurse.username}`
  );

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

  // Today's appointments drive the queue and dashboards.
  const t = (h: number, m: number) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const opd = departments.OPD.id;
  const ped = departments.PED.id;
  const anc = departments.ANC.id;

  const appointments = await Promise.all([
    // Today — General OPD (doctor's department)
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        doctorName: doctor.name,
        departmentId: opd,
        appointmentDate: t(9, 0),
        appointmentType: "Consultation",
        status: "SCHEDULED",
        queueStatus: "WAITING",
        queueNumber: 1,
        reminderSent: true,
      },
    }),
    // Today — OPD, unassigned doctor (doctor can claim)
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        departmentId: opd,
        appointmentDate: t(9, 30),
        appointmentType: "Consultation",
        status: "SCHEDULED",
        queueStatus: "VITALS_COMPLETED",
        queueNumber: 2,
        reminderSent: false,
      },
    }),
    // Today — Pediatrics (nurse's department)
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        departmentId: ped,
        appointmentDate: t(10, 0),
        appointmentType: "Review",
        status: "SCHEDULED",
        queueStatus: "WAITING",
        queueNumber: 3,
        reminderSent: false,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[5].id,
        departmentId: ped,
        appointmentDate: t(10, 30),
        appointmentType: "Vaccination",
        status: "SCHEDULED",
        queueStatus: "WAITING_FOR_DOCTOR",
        queueNumber: 4,
        reminderSent: true,
      },
    }),
    // Future — booked into department, doctor optional
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        departmentId: anc,
        appointmentDate: nextWeek,
        appointmentType: "Antenatal",
        status: "SCHEDULED",
        reminderSent: false,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        doctorName: doctor.name,
        departmentId: opd,
        appointmentDate: tomorrow,
        appointmentType: "Follow-up",
        status: "SCHEDULED",
        reminderSent: false,
      },
    }),
    // Past
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctor.id,
        doctorName: doctor.name,
        departmentId: opd,
        appointmentDate: yesterday,
        status: "COMPLETED",
        queueStatus: "CONSULTATION_COMPLETED",
        reminderSent: true,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        departmentId: anc,
        appointmentDate: lastWeek,
        status: "MISSED",
        reminderSent: true,
        notes: "Patient did not show up. Follow up required.",
      },
    }),
  ]);

  void twodays;
  console.log(`Created ${appointments.length} appointments`);

  // SMS Logs
  const smsLogs = await Promise.all([
    prisma.sMSLog.create({
      data: {
        patientId: patients[2].id,
        patientName: patients[2].fullName,
        phoneNumber: patients[2].phoneNumber,
        message: `Dear Kofi, this is a reminder of your appointment with Dr. Kofi Boateng at Ridge Hospital on ${yesterday.toDateString()} at 09:00 AM. Please arrive 15 minutes early.`,
        reminderType: "APPOINTMENT_REMINDER",
        status: "SENT",
      },
    }),
    prisma.sMSLog.create({
      data: {
        patientId: patients[3].id,
        patientName: patients[3].fullName,
        phoneNumber: patients[3].phoneNumber,
        message: `Dear Abena, this is a reminder of your appointment with Dr. Asare at Ridge Hospital. Please contact us to reschedule.`,
        reminderType: "APPOINTMENT_REMINDER",
        status: "SENT",
      },
    }),
    prisma.sMSLog.create({
      data: {
        patientId: patients[5].id,
        patientName: patients[5].fullName,
        phoneNumber: patients[5].phoneNumber,
        message: `Dear Akosua, this is a reminder of your appointment with Dr. Kofi Boateng at Ridge Hospital. Please arrive 15 minutes early.`,
        reminderType: "APPOINTMENT_REMINDER",
        status: "SENT",
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
