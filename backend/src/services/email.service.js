const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendPasswordResetEmail(
    utilisateur,
    resetUrl
) {
    const nomUtilisateur =
        utilisateur.prenom ||
        utilisateur.nom ||
        "Utilisateur";

    await transporter.sendMail({
        from: `"VOAMAMI - FID Toliara" <${process.env.SMTP_USER}>`,
        to: utilisateur.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `
Bonjour ${nomUtilisateur},

Une demande de réinitialisation de votre mot de passe
a été effectuée.

Cliquez sur le lien suivant :

${resetUrl}

Ce lien est valable pendant une heure et ne peut être utilisé
qu'une seule fois.

Si vous n'êtes pas à l'origine de cette demande,
ignorez simplement cet e-mail.
        `,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Réinitialisation du mot de passe</h2>

                <p>Bonjour ${nomUtilisateur},</p>

                <p>
                    Une demande de réinitialisation de votre mot de passe
                    a été effectuée.
                </p>

                <p>
                    <a
                        href="${resetUrl}"
                        style="
                            display:inline-block;
                            padding:12px 18px;
                            background:#2563eb;
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:6px;
                        "
                    >
                        Réinitialiser mon mot de passe
                    </a>
                </p>

                <p>
                    Ce lien est valable pendant une heure et ne peut être
                    utilisé qu'une seule fois.
                </p>

                <p>
                    Si vous n'êtes pas à l'origine de cette demande,
                    ignorez cet e-mail.
                </p>
            </div>
        `
    });
}

module.exports = {
    sendPasswordResetEmail
};
