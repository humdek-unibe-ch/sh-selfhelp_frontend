/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# Editing a page together

Audience: CMS administrators and content editors who edit pages.
Status: active.
Applies to: SelfHelp2 admin page editor (frontend 0.1.76 with core 0.1.49 and later).
Last verified: 2026-11-20.

Only one person edits a page at a time. This keeps two people from overwriting each other's work in the same draft.

## When you open a page

If you may change the page, the editor reserves it for you as soon as it opens. You do not click anything. While the editor is open and its browser tab is in front, the reservation is renewed in the background. When you leave the page, close the tab or open another page, it is given up.

## When someone else is editing

If another person is editing the page, you see the page read-only. A banner at the top says **"<name> is editing this page"**. Every field is disabled and nothing can be saved, deleted or published.

To continue anyway, press **Take over** and confirm. The other person then can no longer save their changes to the page, and they see a banner that you took over.

## When your editing ends

The banner also tells you why you were stopped:

- **"<name> took over editing this page."** Someone else pressed Take over. Press Take over again to get the page back.
- **"Your editing session ended."** You did not change anything on the page for 15 minutes, so it was released for others. Press **Edit again** to carry on.
- **"Nobody is editing this page now."** The person who was editing left. Press **Start editing** to take the page.

A page whose tab stays in the background is not renewed. When you come back to the tab, the editor reserves the page again if it is still free.

## When the page changed under you

Sometimes a save is refused because the page changed since you opened it, for example by a take-over or by an import. You see **"This page was changed elsewhere"**. The editor loads the latest version. What you typed in the open panel stays on screen, so you can look at the new state and save your values again on top of it.

## If you can only read pages

Without the right to change a page you see the page read-only, as before, and no lock controls. You never reserve a page and you never stop anyone.

## Related

- [Admin user guide](index.md)
- Developer view: [live sync](../developer/live-sync.md)
