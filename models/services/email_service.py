import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 465))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
EMAIL_TO   = os.getenv("EMAIL_TO")

def send_emergency_email(recipient_email, emergency_data):
    print(f"[EMAIL] Sending emergency alert to {recipient_email}...")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Emergency Alert for {emergency_data.get('name', 'Unknown')}"
    msg["From"] = EMAIL_USER
    msg["To"] = recipient_email

    html = f"""
    <p>Hello Emergency Team,</p>
    <p>New alert from <strong>{emergency_data.get('name', 'Unknown')}</strong>:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
      <tr><td style="padding:8px;border:1px solid #d0d0d0;background:#f9f9f9;"><strong>Emergency Message:</strong></td>
          <td style="padding:8px;border:1px solid #d0d0d0;">{emergency_data.get('emergencyMessage','')}</td></tr>
      <tr><td style="padding:8px;border:1px solid #d0d0d0;background:#f9f9f9;"><strong>Phone:</strong></td>
          <td style="padding:8px;border:1px solid #d0d0d0;">{emergency_data.get('phone','N/A')}</td></tr>
      <tr><td style="padding:8px;border:1px solid #d0d0d0;background:#f9f9f9;"><strong>Emergency Contact:</strong></td>
          <td style="padding:8px;border:1px solid #d0d0d0;">{emergency_data.get('emergencyPhone','N/A')}</td></tr>
      <tr><td style="padding:8px;border:1px solid #d0d0d0;background:#f9f9f9;"><strong>Address:</strong></td>
          <td style="padding:8px;border:1px solid #d0d0d0;">{emergency_data.get('address','N/A')}</td></tr>
      <tr><td style="padding:8px;border:1px solid #d0d0d0;background:#f9f9f9;"><strong>Location:</strong></td>
          <td style="padding:8px;border:1px solid #d0d0d0;">
            Lat: {emergency_data.get('latitude','N/A')}, Lon: {emergency_data.get('longitude','N/A')}<br>
            <a href="{emergency_data.get('mapsLink','#')}">View on Google Maps</a>
          </td></tr>
    </table>
    <p style="color:#666;font-size:0.9em;">Emergency Response System</p>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, recipient_email, msg.as_string())
        print(f"[EMAIL] Alert sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send: {e}")
        return False
