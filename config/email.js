require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
} catch (e) {
  console.log('⚠️  Email no configurado - funcionará sin envío de correos');
}

async function enviarEmail(opciones) {
  try {
    if (!transporter) return false;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Portal del Sol <noreply@portaldelsol.com>',
      ...opciones
    });
    return true;
  } catch (err) {
    console.error('⚠️  Error email (no crítico):', err.message);
    return false;
  }
}

async function enviarConfirmacionPago(email, nombre, lote, monto, archivo) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #007AFF; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0;">Portal del Sol 🏡</h1>
        <p style="margin: 5px 0 0;">Confirmación de Pago</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
        <h2 style="color: #333;">Hola, ${nombre}</h2>
        <p>Tu pago ha sido registrado exitosamente.</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #34C759;">
          <p><strong>Lote:</strong> ${lote}</p>
          <p><strong>Monto pagado:</strong> $${Number(monto).toLocaleString('es-CO')}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Se adjunta el comprobante de pago.</p>
        <p style="color: #007AFF; font-weight: bold;">Gracias por confiar en Portal del Sol</p>
      </div>
    </div>
  `;

  const mailOpts = {
    to: email,
    subject: `✅ Confirmación de Pago - Lote ${lote} | Portal del Sol`,
    html
  };

  if (archivo) {
    mailOpts.attachments = [{ filename: archivo.originalname, path: archivo.path }];
  }

  return await enviarEmail(mailOpts);
}

module.exports = { enviarEmail, enviarConfirmacionPago };
