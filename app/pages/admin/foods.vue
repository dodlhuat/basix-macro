<template>
  <div class="admin-foods page-content">
    <h1>{{ $t('admin.foods.title') }}</h1>

    <!-- Filter chips -->
    <div class="chips admin-foods__filters" role="tablist">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        role="tab"
        class="chip clickable"
        :class="{ selected: activeStatus === f.key }"
        :aria-selected="activeStatus === f.key"
        @click="setFilter(f.key)"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Load error -->
    <div v-if="loadError" class="admin-foods__load-error">
      <div class="alert alert-error" role="alert">{{ loadError }}</div>
      <button class="button button-outline" @click="loadSubmissions">{{ $t('common.retry') }}</button>
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="admin-foods__loading" aria-busy="true" :aria-label="$t('common.loading')">
      <span class="loading" aria-hidden="true" />
    </div>

    <!-- List -->
    <ul
      v-else-if="submissions.length"
      class="admin-foods__list"
      role="list"
      :aria-label="$t('admin.foods.title')"
    >
      <li
        v-for="(s, idx) in submissions"
        :key="s.id"
        class="admin-foods__item"
        :style="{ animationDelay: `${Math.min(idx, 9) * 35}ms` }"
      >
        <div
          class="admin-foods__item-row"
          :class="{ 'admin-foods__item-row--clickable': s.status === 'pending' }"
          :aria-expanded="s.status === 'pending' ? expandedId === s.id : undefined"
          @click="s.status === 'pending' && toggleExpand(s)"
        >
          <div class="admin-foods__item-body">
            <div class="admin-foods__item-title-line">
              <span class="admin-foods__item-name">{{ s.name }}</span>
              <span v-if="s.brand" class="admin-foods__item-brand">{{ s.brand }}</span>
            </div>
            <div class="admin-foods__item-nutrition">
              <span>{{ Math.round(s.calories_per_100g) }} kcal</span>
              <span class="admin-foods__dot" aria-hidden="true">·</span>
              <span>P {{ s.protein_per_100g }}g</span>
              <span class="admin-foods__dot" aria-hidden="true">·</span>
              <span>C {{ s.carbs_per_100g }}g</span>
              <span class="admin-foods__dot" aria-hidden="true">·</span>
              <span>F {{ s.fat_per_100g }}g</span>
            </div>
            <p v-if="s.status === 'rejected' && s.rejection_reason" class="admin-foods__item-reason">
              <AppIcon name="info" size="0.8rem" />
              {{ s.rejection_reason }}
            </p>
          </div>

          <div class="admin-foods__item-side">
            <span class="badge" :class="statusBadgeClass(s.status)">{{ statusLabel(s.status) }}</span>
            <AppIcon
              v-if="s.status === 'pending'"
              name="keyboard_arrow_down"
              size="1.15rem"
              class="admin-foods__item-chevron"
              :class="{ 'admin-foods__item-chevron--open': expandedId === s.id }"
            />
          </div>
        </div>

        <!-- Pending: inline edit + approve/reject -->
        <div v-if="s.status === 'pending'" class="admin-foods__actions">
          <template v-if="expandedId === s.id">
            <div class="admin-foods__edit-grid">
              <div class="form-group">
                <label :for="`name-${s.id}`">{{ $t('food.form.name') }}</label>
                <div class="input-group">
                  <input :id="`name-${s.id}`" v-model.trim="editForm.name" type="text">
                </div>
              </div>
              <div class="form-group">
                <label :for="`brand-${s.id}`">{{ $t('food.form.brand') }}</label>
                <div class="input-group">
                  <input :id="`brand-${s.id}`" v-model.trim="editForm.brand" type="text">
                </div>
              </div>
              <div class="form-group">
                <label :for="`kcal-${s.id}`">{{ $t('common.calories') }}</label>
                <div class="input-group">
                  <input :id="`kcal-${s.id}`" v-model.number="editForm.calories_per_100g" type="number" min="0" step="1">
                </div>
              </div>
              <div class="form-group">
                <label :for="`protein-${s.id}`">{{ $t('common.protein') }}</label>
                <div class="input-group">
                  <input :id="`protein-${s.id}`" v-model.number="editForm.protein_per_100g" type="number" min="0" step="0.1">
                </div>
              </div>
              <div class="form-group">
                <label :for="`carbs-${s.id}`">{{ $t('common.carbs') }}</label>
                <div class="input-group">
                  <input :id="`carbs-${s.id}`" v-model.number="editForm.carbs_per_100g" type="number" min="0" step="0.1">
                </div>
              </div>
              <div class="form-group">
                <label :for="`fat-${s.id}`">{{ $t('common.fat') }}</label>
                <div class="input-group">
                  <input :id="`fat-${s.id}`" v-model.number="editForm.fat_per_100g" type="number" min="0" step="0.1">
                </div>
              </div>
            </div>
            <div v-if="actionError && expandedId === s.id" class="alert alert-error admin-foods__action-error" role="alert">
              {{ actionError }}
            </div>
          </template>

          <div class="admin-foods__action-buttons">
            <button
              type="button"
              class="button button-outline admin-foods__reject-btn"
              :disabled="isSavingId === s.id"
              @click="openReject(s)"
            >
              <AppIcon name="close" size="1rem" />
              {{ $t('admin.foods.reject') }}
            </button>
            <button
              type="button"
              class="button button-primary admin-foods__approve-btn"
              :class="{ 'is-loading': isSavingId === s.id }"
              :disabled="isSavingId === s.id"
              @click="approve(s)"
            >
              <template v-if="isSavingId !== s.id">
                <AppIcon name="check" size="1rem" />
                {{ $t('admin.foods.approve') }}
              </template>
            </button>
          </div>
        </div>

        <!-- Approved/rejected: delete -->
        <div v-else class="admin-foods__actions admin-foods__actions--reviewed">
          <button type="button" class="button button-outline admin-foods__delete-btn" @click="openDelete(s)">
            <AppIcon name="delete" size="1rem" />
            {{ $t('common.delete') }}
          </button>
        </div>
      </li>
    </ul>

    <!-- Empty state -->
    <div v-else class="admin-foods__empty">
      <AppIcon :name="emptyIcon" size="2.5rem" class="admin-foods__empty-icon" />
      <p class="admin-foods__empty-title">{{ emptyTitle }}</p>
      <p class="admin-foods__empty-hint">{{ emptyHint }}</p>
    </div>
  </div>

  <!-- Reject sheet -->
  <Teleport to="body">
    <div
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': !!rejectTarget }"
      :aria-hidden="!rejectTarget"
    >
      <div class="bottom-sheet-backdrop" @click="closeReject" />

      <div
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('admin.foods.rejectSheet.title')"
      >
        <div class="bottom-sheet-handle" aria-hidden="true" />

        <div class="bottom-sheet-header has-divider">
          <p class="title">{{ $t('admin.foods.rejectSheet.title') }}</p>
          <button class="close button button-icon" :aria-label="$t('common.close')" @click="closeReject">
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>

        <div class="bottom-sheet-body">
          <p class="admin-foods__reject-target">{{ rejectTarget?.name }}</p>
          <div class="form-group">
            <label for="reject-reason">{{ $t('admin.foods.rejectSheet.reasonLabel') }}</label>
            <div class="input-group">
              <textarea
                id="reject-reason"
                v-model="rejectReason"
                rows="3"
                :placeholder="$t('admin.foods.rejectSheet.reasonPlaceholder')"
                :disabled="isRejecting"
              />
            </div>
          </div>
          <div v-if="rejectError" class="alert alert-error" role="alert">{{ rejectError }}</div>
        </div>

        <div class="bottom-sheet-footer">
          <div class="buttons">
            <button class="button" :disabled="isRejecting" @click="closeReject">{{ $t('common.cancel') }}</button>
            <button
              class="button button-error"
              :class="{ 'is-loading': isRejecting }"
              :disabled="isRejecting"
              @click="confirmReject"
            >
              <template v-if="!isRejecting">{{ $t('admin.foods.rejectSheet.confirm') }}</template>
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
        class="admin-foods__modal-backdrop"
        @click.self="closeDelete"
      >
        <div class="admin-foods__modal-card">
          <div class="admin-foods__modal-icon-wrap">
            <AppIcon name="delete_forever" size="2rem" class="admin-foods__modal-icon" />
          </div>
          <h2 class="admin-foods__modal-title">{{ $t('admin.foods.delete.title') }}</h2>
          <p class="admin-foods__modal-body">{{ $t('admin.foods.delete.body') }}</p>
          <div class="admin-foods__modal-actions">
            <button type="button" class="button button-outline" :disabled="isDeleting" @click="closeDelete">
              {{ $t('common.cancel') }}
            </button>
            <button
              type="button"
              class="button button-error"
              :class="{ 'is-loading': isDeleting }"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              <template v-if="!isDeleting">{{ $t('admin.foods.delete.confirm') }}</template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { AdminFoodSubmission, FoodSubmissionStatus, UpdateFoodSubmissionPayload } from '../../composables/useAdminFoodSubmissions'

definePageMeta({ middleware: ['admin'], title: 'Admin · Food Submissions' })

const { listSubmissions, updateSubmission, deleteSubmission } = useAdminFoodSubmissions()
const { showToast } = useToast()
const { t } = useI18n()

// ─── Filter ─────────────────────────────────────────────────────────────────

const FILTERS = computed(() => [
  { key: 'pending' as const,  label: t('admin.foods.filter.pending') },
  { key: 'approved' as const, label: t('admin.foods.filter.approved') },
  { key: 'rejected' as const, label: t('admin.foods.filter.rejected') },
])

const activeStatus = ref<FoodSubmissionStatus>('pending')

function setFilter(status: FoodSubmissionStatus) {
  if (activeStatus.value === status) return
  activeStatus.value = status
  expandedId.value = null
  loadSubmissions()
}

// ─── List state ─────────────────────────────────────────────────────────────

const submissions = ref<AdminFoodSubmission[]>([])
const isLoading = ref(true)
const loadError = ref('')

async function loadSubmissions() {
  isLoading.value = true
  loadError.value = ''
  try {
    submissions.value = await listSubmissions(activeStatus.value)
  } catch (error) {
    const err = error as { status: number | null, message: string }
    loadError.value = err.status === null ? t('auth.offlineError') : (err.message || t('admin.foods.errors.loadFailed'))
  } finally {
    isLoading.value = false
  }
}

function statusBadgeClass(status: FoodSubmissionStatus): string {
  if (status === 'approved') return 'badge-success'
  if (status === 'rejected') return 'badge-error'
  return 'badge-warning'
}

function statusLabel(status: FoodSubmissionStatus): string {
  return t(`admin.foods.status.${status}`)
}

function removeOrReplace(updated: AdminFoodSubmission) {
  const idx = submissions.value.findIndex(s => s.id === updated.id)
  if (idx === -1) return
  if (updated.status === activeStatus.value) {
    submissions.value[idx] = updated
  } else {
    submissions.value.splice(idx, 1)
  }
}

// ─── Empty state copy ─────────────────────────────────────────────────────────

const emptyIcon = computed(() => activeStatus.value === 'pending' ? 'inbox' : activeStatus.value === 'approved' ? 'check_circle' : 'block')
const emptyTitle = computed(() => t(`admin.foods.empty.${activeStatus.value}.title`))
const emptyHint = computed(() => t(`admin.foods.empty.${activeStatus.value}.hint`))

// ─── Inline edit (pending rows) ─────────────────────────────────────────────

const expandedId = ref<string | null>(null)
const editForm = reactive({
  name: '',
  brand: '',
  calories_per_100g: 0,
  protein_per_100g: 0,
  carbs_per_100g: 0,
  fat_per_100g: 0,
})
const actionError = ref('')
const isSavingId = ref<string | null>(null)

function toggleExpand(s: AdminFoodSubmission) {
  if (expandedId.value === s.id) {
    expandedId.value = null
    return
  }
  expandedId.value = s.id
  editForm.name = s.name
  editForm.brand = s.brand ?? ''
  editForm.calories_per_100g = s.calories_per_100g
  editForm.protein_per_100g = s.protein_per_100g
  editForm.carbs_per_100g = s.carbs_per_100g
  editForm.fat_per_100g = s.fat_per_100g
  actionError.value = ''
}

async function approve(s: AdminFoodSubmission) {
  isSavingId.value = s.id
  actionError.value = ''
  try {
    const payload: UpdateFoodSubmissionPayload = { status: 'approved' }
    if (expandedId.value === s.id) {
      payload.name = editForm.name.trim()
      payload.brand = editForm.brand.trim() || null
      payload.calories_per_100g = Number(editForm.calories_per_100g)
      payload.protein_per_100g = Number(editForm.protein_per_100g)
      payload.carbs_per_100g = Number(editForm.carbs_per_100g)
      payload.fat_per_100g = Number(editForm.fat_per_100g)
    }
    const updated = await updateSubmission(s.id, payload)
    removeOrReplace(updated)
    await showToast(t('admin.foods.toast.approved'))
    expandedId.value = null
  } catch (error) {
    const err = error as { status: number | null, message: string }
    actionError.value = err.status === null ? t('auth.offlineError') : (err.message || t('admin.foods.errors.saveFailed'))
  } finally {
    isSavingId.value = null
  }
}

// ─── Reject sheet ───────────────────────────────────────────────────────────

const rejectTarget = ref<AdminFoodSubmission | null>(null)
const rejectReason = ref('')
const rejectError = ref('')
const isRejecting = ref(false)

function openReject(s: AdminFoodSubmission) {
  rejectTarget.value = s
  rejectReason.value = ''
  rejectError.value = ''
}

function closeReject() {
  if (isRejecting.value) return
  rejectTarget.value = null
}

async function confirmReject() {
  if (!rejectTarget.value) return
  const reason = rejectReason.value.trim()
  if (!reason) {
    rejectError.value = t('admin.foods.rejectSheet.errorRequired')
    return
  }
  isRejecting.value = true
  try {
    const updated = await updateSubmission(rejectTarget.value.id, { status: 'rejected', rejection_reason: reason })
    removeOrReplace(updated)
    await showToast(t('admin.foods.toast.rejected'))
    rejectTarget.value = null
  } catch (error) {
    const err = error as { status: number | null, message: string }
    rejectError.value = err.status === null ? t('auth.offlineError') : (err.message || t('admin.foods.errors.saveFailed'))
  } finally {
    isRejecting.value = false
  }
}

// ─── Delete confirm (approved/rejected) ─────────────────────────────────────

const deleteTarget = ref<AdminFoodSubmission | null>(null)
const isDeleting = ref(false)

function openDelete(s: AdminFoodSubmission) {
  deleteTarget.value = s
}

function closeDelete() {
  if (isDeleting.value) return
  deleteTarget.value = null
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const target = deleteTarget.value
  isDeleting.value = true
  try {
    await deleteSubmission(target.id)
    submissions.value = submissions.value.filter(s => s.id !== target.id)
    await showToast(t('admin.foods.toast.deleted'))
    deleteTarget.value = null
  } catch (error) {
    const err = error as { status: number | null, message: string }
    await showToast(err.status === null ? t('auth.offlineError') : (err.message || t('admin.foods.errors.deleteFailed')), 'error')
  } finally {
    isDeleting.value = false
  }
}

// ─── Keyboard handling ──────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (deleteTarget.value) { closeDelete(); return }
  if (rejectTarget.value) { closeReject(); return }
  if (expandedId.value) expandedId.value = null
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  loadSubmissions()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

// ─── Animations ───────────────────────────────────────────────────────────────

@keyframes adminFoodIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .admin-foods__item {
    animation: none !important;
  }

  .admin-foods__item-chevron {
    transition: none !important;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

.admin-foods {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.875);
  padding-bottom: calc(#{$spacing} * 3);

  h1 { margin-bottom: 0; }
}

.admin-foods__filters {
  gap: calc(#{$spacing} * 0.5);
}

// ─── Loading / error ────────────────────────────────────────────────────────

.admin-foods__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(#{$spacing} * 3) 0;
}

.admin-foods__load-error {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.75);
  align-items: flex-start;
}

// ─── List ─────────────────────────────────────────────────────────────────────

.admin-foods__list {
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

.admin-foods__item {
  background: var(--primary-bg);
  animation: adminFoodIn 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }
}

.admin-foods__item-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing;
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 1);

  &--clickable {
    cursor: pointer;
    transition: background 120ms ease;

    &:active { background: var(--hover); }

    @media (hover: hover) {
      &:hover { background: var(--hover); }
    }
  }
}

.admin-foods__item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.admin-foods__item-title-line {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.admin-foods__item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  letter-spacing: -0.01em;
}

.admin-foods__item-brand {
  font-size: 0.72rem;
  color: var(--secondary-text);
}

.admin-foods__item-nutrition {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--secondary-text);
  font-variant-numeric: tabular-nums;
}

.admin-foods__dot {
  opacity: 0.5;
}

.admin-foods__item-reason {
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--error);
  line-height: 1.4;
  margin-top: 0.1rem;
}

.admin-foods__item-side {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.4);
  flex-shrink: 0;
}

.admin-foods__item-chevron {
  color: var(--secondary-text);
  transition: transform 200ms ease;

  &--open { transform: rotate(180deg); }
}

// ─── Pending actions / inline edit ─────────────────────────────────────────────

.admin-foods__actions {
  padding: 0 calc(#{$spacing} * 1) calc(#{$spacing} * 0.875);
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.65);

  &--reviewed {
    padding-top: 0;
    flex-direction: row;
    justify-content: flex-end;
  }
}

.admin-foods__edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(#{$spacing} * 0.6);

  .form-group { margin: 0; }
}

.admin-foods__action-error {
  margin: 0;
}

.admin-foods__action-buttons {
  display: flex;
  gap: calc(#{$spacing} * 0.6);
}

.admin-foods__reject-btn,
.admin-foods__approve-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.admin-foods__delete-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--error);
  border-color: color-mix(in srgb, var(--error) 35%, var(--divider));

  &:hover, &:focus-visible {
    background: var(--error-tint);
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.admin-foods__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.admin-foods__empty-icon {
  color: var(--secondary-text);
  opacity: 0.4;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.admin-foods__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
}

.admin-foods__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 24ch;
  line-height: 1.5;
}

// ─── Reject sheet ───────────────────────────────────────────────────────────

.admin-foods__reject-target {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary-text);
  margin: 0 0 calc(#{$spacing} * 0.75);
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

.admin-foods__modal-backdrop {
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

.admin-foods__modal-card {
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

.admin-foods__modal-icon-wrap {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--radius-full);
  background: var(--error-tint);
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-foods__modal-icon {
  color: var(--error);
}

.admin-foods__modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--primary-text);
}

.admin-foods__modal-body {
  font-size: 0.875rem;
  color: var(--secondary-text);
  line-height: 1.5;
  margin: 0;
}

.admin-foods__modal-actions {
  display: flex;
  gap: calc(#{$spacing} * 0.625);
  width: 100%;
  margin-top: calc(#{$spacing} * 0.25);

  .button { flex: 1; }
}

// ─── Modal transition ─────────────────────────────────────────────────────────

.admin-modal-enter-active {
  transition: opacity 0.25s ease;

  .admin-foods__modal-card {
    transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
  }
}

.admin-modal-leave-active {
  transition: opacity 0.2s ease;

  .admin-foods__modal-card {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.admin-modal-enter-from,
.admin-modal-leave-to {
  opacity: 0;

  .admin-foods__modal-card {
    transform: scale(0.9);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-modal-enter-active,
  .admin-modal-leave-active {
    transition: opacity 0.15s ease;

    .admin-foods__modal-card {
      transition: opacity 0.15s ease;
    }
  }

  .admin-modal-enter-from .admin-foods__modal-card,
  .admin-modal-leave-to .admin-foods__modal-card {
    transform: none;
  }
}
</style>
