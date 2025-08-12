Admin Actions module

Structure:
- `actions-page/ActionsPage.tsx` — paginated table with search, create, edit, delete
- `action-form-modal/ActionFormModal.tsx` — 80% modal with visual builder
- `action-config-builder/ActionConfigBuilder.tsx` — schema-inspired builder using Mantine controls and existing Condition Builder
- `delete-action-modal/DeleteActionModal.tsx` — confirmation modal requiring exact action name

APIs used are centralized in `src/config/api.config.ts` as ADMIN_ACTIONS_*.


