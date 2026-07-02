<template>
  <div class="admin-users page-content">
    <h1>{{ $t('admin.users.title') }}</h1>

    <!-- Load error -->
    <div v-if="loadError" class="admin-users__load-error">
      <div class="alert alert-error" role="alert">{{ loadError }}</div>
      <button class="button button-outline" @click="loadUsers">{{ $t('common.retry') }}</button>
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="admin-users__loading" aria-busy="true" :aria-label="$t('common.loading')">
      <span class="loading" aria-hidden="true" />
    </div>

    <!-- List -->
    <ul
      v-else-if="users.length"
      class="admin-users__list"
      role="list"
      :aria-label="$t('admin.users.title')"
    >
      <li
        v-for="(u, idx) in users"
        :key="u.id"
        class="admin-users__item"
        :style="{ animationDelay: `${Math.min(idx, 9) * 35}ms` }"
        @click="openEditSheet(u)"
      >
        <div class="admin-users__item-body">
          <span class="admin-users__item-name">{{ u.name }}</span>
          <span class="admin-users__item-email">{{ u.email }}</span>
        </div>

        <div class="admin-users__item-meta">
          <span class="badge" :class="u.role === 'admin' ? 'badge-info' : ''">
            {{ u.role === 'admin' ? $t('admin.users.role.admin') : $t('admin.users.role.user') }}
          </span>

          <span v-if="isSelf(u)" class="admin-users__you-badge">{{ $t('admin.users.you') }}</span>
          <button
            v-else
            class="admin-users__item-delete button button-icon"
            :aria-label="`${u.name} ${$t('common.delete')}`"
            @click.stop="openDeleteConfirm(u)"
          >
            <AppIcon name="delete" size="1.05rem" />
          </button>

          <AppIcon name="chevron_right" size="1.05rem" class="admin-users__item-chevron" />
        </div>
      </li>
    </ul>

    <!-- Empty state -->
    <div v-else class="admin-users__empty">
      <AppIcon name="group_off" size="2.5rem" class="admin-users__empty-icon" />
      <p class="admin-users__empty-title">{{ $t('admin.users.empty.title') }}</p>
      <p class="admin-users__empty-hint">{{ $t('admin.users.empty.hint') }}</p>
    </div>
  </div>

  <!-- FAB -->
  <button
    class="admin-users__fab"
    :aria-label="$t('admin.users.add.cta')"
    @click="openAddSheet"
  >
    <AppIcon name="person_add" size="1.4rem" />
  </button>

  <!-- Add/edit bottom sheet -->
  <Teleport to="body">
    <div
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': sheetVisible }"
      :aria-hidden="!sheetVisible"
    >
      <div class="bottom-sheet-backdrop" @click="closeSheet" />

      <div
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="sheetMode === 'add' ? $t('admin.users.add.title') : $t('admin.users.edit.title')"
      >
        <div class="bottom-sheet-handle" aria-hidden="true" />

        <div class="bottom-sheet-header has-divider">
          <p class="title">{{ sheetMode === 'add' ? $t('admin.users.add.title') : $t('admin.users.edit.title') }}</p>
          <button class="close button button-icon" :aria-label="$t('common.close')" @click="closeSheet">
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>

        <div class="bottom-sheet-body">
          <form class="admin-users__form" novalidate @submit.prevent="handleSubmit">
            <div class="form-group" :class="{ 'admin-users__field--error': errors.name }">
              <label for="user-name">{{ $t('admin.users.form.name') }}</label>
              <div class="input-group">
                <input
                  id="user-name"
                  v-model.trim="form.name"
                  type="text"
                  autocomplete="name"
                  :disabled="isSaving"
                  :aria-invalid="!!errors.name"
                  @blur="validateField('name')"
                >
              </div>
              <p v-if="errors.name" class="admin-users__error-msg" role="alert">{{ errors.name }}</p>
            </div>

            <div class="form-group" :class="{ 'admin-users__field--error': errors.email }">
              <label for="user-email">{{ $t('admin.users.form.email') }}</label>
              <div class="input-group">
                <input
                  id="user-email"
                  v-model.trim="form.email"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  :disabled="isSaving"
                  :aria-invalid="!!errors.email"
                  @blur="validateField('email')"
                >
              </div>
              <p v-if="errors.email" class="admin-users__error-msg" role="alert">{{ errors.email }}</p>
            </div>

            <div class="form-group" :class="{ 'admin-users__field--error': errors.password }">
              <label for="user-password">
                {{ $t('admin.users.form.password') }}
                <span v-if="sheetMode === 'edit'" class="admin-users__optional">({{ $t('common.optional') }})</span>
              </label>
              <div class="input-group">
                <input
                  id="user-password"
                  v-model="form.password"
                  type="password"
                  autocomplete="new-password"
                  :disabled="isSaving"
                  :aria-invalid="!!errors.password"
                  @blur="validateField('password')"
                >
              </div>
              <p v-if="errors.password" class="admin-users__error-msg" role="alert">{{ errors.password }}</p>
              <p v-else class="admin-users__hint">
                {{ sheetMode === 'add' ? $t('admin.users.form.passwordHintAdd') : $t('admin.users.form.passwordHintEdit') }}
              </p>
            </div>

            <div class="admin-users__section">
              <p class="admin-users__section-label">{{ $t('admin.users.form.role') }}</p>
              <div class="chips">
                <button
                  type="button"
                  class="chip clickable"
                  :class="{ selected: form.role === 'user' }"
                  :disabled="isSaving || isSelfEditing"
                  @click="form.role = 'user'"
                >
                  {{ $t('admin.users.role.user') }}
                </button>
                <button
                  type="button"
                  class="chip clickable"
                  :class="{ selected: form.role === 'admin' }"
                  :disabled="isSaving || isSelfEditing"
                  @click="form.role = 'admin'"
                >
                  {{ $t('admin.users.role.admin') }}
                </button>
              </div>
              <p v-if="isSelfEditing" class="admin-users__hint">{{ $t('admin.users.form.roleLockedSelf') }}</p>
            </div>

            <div v-if="submitError" class="alert alert-error admin-users__alert" role="alert">
              {{ submitError }}
            </div>
          </form>
        </div>

        <div class="bottom-sheet-footer">
          <div class="buttons">
            <button class="button" :disabled="isSaving" @click="closeSheet">{{ $t('common.cancel') }}</button>
            <button
              class="button button-primary"
              :class="{ 'is-loading': isSaving }"
              :disabled="isSaving"
              @click="handleSubmit"
            >
              <template v-if="!isSaving">
                <AppIcon name="check" size="1rem" />
                {{ $t('common.save') }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete confirm modal -->
  <Teleport to="body">
    <Transition name="admin-modal">
      <div
        v-if="deleteTarget"
        class="admin-users__modal-backdrop"
        @click.self="closeDeleteConfirm"
      >
        <div class="admin-users__modal-card">
          <div class="admin-users__modal-icon-wrap">
            <AppIcon name="delete_forever" size="2rem" class="admin-users__modal-icon" />
          </div>
          <h2 class="admin-users__modal-title">{{ $t('admin.users.delete.title') }}</h2>
          <p class="admin-users__modal-body">
            {{ $t('admin.users.delete.body', { name: deleteTarget.name }) }}
          </p>
          <div class="admin-users__modal-actions">
            <button
              type="button"
              class="button button-outline"
              :disabled="isDeleting"
              @click="closeDeleteConfirm"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              type="button"
              class="button button-error"
              :class="{ 'is-loading': isDeleting }"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              <template v-if="!isDeleting">{{ $t('admin.users.delete.confirm') }}</template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { AdminUser, UpdateUserPayload } from '../../composables/useAdminUsers'

definePageMeta({ middleware: ['admin'], title: 'Admin · Users' })

const { listUsers, createUser, updateUser, deleteUser } = useAdminUsers()
const { showToast } = useToast()
const authStore = useAuthStore()
const { t } = useI18n()

// ─── List state ────────────────────────────────────────────────────────────

const users = ref<AdminUser[]>([])
const isLoading = ref(true)
const loadError = ref('')

async function loadUsers() {
  isLoading.value = true
  loadError.value = ''
  try {
    users.value = await listUsers()
  } catch (error) {
    const err = error as { status: number | null, message: string }
    loadError.value = err.status === null ? t('auth.offlineError') : (err.message || t('admin.users.errors.loadFailed'))
  } finally {
    isLoading.value = false
  }
}

function isSelf(u: AdminUser): boolean {
  return authStore.user?.id === u.id
}

// ─── Add/edit sheet ─────────────────────────────────────────────────────────

const sheetVisible = ref(false)
const sheetMode = ref<'add' | 'edit'>('add')
const editingUser = ref<AdminUser | null>(null)
const isSelfEditing = computed(() => sheetMode.value === 'edit' && !!editingUser.value && isSelf(editingUser.value))

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user' as 'admin' | 'user',
})
const errors = reactive<{ name: string, email: string, password: string }>({ name: '', email: '', password: '' })
const isSaving = ref(false)
const submitError = ref('')

function resetForm() {
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = 'user'
  errors.name = ''
  errors.email = ''
  errors.password = ''
  submitError.value = ''
}

function openAddSheet() {
  resetForm()
  sheetMode.value = 'add'
  editingUser.value = null
  sheetVisible.value = true
  document.body.style.overflow = 'hidden'
}

function openEditSheet(u: AdminUser) {
  resetForm()
  sheetMode.value = 'edit'
  editingUser.value = u
  form.name = u.name
  form.email = u.email
  form.role = u.role
  sheetVisible.value = true
  document.body.style.overflow = 'hidden'
}

function dismissSheet() {
  sheetVisible.value = false
  document.body.style.overflow = ''
  setTimeout(() => { editingUser.value = null }, 420)
}

function closeSheet() {
  if (isSaving.value) return
  dismissSheet()
}

function validateField(field: 'name' | 'email' | 'password') {
  if (field === 'name') {
    errors.name = form.name.trim() ? '' : t('admin.users.form.errorName')
  } else if (field === 'email') {
    const val = form.email.trim()
    errors.email = val && /^\S+@\S+\.\S+$/.test(val) ? '' : t('admin.users.form.errorEmail')
  } else {
    const needsPassword = sheetMode.value === 'add' || form.password.length > 0
    errors.password = !needsPassword || form.password.length >= 8 ? '' : t('admin.users.form.errorPassword')
  }
}

function validateAll(): boolean {
  validateField('name')
  validateField('email')
  validateField('password')
  return !errors.name && !errors.email && !errors.password
}

async function handleSubmit() {
  submitError.value = ''
  if (!validateAll()) return
  isSaving.value = true

  try {
    if (sheetMode.value === 'add') {
      const created = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
      users.value = [created, ...users.value]
      await showToast(t('admin.users.toast.created'))
      dismissSheet()
    } else if (editingUser.value) {
      const target = editingUser.value
      const payload: UpdateUserPayload = {}
      if (form.name !== target.name) payload.name = form.name
      if (form.email !== target.email) payload.email = form.email
      if (form.password) payload.password = form.password
      if (!isSelfEditing.value && form.role !== target.role) payload.role = form.role

      if (Object.keys(payload).length > 0) {
        const updated = await updateUser(target.id, payload)
        const idx = users.value.findIndex(x => x.id === updated.id)
        if (idx !== -1) users.value[idx] = updated
        await showToast(t('admin.users.toast.updated'))
      }
      dismissSheet()
    }
  } catch (error) {
    const err = error as { status: number | null, message: string }
    submitError.value = err.status === null ? t('auth.offlineError') : (err.message || t('admin.users.errors.saveFailed'))
  } finally {
    isSaving.value = false
  }
}

// ─── Delete confirm ─────────────────────────────────────────────────────────

const deleteTarget = ref<AdminUser | null>(null)
const isDeleting = ref(false)

function openDeleteConfirm(u: AdminUser) {
  deleteTarget.value = u
}

function closeDeleteConfirm() {
  if (isDeleting.value) return
  deleteTarget.value = null
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const target = deleteTarget.value
  isDeleting.value = true
  try {
    await deleteUser(target.id)
    users.value = users.value.filter(u => u.id !== target.id)
    await showToast(t('admin.users.toast.deleted'))
    deleteTarget.value = null
  } catch (error) {
    const err = error as { status: number | null, message: string }
    await showToast(err.status === null ? t('auth.offlineError') : (err.message || t('admin.users.errors.deleteFailed')), 'error')
  } finally {
    isDeleting.value = false
  }
}

// ─── Keyboard handling ──────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (deleteTarget.value) { closeDeleteConfirm(); return }
  if (sheetVisible.value) closeSheet()
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  loadUsers()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

// ─── Animations ───────────────────────────────────────────────────────────────

@keyframes adminUserIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes adminFabPop {
  0%   { opacity: 0; transform: scale(0.6); }
  70%  { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .admin-users__item,
  .admin-users__fab {
    animation: none !important;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

.admin-users {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.875);
  padding-bottom: calc(#{$spacing} * 4 + 3.5rem);

  h1 {
    margin-bottom: 0;
  }
}

// ─── Loading / error ────────────────────────────────────────────────────────

.admin-users__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(#{$spacing} * 3) 0;
}

.admin-users__load-error {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.75);
  align-items: flex-start;
}

// ─── List ─────────────────────────────────────────────────────────────────────

.admin-users__list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--divider);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.admin-users__item {
  display: flex;
  align-items: center;
  gap: $spacing;
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 1);
  background: var(--primary-bg);
  cursor: pointer;
  transition: background 120ms ease;
  animation: adminUserIn 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }

  &:active { background: var(--hover); }

  @media (hover: hover) {
    &:hover { background: var(--hover); }
  }
}

.admin-users__item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.admin-users__item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.admin-users__item-email {
  font-size: 0.72rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-users__item-meta {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  flex-shrink: 0;
}

.admin-users__you-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding: 0 0.15rem;
}

.admin-users__item-delete {
  color: var(--secondary-text);
  width: 2rem;
  height: 2rem;
  padding: 0;
  transition: color 150ms ease;

  &:hover,
  &:focus-visible {
    color: var(--error);
  }
}

.admin-users__item-chevron {
  color: var(--secondary-text);
  opacity: 0.6;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.admin-users__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.admin-users__empty-icon {
  color: var(--secondary-text);
  opacity: 0.4;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.admin-users__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
}

.admin-users__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 24ch;
  line-height: 1.5;
}

// ─── FAB ──────────────────────────────────────────────────────────────────────

.admin-users__fab {
  position: fixed;
  right: 1.25rem;
  bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-color);
  color: var(--accent-color-text);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.18),
    0 1px 4px rgba(0, 0, 0, 0.12);
  animation: adminFabPop 400ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
  transition: transform 200ms ease, box-shadow 200ms ease;
  z-index: 50;

  &:hover,
  &:focus-visible {
    transform: scale(1.08);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.22),
      0 2px 6px rgba(0, 0, 0, 0.14);
  }

  &:active { transform: scale(0.96); }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 3px;
  }
}

// ─── Sheet form ───────────────────────────────────────────────────────────────

.admin-users__form {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.85);
}

.admin-users__section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
}

.admin-users__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

.admin-users__optional {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--secondary-text);
}

.admin-users__hint {
  font-size: 0.75rem;
  color: var(--secondary-text);
  margin-top: 0.2rem;
}

.admin-users__field--error {
  label { color: var(--error); }

  .input-group {
    border-color: var(--error);
    box-shadow: 0 0 0 2px var(--error-tint);
  }
}

.admin-users__error-msg {
  font-size: 0.75rem;
  color: var(--error);
  margin-top: 0.2rem;
}

.admin-users__alert {
  margin-top: calc(#{$spacing} * -0.25);
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

.admin-users__modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing;
}

.admin-users__modal-card {
  background: var(--secondary-background);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.5);
  width: 100%;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(#{$spacing} * 0.75);
  text-align: center;
}

.admin-users__modal-icon-wrap {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--radius-full);
  background: var(--error-tint);
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-users__modal-icon {
  color: var(--error);
}

.admin-users__modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--primary-text);
}

.admin-users__modal-body {
  font-size: 0.875rem;
  color: var(--secondary-text);
  line-height: 1.5;
  margin: 0;
}

.admin-users__modal-actions {
  display: flex;
  gap: calc(#{$spacing} * 0.625);
  width: 100%;
  margin-top: calc(#{$spacing} * 0.25);

  .button { flex: 1; }
}

// ─── Modal transition ─────────────────────────────────────────────────────────

.admin-modal-enter-active {
  transition: opacity 0.25s ease;

  .admin-users__modal-card {
    transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
  }
}

.admin-modal-leave-active {
  transition: opacity 0.2s ease;

  .admin-users__modal-card {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.admin-modal-enter-from,
.admin-modal-leave-to {
  opacity: 0;

  .admin-users__modal-card {
    transform: scale(0.9);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-modal-enter-active,
  .admin-modal-leave-active {
    transition: opacity 0.15s ease;

    .admin-users__modal-card {
      transition: opacity 0.15s ease;
    }
  }

  .admin-modal-enter-from .admin-users__modal-card,
  .admin-modal-leave-to .admin-users__modal-card {
    transform: none;
  }
}
</style>
