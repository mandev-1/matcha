package services

import (
	"fmt"
	"net/smtp"
	"matcha/internal/config"
)

// SendVerificationEmail sends an email verification link via MailHog
func SendVerificationEmail(cfg *config.Config, email, token string) error {
	// MailHog SMTP configuration (no auth required)
	addr := fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort)
	var auth smtp.Auth
	if cfg.SMTPUser != "" && cfg.SMTPPass != "" {
		auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
	}

	// Email content
	to := []string{email}
	subject := "Verify your Matcha account"
	verificationURL := fmt.Sprintf("http://localhost:3000/verify-email?token=%s", token)
	body := fmt.Sprintf(`
Welcome to Matcha!

Please verify your email address by clicking the link below:

%s

If you did not create an account, please ignore this email.

Best regards,
The Matcha Team
`, verificationURL)

	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n\r\n%s\r\n", email, subject, body))

	// Send email
	err := smtp.SendMail(addr, auth, cfg.FromEmail, to, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

