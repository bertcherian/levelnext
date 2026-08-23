# Manager Effectiveness Organisation Setup Validation

- The Manager Effectiveness dashboard displays a persistent **Organisation Setup** entry in the desktop sidebar.
- The dashboard displays a visible **Set up your organisation** card with an **Add organisation information** action when no tenant membership exists.
- The organisation destination `/onboard?returnTo=/manager` renders the **Create an Organisation** and **Join an Organisation** choices, with a return path to Manager Effectiveness.
- The creation flow captures the workspace name first, then routes organisation administrators to the Enterprise Onboarding wizard for company profile, leadership context, branding, documents, and team invitations.
- Browser inspection of `/manager` confirmed that both the sidebar **Organisation Setup** control and the dashboard **Add organisation information** control render as links to `/onboard?returnTo=/manager`. The browser session then expired and correctly returned to the existing sign-in page, preserving the intended protected-route behavior.
- In a fresh authenticated Broadridge browser session, clicking the sidebar **Organisation Setup** control successfully navigated to `/onboard?returnTo=/manager` and displayed the **Create an Organisation** and **Join an Organisation** choices.
- In the same authenticated session, clicking the dashboard organisation-information action successfully opened `/organisation`, where the existing organisation profile is displayed for management.
