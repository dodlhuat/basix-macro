<template>
  <div class="activity page-content">

    <!-- ─── Hero: today's burned calories ────────────────────────────────────── -->
    <section class="activity__hero" aria-label="Heute verbrannte Kalorien">
      <template v-if="entries.length">
        <div class="activity__hero-body">
          <div class="activity__value-group">
            <span class="activity__eyebrow">
              <AppIcon name="local_fire_department" size="0.9em" class="activity__eyebrow-icon" />
              {{ $t('activity.todayBurned') }}
            </span>
            <div class="activity__value-row">
              <span class="activity__value">{{ todayBurned }}</span>
              <span class="activity__unit">kcal</span>
            </div>
          </div>
          <div class="activity__hero-meta">
            <span v-if="todayCount > 0" class="badge badge-warning">
              {{ todayCount }} {{ todayCount === 1 ? $t('activity.entryToday') : $t('activity.entriesToday') }}
            </span>
            <span v-if="latestEntry" class="activity__latest">
              {{ latestEntry.name }} · {{ Math.round(latestEntry.calories_burned) }} kcal
            </span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="activity__hero-empty">
          <AppIcon name="directions_run" size="2rem" />
          <p>{{ $t('activity.noEntry') }}</p>
        </div>
      </template>
    </section>

    <!-- ─── Add entry form ────────────────────────────────────────────────────── -->
    <section class="activity__form">
      <p class="activity__section-label">{{ $t('activity.addEntry') }}</p>

      <div class="form-group">
        <label class="activity__field-label" for="activity-name">{{ $t('activity.nameLabel') }}</label>
        <div class="input-group">
          <input
            id="activity-name"
            v-model="newName"
            type="text"
            :placeholder="$t('activity.namePlaceholder')"
            aria-label="Bezeichnung der Aktivität"
            maxlength="60"
          >
        </div>
      </div>

      <div class="activity__form-row">
        <div class="form-group activity__form-group">
          <label class="activity__field-label" for="activity-calories">{{ $t('activity.caloriesLabel') }}</label>
          <div class="input-group">
            <input
              id="activity-calories"
              v-model="newCaloriesStr"
              type="number"
              inputmode="numeric"
              min="1"
              step="1"
              placeholder="300"
              aria-label="Verbrannte Kalorien"
              class="activity__num-input"
            >
            <span class="activity__input-unit">kcal</span>
          </div>
        </div>
        <div class="form-group activity__form-group">
          <label class="activity__field-label" for="activity-duration">
            {{ $t('activity.durationLabel') }}
            <span class="activity__optional">({{ $t('common.optional') }})</span>
          </label>
          <div class="input-group">
            <input
              id="activity-duration"
              v-model="newDurationStr"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              placeholder="30"
              aria-label="Dauer in Minuten"
              class="activity__num-input"
            >
            <span class="activity__input-unit">min</span>
          </div>
        </div>
      </div>

      <button
        class="button button-primary activity__form-submit"
        :disabled="isSaving || !isFormValid"
        :aria-busy="isSaving"
        @click="handleSave"
      >
        <span v-if="isSaving" class="loading" aria-hidden="true" />
        <template v-else>
          <AppIcon name="add" size="1rem" />
          {{ $t('common.add') }}
        </template>
      </button>
    </section>

    <!-- ─── History list ──────────────────────────────────────────────────────── -->
    <section class="activity__history" aria-label="Verlauf">
      <p class="activity__section-label">{{ $t('activity.history') }}</p>
      <ul
        v-if="recentEntries.length"
        class="activity__list"
        role="list"
        aria-label="Aktivitätseinträge"
      >
        <li
          v-for="(entry, idx) in recentEntries"
          :key="entry.id"
          class="activity__item"
          :style="{ animationDelay: `${Math.min(idx, 14) * 30}ms` }"
        >
          <div class="activity__item-body">
            <span class="activity__item-name">{{ entry.name }}</span>
            <span class="activity__item-meta-text">
              {{ formatDate(entry.date) }}<template v-if="entry.duration_min"> · {{ entry.duration_min }} min</template>
            </span>
          </div>
          <div class="activity__item-meta">
            <span class="activity__item-kcal">
              {{ Math.round(entry.calories_burned) }}<span class="activity__item-unit"> kcal</span>
            </span>
            <button
              class="button button-icon activity__item-delete"
              :aria-label="`Eintrag ${entry.name} löschen`"
              @click="handleDelete(entry.id)"
            >
              <AppIcon name="delete" size="1.125rem" />
            </button>
          </div>
        </li>
      </ul>
      <div v-else class="activity__empty">
        <AppIcon name="directions_run" size="2.5rem" class="activity__empty-icon" />
        <p class="activity__empty-title">{{ $t('activity.empty') }}</p>
        <p class="activity__empty-hint">{{ $t('activity.emptyHint') }}</p>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Activity' })

const activityStore = useActivityStore()
const { locale } = useI18n()

const { entries, latestEntry } = storeToRefs(activityStore)

const todayStr: string = toLocalDateStr(new Date())

// ─── Hero ─────────────────────────────────────────────────────────────────────

const todayBurned = computed(() => Math.round(activityStore.totalBurnedForDate(todayStr)))
const todayCount = computed(() => entries.value.filter(e => e.date === todayStr).length)

// ─── Form state ───────────────────────────────────────────────────────────────
// No date field by design (mirrors the body-fat page's rationale): logging a
// burned-calorie activity is a "just did this" action, not something users
// routinely backfill — so it silently defaults to today.

const newName = ref('')
const newCaloriesStr = ref('')
const newDurationStr = ref('')
const isSaving = ref(false)

const isFormValid = computed(() => {
  const cal = parseFloat(newCaloriesStr.value)
  return newName.value.trim().length > 0 && !isNaN(cal) && cal > 0
})

async function handleSave() {
  if (!isFormValid.value || isSaving.value) return
  isSaving.value = true
  try {
    const duration = newDurationStr.value ? parseFloat(newDurationStr.value) : NaN
    await activityStore.addEntry(
      newName.value.trim(),
      parseFloat(newCaloriesStr.value),
      todayStr,
      !isNaN(duration) && duration > 0 ? duration : undefined,
    )
    newName.value = ''
    newCaloriesStr.value = ''
    newDurationStr.value = ''
  }
  finally {
    isSaving.value = false
  }
}

// ─── History list ─────────────────────────────────────────────────────────────

const recentEntries = computed(() => entries.value.slice(0, 30))

async function handleDelete(id: string) {
  await activityStore.deleteEntry(id)
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const loc = locale.value === 'en' ? 'en-US' : 'de-DE'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(loc, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await activityStore.loadEntries()
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

// ─── Animations ───────────────────────────────────────────────────────────────

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes itemIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .activity__hero,
  .activity__form,
  .activity__history,
  .activity__item {
    animation: none !important;
  }
}

// ─── Page layout ──────────────────────────────────────────────────────────────

.activity {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1.25);
  padding-bottom: calc(#{$spacing} * 3);
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
// Static warm wash (not category-driven like weight/body-fat) — activity
// logging has no "good/bad" health category, so the tint just signals
// "energy" rather than a status judgement.

.activity__hero {
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--warning-tint) 100%);
  padding: calc(#{$spacing} * 1.5) calc(#{$spacing} * 1.25) calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.activity__hero-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing;
}

.activity__value-group {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.activity__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text);
}

.activity__eyebrow-icon {
  color: var(--macro-calories);
}

.activity__value-row {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.activity__value {
  font-size: clamp(2.8rem, 13vw, 3.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--primary-text);
  line-height: 1;
}

.activity__unit {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--secondary-text);
  letter-spacing: -0.02em;
  align-self: flex-end;
  padding-bottom: 0.35rem;
  flex-shrink: 0;
}

.activity__hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: calc(#{$spacing} * 0.5);
  padding-top: 0.3rem;
  flex-shrink: 0;
  text-align: right;
}

.activity__latest {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--secondary-text);
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity__hero-empty {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.75);
  color: var(--secondary-text);

  p {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }
}

// ─── Section label (shared) ───────────────────────────────────────────────────

.activity__section-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text);
  margin: 0 0 calc(#{$spacing} * 0.75);
}

// ─── Form ─────────────────────────────────────────────────────────────────────

.activity__form {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
}

.activity__form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(#{$spacing} * 0.75);
  margin-bottom: calc(#{$spacing} * 0.75);
}

.activity__form-group {
  margin-bottom: 0;
  min-width: 0;
}

.activity__field-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  margin-bottom: calc(#{$spacing} * 0.35);
}

.activity__optional {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0;
  opacity: 0.75;
}

.activity__num-input {
  // Remove spinner arrows on number inputs
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.activity__input-unit {
  padding: 0 calc(#{$spacing} * 0.625);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-text);
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
}

.activity__form-submit {
  width: 100%;
  margin-top: calc(#{$spacing} * 0.25);
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.75rem;
}

// ─── History ──────────────────────────────────────────────────────────────────

.activity__history {
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
}

.activity__list {
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

.activity__item {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.75);
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 1);
  background: var(--primary-bg);
  animation: itemIn 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }
}

.activity__item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.activity__item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-text);
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity__item-meta-text {
  font-size: 0.72rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity__item-meta {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.375);
  flex-shrink: 0;
}

.activity__item-kcal {
  font-size: 1rem;
  font-weight: 700;
  color: var(--macro-calories);
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.activity__item-unit {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--secondary-text);
  letter-spacing: 0;
}

.activity__item-delete {
  color: var(--secondary-text);
  opacity: 0.4;
  width: 2rem;
  height: 2rem;
  padding: 0;
  flex-shrink: 0;
  transition: color 150ms ease, opacity 150ms ease;

  &:hover,
  &:focus-visible {
    opacity: 1;
    color: var(--error);
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.activity__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.activity__empty-icon {
  color: var(--secondary-text);
  opacity: 0.35;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.activity__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  margin: 0;
}

.activity__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 26ch;
  line-height: 1.5;
  margin: 0;
}
</style>
