package com.apihour.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

  private final JavaMailSender mailSender;

  @Value("${app.mail.from}")
  private String fromEmail;

  @Value("${app.frontend.url}")
  private String frontendUrl;

  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  public void sendPasswordResetEmail(String toEmail, String resetToken) {
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(fromEmail);
      message.setTo(toEmail);
      message.setSubject("Réinitialisation de votre mot de passe - aPI-Hour");

      String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

      String emailBody = String.format(
          "Bonjour,\n\n" +
              "Vous avez demandé à réinitialiser votre mot de passe pour votre compte aPI-Hour.\n\n" +
              "Cliquez sur le lien suivant pour réinitialiser votre mot de passe :\n" +
              "%s\n\n" +
              "Ce lien expirera dans 1 heure.\n\n" +
              "Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.\n\n" +
              "Cordialement,\n" +
              "L'équipe aPI-Hour",
          resetLink);

      message.setText(emailBody);

      mailSender.send(message);
      logger.info("Password reset email sent successfully to: {}", toEmail);

    } catch (MailException e) {
      logger.error("Failed to send password reset email to: {}", toEmail, e);
      throw new RuntimeException("Failed to send email", e);
    }
  }

  public void sendWelcomeEmail(String toEmail, String userName) {
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(fromEmail);
      message.setTo(toEmail);
      message.setSubject("Bienvenue sur aPI-Hour !");

      String emailBody = String.format(
          "Bonjour %s,\n\n" +
              "Bienvenue sur aPI-Hour !\n\n" +
              "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter et commencer à suivre vos heures de travail.\n\n"
              +
              "Connectez-vous ici : %s/login\n\n" +
              "Cordialement,\n" +
              "L'équipe aPI-Hour",
          userName,
          frontendUrl);

      message.setText(emailBody);

      mailSender.send(message);
      logger.info("Welcome email sent successfully to: {}", toEmail);

    } catch (MailException e) {
      logger.error("Failed to send welcome email to: {}", toEmail, e);
    }
  }
}
