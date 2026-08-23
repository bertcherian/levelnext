# Manager Effectiveness Magic-Link Validation Notes

The Manager Effectiveness sign-up route at `/signup?platform=mep` renders the new optional Organisation field alongside the name and email inputs.

The post-verification onboarding URL `/onboard?returnTo=%2Fmanager&org=Broadridge` opens the existing **Create your Organisation** step and prefills the organisation input with **Broadridge**. This preserves the requested manager destination while making company setup the first action for a new organisation administrator.
