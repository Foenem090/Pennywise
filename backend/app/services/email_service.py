"""
Penny Wise — Resend transactional email service.

All email dispatch is performed via Resend's REST API using HTTPX.
No SMTP configuration is required.

Design principles
-----------------
- DB records are always saved before email dispatch is attempted.
- A delivery failure never rolls back a successful DB write.
- API keys are never logged or included in exception messages.
- User-supplied text is HTML-escaped before insertion into templates.
- Each public send_* coroutine returns an EmailResult that callers
  inspect rather than raising — routes decide how to surface failures.
"""

import html
import logging
from dataclasses import dataclass
from typing import Optional

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"

# ── Brand constants (kept in sync with Tailwind theme) ─────────────────────
BRAND_BLUE = "#1a6fca"
BRAND_GREEN = "#118c4f"
BRAND_DARK = "#0d1b2e"
BRAND_LIGHT_BG = "#f0f6ff"
BRAND_TEXT = "#1e293b"
BRAND_MUTED = "#64748b"


# ── Result type ────────────────────────────────────────────────────────────

@dataclass
class EmailResult:
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None


# ── Core dispatch ──────────────────────────────────────────────────────────

async def _dispatch(
    *,
    to: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> EmailResult:
    """
    Send a single email via the Resend REST API.

    Returns an EmailResult — never raises.  Callers must check .success.
    """
    if not settings.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY is not configured. Email to %s was skipped.", to
        )
        return EmailResult(success=False, error="Email service is not configured.")

    if not settings.MAIL_FROM:
        logger.warning("MAIL_FROM is not configured. Email to %s was skipped.", to)
        return EmailResult(success=False, error="Sender address is not configured.")

    payload = {
        "from": settings.MAIL_FROM,
        "to": [to],
        "subject": subject,
        "html": html_body,
        "text": text_body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                RESEND_API_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
            )

        if response.status_code in (200, 201):
            data = response.json()
            message_id = data.get("id")
            logger.info("Email delivered to %s — id=%s", to, message_id)
            return EmailResult(success=True, message_id=message_id)

        # Resend returned a 4xx/5xx — log the status only, never the key
        logger.error(
            "Resend API returned %s for email to %s: %s",
            response.status_code,
            to,
            response.text[:200],
        )
        return EmailResult(
            success=False,
            error=f"Email provider returned status {response.status_code}.",
        )

    except httpx.TimeoutException:
        logger.error("Resend API timed out sending to %s.", to)
        return EmailResult(success=False, error="Email delivery timed out.")
    except httpx.RequestError as exc:
        # exc.__class__.__name__ is safe; never log exc.args which may carry auth data
        logger.error("Network error sending to %s: %s", to, exc.__class__.__name__)
        return EmailResult(success=False, error="Network error during email delivery.")


# ── HTML template helpers ──────────────────────────────────────────────────

def _base_template(*, title: str, body_html: str) -> str:
    """Wrap arbitrary body HTML in the Penny Wise branded email shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{html.escape(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:{BRAND_LIGHT_BG};
             font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:{BRAND_TEXT};">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:{BRAND_LIGHT_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table role="presentation" width="100%" style="max-width:600px;
               background:#ffffff;border-radius:12px;
               box-shadow:0 4px 24px rgba(26,111,202,0.10);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,{BRAND_BLUE} 0%,{BRAND_GREEN} 100%);
                       padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:26px;font-weight:800;
                         letter-spacing:-0.5px;color:#ffffff;">
                💰 Penny Wise
              </h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.80);
                        letter-spacing:0.5px;text-transform:uppercase;">
                Crypto IRA &amp; Wealth Management
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:{BRAND_LIGHT_BG};padding:24px 40px;
                       text-align:center;border-top:1px solid #e2eaf4;">
              <p style="margin:0;font-size:12px;color:{BRAND_MUTED};line-height:1.6;">
                © 2026 Penny Wise Financial Technologies, Inc.<br/>
                You received this email because you interacted with
                <a href="#" style="color:{BRAND_BLUE};text-decoration:none;">pennywise.finance</a>.<br/>
                This is an automated message — please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _divider() -> str:
    return (
        f'<hr style="border:none;border-top:1px solid #e2eaf4;margin:28px 0;" />'
    )


def _cta_button(*, text: str, href: str = "#") -> str:
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:24px 0 8px;">
      <a href="{href}"
         style="display:inline-block;background:linear-gradient(135deg,{BRAND_BLUE},{BRAND_GREEN});
                color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;
                border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
        {html.escape(text)}
      </a>
    </td>
  </tr>
</table>"""


def _highlight_box(*, content: str) -> str:
    return f"""
<div style="background:{BRAND_LIGHT_BG};border-left:4px solid {BRAND_BLUE};
            border-radius:6px;padding:16px 20px;margin:20px 0;
            font-size:14px;line-height:1.6;color:{BRAND_TEXT};">
  {content}
</div>"""


# ── Newsletter email templates ─────────────────────────────────────────────

def _newsletter_welcome_html(email: str) -> str:
    safe_email = html.escape(email)
    body = f"""
<h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:{BRAND_DARK};">
  Welcome to Penny Wise! 🎉
</h2>
<p style="margin:0 0 20px;font-size:15px;color:{BRAND_MUTED};line-height:1.6;">
  You're now part of a growing community of forward-thinking investors
  building tax-advantaged retirement wealth through cryptocurrency.
</p>

{_highlight_box(content=f"""
  <strong>Subscribed address:</strong> {safe_email}<br/>
  <strong>What to expect:</strong> Weekly market insights, IRA strategy guides,
  staking yield updates, and exclusive Penny Wise platform announcements.
""")}

<h3 style="margin:28px 0 12px;font-size:16px;font-weight:700;color:{BRAND_DARK};">
  What you get as a subscriber
</h3>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  {''.join(f"""
  <tr>
    <td style="padding:8px 0;vertical-align:top;">
      <span style="display:inline-block;width:28px;height:28px;border-radius:50%;
                   background:linear-gradient(135deg,{BRAND_BLUE},{BRAND_GREEN});
                   color:#fff;font-size:13px;font-weight:700;line-height:28px;
                   text-align:center;">{icon}</span>
    </td>
    <td style="padding:8px 0 8px 12px;font-size:14px;line-height:1.5;color:{BRAND_TEXT};">
      <strong>{title}</strong><br/><span style="color:{BRAND_MUTED};">{desc}</span>
    </td>
  </tr>""" for icon, title, desc in [
      ("📈", "Real-time market commentary", "Weekly breakdowns of BTC, ETH, and top-50 altcoins."),
      ("🏦", "IRA strategy guides", "Roth vs Traditional IRA planning for crypto investors."),
      ("💎", "Exclusive staking opportunities", "Early access to new high-yield pools and APY updates."),
      ("🔐", "Security & custody updates", "Platform transparency reports and security advisories."),
  ])}
</table>

{_divider()}

{_cta_button(text="Explore Penny Wise →", href=f"{settings.FRONTEND_URL.rstrip('/')}")}

<p style="margin:24px 0 0;font-size:13px;color:{BRAND_MUTED};line-height:1.6;text-align:center;">
  To unsubscribe at any time, reply with "unsubscribe" in the subject line.
</p>"""
    return _base_template(title="Welcome to Penny Wise", body_html=body)


def _newsletter_welcome_text(email: str) -> str:
    base_url = settings.FRONTEND_URL.rstrip('/')
    return f"""Welcome to Penny Wise!

You have successfully subscribed using: {email}

What to expect:
- Weekly market insights and commentary
- IRA strategy guides for crypto investors
- Staking yield updates and new pool announcements
- Security and platform transparency reports

Visit Penny Wise: {base_url}

To unsubscribe, reply with "unsubscribe" in the subject line.

© 2026 Penny Wise Financial Technologies, Inc.
"""


def _newsletter_admin_html(email: str, subscriber_count_note: str = "") -> str:
    safe_email = html.escape(email)
    body = f"""
<h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:{BRAND_DARK};">
  📬 New Newsletter Subscriber
</h2>
<p style="margin:0 0 20px;font-size:14px;color:{BRAND_MUTED};">
  A new user has subscribed to the Penny Wise newsletter.
</p>

{_highlight_box(content=f"""
  <strong>Email:</strong> {safe_email}<br/>
  {f"<strong>Note:</strong> {html.escape(subscriber_count_note)}" if subscriber_count_note else ""}
""")}

<p style="font-size:13px;color:{BRAND_MUTED};margin:20px 0 0;">
  This is an automated admin notification from the Penny Wise platform.
  No action is required.
</p>"""
    return _base_template(title="New Newsletter Subscriber — Admin", body_html=body)


def _newsletter_admin_text(email: str) -> str:
    return f"""[Penny Wise Admin] New Newsletter Subscriber

Email: {email}

This is an automated admin notification. No action required.
"""


# ── Contact email templates ────────────────────────────────────────────────

def _contact_ack_html(name: str, email: str) -> str:
    safe_name = html.escape(name)
    safe_email = html.escape(email)
    body = f"""
<h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:{BRAND_DARK};">
  We received your message, {safe_name}! ✅
</h2>
<p style="margin:0 0 20px;font-size:15px;color:{BRAND_MUTED};line-height:1.6;">
  Thank you for reaching out to Penny Wise. A member of our specialist team
  will review your inquiry and respond within <strong>1–2 business days</strong>.
</p>

{_highlight_box(content=f"""
  <strong>Name:</strong> {safe_name}<br/>
  <strong>Email:</strong> {safe_email}<br/>
  <strong>Submitted:</strong> Today
""")}

<h3 style="margin:28px 0 12px;font-size:16px;font-weight:700;color:{BRAND_DARK};">
  While you wait
</h3>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  {''.join(f"""
  <tr>
    <td style="padding:8px 0;vertical-align:top;">
      <span style="font-size:18px;">{icon}</span>
    </td>
    <td style="padding:8px 0 8px 12px;font-size:14px;line-height:1.5;color:{BRAND_TEXT};">
      <strong>{title}</strong><br/><span style="color:{BRAND_MUTED};">{desc}</span>
    </td>
  </tr>""" for icon, title, desc in [
      ("📖", "Browse our FAQ", "Answers to our most common IRA and staking questions."),
      ("📊", "Track live markets", "Real-time crypto prices and 24-hour performance."),
      ("💰", "Calculate your returns", "Estimate APY earnings with our interactive staking calculator."),
  ])}
</table>

{_divider()}

{_cta_button(text="Visit Penny Wise →", href=f"{settings.FRONTEND_URL.rstrip('/')}")}

<p style="margin:24px 0 0;font-size:13px;color:{BRAND_MUTED};text-align:center;">
  If you did not submit this inquiry, you can safely ignore this email.
</p>"""
    return _base_template(title="We received your message — Penny Wise", body_html=body)


def _contact_ack_text(name: str, email: str) -> str:
    base_url = settings.FRONTEND_URL.rstrip('/')
    return f"""Hi {name},

Thank you for contacting Penny Wise!

We have received your inquiry from: {email}

A member of our specialist team will respond within 1–2 business days.

In the meantime:
- FAQ: {base_url}/faq
- Markets: {base_url}/markets
- Earn calculator: {base_url}/earn

© 2026 Penny Wise Financial Technologies, Inc.
"""


def _contact_admin_html(name: str, email: str, message: str) -> str:
    safe_name = html.escape(name)
    safe_email = html.escape(email)
    # HTML-escape and preserve newlines in the user's message
    safe_message = html.escape(message).replace("\n", "<br/>")
    body = f"""
<h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:{BRAND_DARK};">
  📩 New Contact Inquiry
</h2>
<p style="margin:0 0 20px;font-size:14px;color:{BRAND_MUTED};">
  A visitor has submitted the Penny Wise contact form.
</p>

{_highlight_box(content=f"""
  <strong>Name:</strong> {safe_name}<br/>
  <strong>Email:</strong> <a href="mailto:{safe_email}"
    style="color:{BRAND_BLUE};text-decoration:none;">{safe_email}</a>
""")}

<h3 style="margin:20px 0 10px;font-size:15px;font-weight:700;color:{BRAND_DARK};">
  Message
</h3>
<div style="background:#f8fafc;border:1px solid #e2eaf4;border-radius:8px;
            padding:16px 20px;font-size:14px;line-height:1.7;color:{BRAND_TEXT};">
  {safe_message}
</div>

<p style="font-size:13px;color:{BRAND_MUTED};margin:24px 0 0;">
  This is an automated admin notification from the Penny Wise platform.<br/>
  Reply directly to <strong>{safe_email}</strong> to respond to this inquiry.
</p>"""
    return _base_template(title="New Contact Inquiry — Admin", body_html=body)


def _contact_admin_text(name: str, email: str, message: str) -> str:
    return f"""[Penny Wise Admin] New Contact Inquiry

Name: {name}
Email: {email}

Message:
{message}

---
Reply to {email} to respond to this inquiry.
This is an automated admin notification.
"""


# ── Public API ─────────────────────────────────────────────────────────────

async def send_newsletter_welcome(email: str) -> EmailResult:
    """Send a branded welcome email to a newly subscribed user."""
    return await _dispatch(
        to=email,
        subject="Welcome to Penny Wise — Your crypto IRA journey starts here 🚀",
        html_body=_newsletter_welcome_html(email),
        text_body=_newsletter_welcome_text(email),
    )


async def send_newsletter_admin_notification(email: str) -> EmailResult:
    """Notify the administrator of a new newsletter subscription."""
    if not settings.ADMIN_EMAIL:
        logger.warning("ADMIN_EMAIL not configured — skipping admin notification.")
        return EmailResult(success=False, error="Admin email not configured.")
    return await _dispatch(
        to=settings.ADMIN_EMAIL,
        subject=f"[Penny Wise] New subscriber: {email}",
        html_body=_newsletter_admin_html(email),
        text_body=_newsletter_admin_text(email),
    )


async def send_contact_acknowledgement(name: str, email: str) -> EmailResult:
    """Send an auto-reply confirmation to the person who submitted the contact form."""
    return await _dispatch(
        to=email,
        subject="We received your message — Penny Wise will be in touch shortly",
        html_body=_contact_ack_html(name, email),
        text_body=_contact_ack_text(name, email),
    )


async def send_contact_admin_notification(
    name: str, email: str, message: str
) -> EmailResult:
    """Send a full contact inquiry notification to the administrator."""
    if not settings.ADMIN_EMAIL:
        logger.warning("ADMIN_EMAIL not configured — skipping admin notification.")
        return EmailResult(success=False, error="Admin email not configured.")
    return await _dispatch(
        to=settings.ADMIN_EMAIL,
        subject=f"[Penny Wise] New inquiry from {name}",
        html_body=_contact_admin_html(name, email, message),
        text_body=_contact_admin_text(name, email, message),
    )
