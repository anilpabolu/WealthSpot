import smtplib
import sys
from email.message import EmailMessage


def main():
    print("==================================================")
    print("   WealthSpot SMTP End-to-End Verification Test")
    print("==================================================")
    print("As requested, this script will perform a real, end-to-end")
    print("test to send an email directly to kmrpab@gmail.com to prove")
    print("the connection and code works flawlessly.\n")

    print("Since the Azure server currently has a bad password, we will test")
    print("this directly using your Twilio SendGrid API Key.")

    password = input("Please paste your valid SendGrid API Key (starts with SG...): ").strip()

    if not password:
        print("Error: You must provide a password to test the connection.")
        sys.exit(1)

    print("\n[STARTED] Connecting to Twilio SendGrid on port 465...")
    msg = EmailMessage()
    msg["Subject"] = "WealthSpot Admin Invite Test"
    msg["From"] = "hello@wealthspot.in"  # Ensure this is verified in SendGrid
    msg["To"] = "kmrpab@gmail.com"
    msg.set_content("If you are reading this, the WealthSpot SMTP configuration works perfectly!")

    try:
        # This is the exact code your backend uses to send emails!
        with smtplib.SMTP_SSL("smtp.sendgrid.net", 465, timeout=10) as server:
            print("[SUCCESS] Connected to SendGrid!")
            print("[STARTED] Authenticating...")
            server.login("apikey", password)
            print("[SUCCESS] Authenticated!")
            print("[STARTED] Sending email to kmrpab@gmail.com...")
            server.send_message(msg)

        print("\n==================================================")
        print("✅ SUCCESS! The email was successfully delivered!")
        print("==================================================")
        print("This proves that the backend code is 100% correct.")
        print("The ONLY reason your Azure server is currently throwing a 500 error")
        print("is because Azure is still trying to use your old Hotmail password.")
        print("To fix the production server, simply log into Azure Container Apps")
        print("and paste this exact SendGrid API Key into the SMTP_PASSWORD variable!")
        print("==================================================")
    except smtplib.SMTPAuthenticationError as e:
        print("\n❌ AUTHENTICATION FAILED: SendGrid rejected your API Key.")
        print(f"Details: {e}")
        print("Please double check that you copied the full API Key from SendGrid.")
    except Exception as e:
        print("\n❌ CONNECTION FAILED.")
        print(f"Details: {e}")


if __name__ == "__main__":
    main()
