export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const appName = "VoTex";
const supportEmail = "support@votex-system.com";
const helpUrl = "https://votex.example.com/help";
const defaultLoginUrl = `${process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "http://localhost:3000"}/login`;

const appendFooter = (message: string) =>
  `${message}\n\n---\nThis message was sent by ${appName}. If you did not request this email, please ignore it or contact support at ${supportEmail}.`;

// Color themes for different email types
const themes = {
  verification: {
    primary: "#6C5CE7",
    gradient: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)",
    accent: "#DFE6FF",
    icon: "🔐",
  },
  security: {
    primary: "#E17055",
    gradient: "linear-gradient(135deg, #E17055 0%, #FDCB6E 100%)",
    accent: "#FFF3E0",
    icon: "🔒",
  },
  success: {
    primary: "#00B894",
    gradient: "linear-gradient(135deg, #00B894 0%, #55EFC4 100%)",
    accent: "#E6FFF8",
    icon: "✅",
  },
  confirmation: {
    primary: "#0984E3",
    gradient: "linear-gradient(135deg, #0984E3 0%, #74B9FF 100%)",
    accent: "#E8F4FD",
    icon: "🗳️",
  },
  warning: {
    primary: "#FDCB6E",
    gradient: "linear-gradient(135deg, #F39C12 0%, #FDCB6E 100%)",
    accent: "#FFF8E1",
    icon: "⚠️",
  },
  danger: {
    primary: "#D63031",
    gradient: "linear-gradient(135deg, #D63031 0%, #FF7675 100%)",
    accent: "#FFE8E8",
    icon: "🚨",
  },
};

const htmlWrapper = (
  subject: string,
  body: string,
  theme: typeof themes.verification,
  iconEmoji: string,
  actionUrl: string,
) => {
  // Convert plain text to styled HTML
  const htmlBody = body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === "") return "<br/>";

      // Style code blocks (indented text)
      if (trimmed.match(/^\s{4,}/)) {
        const code = trimmed.trim();
        return `<div style="background: ${theme.accent}; border-left: 4px solid ${theme.primary}; padding: 16px 20px; margin: 16px 0; border-radius: 0 8px 8px 0; font-family: 'Courier New', monospace; font-size: 24px; font-weight: 700; letter-spacing: 3px; text-align: center; color: ${theme.primary};">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
      }

      // Style section headers
      if (trimmed.match(/^(Election|Ballot Receipt|Reason):/)) {
        const [label, ...value] = trimmed.split(":");
        return `<p style="margin: 12px 0 4px; font-weight: 600; color: ${theme.primary}; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">${label}:</p><p style="margin: 0 0 12px; font-size: 15px; color: #2d3436;">${value.join(":").trim()}</p>`;
      }

      // Style numbered lists
      if (trimmed.match(/^\d+\.\s/)) {
        return `<div style="display: flex; align-items: flex-start; margin: 8px 0; gap: 12px;">
          <span style="background: ${theme.primary}; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">${trimmed.match(/^\d+/)?.[0]}</span>
          <span style="font-size: 15px; color: #2d3436;">${trimmed
            .replace(/^\d+\.\s/, "")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</span>
        </div>`;
      }

      return `<p style="margin: 8px 0; font-size: 15px; color: #2d3436; line-height: 1.7;">${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <style>
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 8px 25px ${theme.primary}60; }
        50% { box-shadow: 0 8px 40px ${theme.primary}90, 0 0 60px ${theme.primary}30; }
      }
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .login-button {
        display: inline-block;
        position: relative;
        background: linear-gradient(135deg, ${theme.primary}, ${theme.primary}dd, #667eea, #764ba2);
        background-size: 300% 300%;
        animation: float 3s ease-in-out infinite, gradientShift 6s ease infinite, pulse 2s ease-in-out infinite;
        color: white;
        text-decoration: none;
        padding: 16px 40px;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        box-shadow: 0 8px 25px ${theme.primary}60;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        overflow: hidden;
        margin: 20px 0;
      }
      .login-button::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.3) 50%,
          transparent 70%
        );
        background-size: 200% 200%;
        animation: shimmer 3s infinite;
      }
      .login-button:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 12px 35px ${theme.primary}80, 0 0 50px ${theme.primary}20;
      }
      .login-button span {
        position: relative;
        z-index: 1;
      }
      .login-button .icon {
        display: inline-block;
        animation: float 2s ease-in-out infinite;
        animation-delay: 0.5s;
        margin-right: 8px;
      }
      .floating-badge {
        position: absolute;
        top: -10px;
        right: -10px;
        background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
        color: white;
        border-radius: 20px;
        padding: 4px 12px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        animation: float 2.5s ease-in-out infinite;
        z-index: 2;
      }
    </style>
  </head>
  <body style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; padding: 0; line-height: 1.6;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          
          <!-- Decorative top bar -->
          <table width="600" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 0;">
                <div style="height: 6px; background: ${theme.gradient}; border-radius: 16px 16px 0 0;"></div>
              </td>
            </tr>
          </table>
          
          <!-- Main card -->
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 0 0 16px 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
            
            <!-- Header with gradient -->
            <tr>
              <td style="padding: 0; background: ${theme.gradient}; position: relative; overflow: hidden;">
                <!-- Decorative circles -->
                <div style="position: absolute; top: -30px; right: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -40px; left: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
                
                <div style="padding: 40px 32px; text-align: center; position: relative;">
                  <div style="font-size: 48px; margin-bottom: 12px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${iconEmoji}</div>
                  <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <span style="color: #ffffff;">VoT</span><span style="color: ${theme.accent}; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 6px;">ex</span>
                  </h1>
                  <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.95; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: #ffffff;">Secure Digital Democracy</p>
                </div>
              </td>
            </tr>
            
            <!-- Subject banner -->
            <tr>
              <td style="padding: 24px 32px; background: ${theme.accent}; border-bottom: 3px solid ${theme.primary};">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: ${theme.primary}; display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 24px;">${iconEmoji}</span>
                  ${subject}
                </h2>
              </td>
            </tr>
            
            <!-- Content area -->
            <tr>
              <td style="padding: 32px;">
                <div style="font-size: 15px; line-height: 1.8; color: #2d3436;">
                  ${htmlBody}
                </div>
              </td>
            </tr>
            
            <!-- Login Button Section -->
            <tr>
              <td style="padding: 20px 32px; text-align: center;">
                <div style="position: relative; display: inline-block;">
                  <a href="${actionUrl}" class="login-button">
                    <span class="floating-badge">🔐 SECURE</span>
                    <span>
                      <span class="icon">🚀</span>
                      Access Your Dashboard
                      <span style="font-size: 14px; margin-left: 8px;">→</span>
                    </span>
                  </a>
                </div>
                <p style="margin: 16px 0 0; font-size: 13px; color: #636e72; font-style: italic;">
                  One-click secure access to your voting portal
                </p>
              </td>
            </tr>
            
            <!-- Divider -->
            <tr>
              <td style="padding: 0 32px;">
                <div style="height: 1px; background: linear-gradient(to right, transparent, ${theme.primary}40, transparent);"></div>
              </td>
            </tr>
            
            <!-- Security badge -->
            <tr>
              <td style="padding: 20px 32px; text-align: center;">
                <div style="display: inline-block; background: ${theme.accent}; border: 1px solid ${theme.primary}30; border-radius: 20px; padding: 10px 20px;">
                  <span style="color: ${theme.primary}; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
                    🔒 END-TO-END ENCRYPTED • ${new Date().getFullYear()} VOTEX SECURITY
                  </span>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px 32px; background: linear-gradient(to bottom, #fafbfc, #f0f2f5); border-top: 1px solid #e8edf5;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="padding-bottom: 16px; text-align: center;">
                      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #2d3436;">Need Assistance?</p>
                      <p style="margin: 0; font-size: 13px; color: #636e72;">Our dedicated support team is ready to help you</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                      <a href="${helpUrl}" style="display: inline-block; background: ${theme.primary}; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 25px; font-size: 13px; font-weight: 600; margin: 0 6px; box-shadow: 0 4px 12px ${theme.primary}40;">
                        📚 Help Center
                      </a>
                      <a href="mailto:${supportEmail}" style="display: inline-block; background: #ffffff; color: ${theme.primary}; text-decoration: none; padding: 10px 24px; border-radius: 25px; font-size: 13px; font-weight: 600; margin: 0 6px; border: 2px solid ${theme.primary};">
                        ✉️ Email Support
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align: center; border-top: 1px solid #e0e5ec; padding-top: 16px;">
                      <p style="margin: 0 0 4px; font-size: 11px; color: #a0aab4;">
                        This automated message was sent by ${appName} • Do not reply directly
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #a0aab4;">
                        © ${new Date().getFullYear()} VoTex Digital Democracy Platform • All rights reserved
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const createTemplate = (
  subject: string,
  message: string,
  theme: typeof themes.verification,
  iconEmoji: string,
  actionUrl: string = defaultLoginUrl,
): EmailTemplate => {
  const text = appendFooter(message);
  return {
    subject,
    text,
    html: htmlWrapper(subject, text, theme, iconEmoji, actionUrl),
  };
};

export const getRegistrationVerificationEmail = (
  code: string,
  actionUrl: string = defaultLoginUrl,
): EmailTemplate =>
  createTemplate(
    "Verify Your Email for VoTex Registration",
    `Dear Citizen,\n\nWelcome to VoTex! We're excited to have you join our secure voting platform.\n\nTo complete your email verification, please use this one-time security code:\n\n    ${code}\n\n⏰ This code expires in 10 minutes\n🔐 Never share this code with anyone\n\nIf you didn't request this, you can safely ignore this email.\n\nReady to make your voice heard? Let's get started!`,
    themes.verification,
    "🔐",
    actionUrl,
  );

export const getWelcomeEmail = (
  fullName: string,
  username: string,
  actionUrl: string = defaultLoginUrl,
): EmailTemplate =>
  createTemplate(
    "Welcome to VoTex platform - Account Created",
    `Dear ${fullName},\n\nYour voter account has been successfully created with username [ ${username} ].\n\nClick the login button below to sign in securely and continue with profile completion, identity verification, and ballot access.\n\nIf you did not create this account, please contact support immediately.\n\nThank you for taking this civic duty seriously.`,
    themes.verification,
    "🚀",
    actionUrl,
  );

export const getPasswordResetRequestEmail = (code: string): EmailTemplate =>
  createTemplate(
    "Reset Your VoTex Password",
    `Hello,\n\nWe received a request to reset your VoTex account password.\n\nUse this secure verification code to proceed:\n\n    ${code}\n\n⏰ Expires in 10 minutes\n🛡️ If you didn't request this, your account remains secure\n\nSecurity Tip: VoTex will never ask for your password via email.`,
    themes.security,
    "🔒",
  );

export const getPasswordChangedEmail = (fullName: string): EmailTemplate =>
  createTemplate(
    "Password Successfully Changed",
    `Dear ${fullName},\n\nYour VoTex account password has been updated successfully.\n\n✅ If this was you, no further action is needed\n🚨 If this wasn't you, secure your account immediately:\n\n    1. Reset your password\n    2. Contact our security team\n    3. Review recent account activity\n\nYour security is our top priority.`,
    themes.success,
    "✅",
  );

export const getVoteConfirmationEmail = (
  fullName: string,
  electionTitle: string,
  ballotId: string,
): EmailTemplate =>
  createTemplate(
    "Your Vote Has Been Counted! 🎉",
    `Dear ${fullName},\n\nCongratulations! Your voice has been heard. Your vote has been securely recorded and counted.\n\nElection: ${electionTitle}\nBallot Receipt: ${ballotId}\n\n📋 Save your receipt ID for verification\n🔍 Use it to confirm your vote in the final tally\n🗳️ Thank you for strengthening democracy!\n\nEvery vote matters. You made a difference today.`,
    themes.confirmation,
    "🗳️",
  );

export const getApprovalNotificationEmail = (fullName: string): EmailTemplate =>
  createTemplate(
    "Welcome Aboard! Registration Approved 🎊",
    `Dear ${fullName},\n\nGreat news! Your VoTex voter registration has been approved.\n\nYou're now ready to:\n\n    1. Complete biometric verification\n    2. Explore available elections\n    3. Cast your secure vote\n\nWe're thrilled to have you as part of our growing community of verified voters.\n\nYour journey in secure digital voting starts now!`,
    themes.success,
    "🎉",
  );

export const getRejectionNotificationEmail = (
  fullName: string,
  rejectionReason: string,
): EmailTemplate =>
  createTemplate(
    "Registration Update — Action Required",
    `Dear ${fullName},\n\nWe've reviewed your registration and some additional steps are needed.\n\nReason: ${rejectionReason}\n\nDon't worry — this is often a quick fix! Here's what to do:\n\n    1. Sign in to your VoTex portal\n    2. Review the detailed feedback\n    3. Follow the guided steps to update your information\n    4. Resubmit for approval\n\nNeed help? Our support team is standing by to assist you.`,
    themes.warning,
    "📋",
  );

export const getNewsletterSubscriptionEmail = (
  email: string,
  unsubscribeUrl: string,
): EmailTemplate =>
  createTemplate(
    "You are subscribed to VoTex Election Bulletins",
    `Dear subscriber,\n\nYour email address ${email} has been successfully subscribed to VoTex Election Bulletins.\n\nYou will now receive official election announcements, ballot reminders, verification notices, and important system updates.\n\nIf you did not request this subscription, you can remove it immediately using the unsubscribe link below.\n\nUnsubscribe link:\n    ${unsubscribeUrl}\n\nThank you for staying informed about the democratic process.`,
    themes.success,
    "📬",
    unsubscribeUrl,
  );

export const getNewsletterUnsubscribeEmail = (email: string): EmailTemplate =>
  createTemplate(
    "You have been unsubscribed from VoTex Election Bulletins",
    `Dear subscriber,\n\nThe email address ${email} has been removed from VoTex Election Bulletins.\n\nYou will no longer receive bulletin updates or election notices from this subscription list.\n\nIf this was a mistake, you may subscribe again at any time from the public site footer.`,
    themes.warning,
    "🛑",
  );
