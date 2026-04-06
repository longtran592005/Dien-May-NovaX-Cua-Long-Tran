import { Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer, { Transporter } from 'nodemailer';

interface SendEmailInput {
  to: string;
  subject: string;
  template: 'otp' | 'password-reset' | 'welcome';
  variables?: Record<string, string | number>;
}

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly fromAddress = process.env.EMAIL_FROM || 'NovaX <no-reply@novax.local>';

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Dev fallback: render and log instead of sending real email.
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  async sendTemplateEmail(input: SendEmailInput) {
    const html = await this.renderTemplate(input.template, input.variables || {});

    const result = await this.transporter.sendMail({
      from: this.fromAddress,
      to: input.to,
      subject: input.subject,
      html
    });

    if ('message' in result && result.message) {
      console.log(`[EMAIL DEV] to=${input.to} subject="${input.subject}" payload=${String(result.message)}`);
    }

    return {
      success: true,
      to: input.to,
      template: input.template,
      messageId: result.messageId
    };
  }

  private async renderTemplate(template: string, variables: Record<string, string | number>) {
    const templatePath = path.join(process.cwd(), 'apps', 'email-service', 'templates', `${template}.html`);
    let html = await fs.readFile(templatePath, 'utf8');

    for (const [key, value] of Object.entries(variables)) {
      const token = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(token, String(value));
    }

    return html;
  }
}
