# Design references

18 boards exported from the Claude Design canvas. Each screen exists as:

- `screens/NN-name.png` — the render, 390×844 pt at 2×.
- `screens/NN-name.html` — the static markup (inline styles). Use it to read exact colours, spacing, font sizes and copy; do not copy the HTML into React Native, rebuild with RN components and `src/theme.ts`.

Sample data frozen in every screen: today = Sunday 27 Sept 2026, day 24 of a 28-day cycle started 4 Sept, partner name Sophie. Real screens compute everything from the state.

| File | Screen | Route |
| --- | --- | --- |
| 01-onboarding-1-bienvenue | Welcome + mode | `onboarding/welcome` |
| 02-onboarding-2-dernieres-regles | Last period + lengths | `onboarding/last-period` |
| 03-onboarding-3-rappels | Reminders + permission | `onboarding/reminders` |
| 04-aujourdhui | Today, partner mode | `(tabs)/index` |
| 05-aujourdhui-retard | Today, period late | `(tabs)/index` |
| 06-confirmer-debut-regles | Confirm period start (sheet) | `confirm` |
| 07-aujourdhui-mode-mon-cycle-irregulier | Today, self mode + irregular banner | `(tabs)/index` |
| 08-today-en | Today in English | `(tabs)/index` |
| 09-calendrier | Calendar | `(tabs)/calendar` |
| 10-guide-liste-phases | Phase list | `guide/index` |
| 11-guide-fiche-spm | Phase sheet (template for all 5) | `guide/[phase]` |
| 12-notifications | The 3 notifications (reference only) | — |
| 13-reglages | Settings (scrollable; shows the "notifications off" banner) | `(tabs)/settings/index` |
| 14-historique | Cycle history | `(tabs)/settings/history` |
| 15-verrouillage-face-id | Lock screen | `lock` |
| 16-sync-envoyer-qr | Send sync (QR / link) | `sync/share` |
| 17-sync-mise-a-jour-recue | Sync received | `sync/receive` |
| 18-logo | Logo (C3, P + half moon) | — |

Known gap in the mockups: in 13, the last row ("Tout effacer") sits under the tab bar; the real screen is a ScrollView with bottom inset.
