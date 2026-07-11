import { sendSMS } from "./lib/sms";

async function main() {
  const payload = {
    to: "0241865895",
    message: "Dear Mary, this is a reminder that you have an appointment on 27 Jun 2026 at 04:41 pm. Please arrive 15 minutes early.",
  };
  
  console.log("API Key configured:", Boolean(process.env.ARKESEL_API_KEY));
  console.log("Using SMS URL:", process.env.ARKESEL_SMS_URL);

  console.log("Sending SMS...");
  const res = await sendSMS(payload);
  console.log("RESULT:", res);
}

main().catch(console.error);
