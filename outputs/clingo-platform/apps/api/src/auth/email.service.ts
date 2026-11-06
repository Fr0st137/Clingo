import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport } from "nodemailer";

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}
  async activation(email: string, code: string) {
    const host = this.config.get<string>("SMTP_HOST"), from = this.config.get<string>("MAIL_FROM");
    if (!host || !from) throw new ServiceUnavailableException("Wysyłka wiadomości jest chwilowo niedostępna. Spróbuj ponownie później.");
    const local = ["localhost", "127.0.0.1", "::1"].includes(host);
    const transport = createTransport({ host, port: Number(this.config.get("SMTP_PORT", "587")), secure: this.config.get("SMTP_SECURE", "false") === "true",
      requireTLS: !local, auth: this.config.get("SMTP_USER") ? { user: this.config.get<string>("SMTP_USER"), pass: this.config.get<string>("SMTP_PASSWORD") } : undefined,
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true });
    try {
      const result = await transport.sendMail({ from, to: email, subject: "Potwierdź adres e-mail — Clingo",
        text: `Twój kod aktywacyjny Clingo: ${code}\n\nKod jest ważny przez 10 minut. Jeśli nie zakładasz konta Clingo, zignoruj tę wiadomość.`,
        html: `<h1>Aktywuj konto Clingo</h1><p>Twój kod aktywacyjny:</p><p style="font-size:32px;letter-spacing:8px"><strong>${code}</strong></p><p>Kod jest ważny przez 10 minut.</p><p>Jeśli nie zakładasz konta Clingo, zignoruj tę wiadomość.</p>` });
      if (!result.accepted?.length || result.rejected?.length) throw Error("Delivery rejected");
    } catch { throw new ServiceUnavailableException("Nie udało się wysłać kodu. Spróbuj ponownie później."); }
    finally { transport.close(); }
  }
}
